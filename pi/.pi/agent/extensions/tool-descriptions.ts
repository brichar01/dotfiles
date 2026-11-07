/**
 * Extra insurance for models trained on other harnesses.
 *
 * 1. `read` and `bash` are replaced with copies that keep the same execution
 *    behavior but use descriptions that steer the model toward the native file
 *    tools.
 * 2. `edit` is replaced with a copy that keeps pi's execution semantics but
 *    accepts the argument shapes other harnesses taught the model:
 *
 *      Claude Code / Anthropic      pi
 *      file_path                    path
 *      old_string                   edits[].oldText
 *      new_string                   edits[].newText
 *      replace_all                  replace_all (implemented here)
 *
 *    It also folds a single edit object into `edits[]`, accepts snake_case and
 *    str_replace_editor spellings, unwraps double-wrapped arguments, and rewrites
 *    `str_replace_editor`'s `command` field. Everything is normalized before
 *    validation, so pi's own `prepareArguments` shims still apply downstream.
 */
import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import type { EditToolDetails, ExtensionAPI, ToolDefinition } from "@earendil-works/pi-coding-agent";
import {
	createBashToolDefinition,
	createEditToolDefinition,
	createReadToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

const READ_DESCRIPTION = `Read the contents of a file. This is the supported way to inspect file contents; do not use cat, sed, head, tail, awk, grep, or Python to read files.

Supports text files and images (jpg, png, gif, webp, bmp). Images are sent as attachments. For text files, output is truncated to 2000 lines or 50KB (whichever is hit first). Use offset/limit for large files. When you need the full file, continue with offset until complete.`;

const READ_GUIDELINES = [
	"Use read for every file inspection instead of cat, sed, head, tail, awk, grep, or Python.",
	"For large files, use offset and limit and continue with offset. Do not switch to sed when read output is truncated.",
];

const BASH_DESCRIPTION = `Execute a shell command. Use this only to run programs, tests, builds, package managers, git, and other commands whose output is not file contents.

Do not use bash to inspect file contents, create files, or modify files. Use read for file contents, write for new or fully rewritten files, and edit for targeted changes. In particular, avoid cat, sed, head, tail, awk, grep, Python, and shell redirection for file work.`;

const BASH_GUIDELINES = [
	"Use bash only to execute commands, not to read, create, or modify files.",
	"Do not use cat, sed, head, tail, awk, grep, Python, or shell redirection for file inspection or edits; use read, write, or edit.",
	"You can inspect PI_* environment variables for current model and session details.",
];

// ---------------------------------------------------------------------------
// edit: parameter schema
// ---------------------------------------------------------------------------

const replaceEditSchema = Type.Object(
	{
		oldText: Type.String({
			description:
				"Exact text for one targeted replacement. It must be unique in the original file and must not overlap with any other edits[].oldText in the same call.",
		}),
		newText: Type.String({ description: "Replacement text for this targeted edit." }),
		replace_all: Type.Optional(
			Type.Boolean({
				description:
					"Replace every occurrence of this edit's oldText instead of requiring it to be unique. Off by default.",
			}),
		),
	},
	{},
);

const editSchema = Type.Object(
	{
		path: Type.String({ description: "Path to the file to edit (relative or absolute)" }),
		edits: Type.Array(replaceEditSchema, {
			description:
				"One or more targeted replacements. Each edit is matched against the original file, not incrementally. Do not include overlapping or nested edits. If two changes touch the same block or nearby lines, merge them into one edit instead.",
		}),
		replace_all: Type.Optional(
			Type.Boolean({
				description:
					"Claude-compatible shortcut: replace every occurrence of each edit's oldText. Individual edits may set their own replace_all instead.",
			}),
		),
	},
	{},
);

type EditArg = { oldText: string; newText: string; replace_all?: boolean };
type EditArgs = { path: string; edits: EditArg[]; replace_all?: boolean };
type BareEditInput = { path: string; edits: { oldText: string; newText: string }[] };

const EDIT_DESCRIPTION = `Edit a single file using exact text replacement. Every edits[].oldText must match a unique, non-overlapping region of the original file. If two changes affect the same block or nearby lines, merge them into one edit instead of emitting overlapping edits. Do not include large unchanged regions just to connect distant changes.

Claude-style arguments are accepted too: file_path, old_string, new_string, replace_all, plus str_replace_editor's command/old_str/new_str.`;

// ---------------------------------------------------------------------------
// edit: alias map
// ---------------------------------------------------------------------------

/** First match wins, so pi's own spelling takes precedence over aliases. */
const PATH_KEYS = ["path", "file_path", "filePath", "filepath", "filename", "file_name", "file"];
const OLD_KEYS = ["oldText", "old_text", "old_string", "oldString", "old_str", "oldStr", "search", "find"];
const NEW_KEYS = [
	"newText",
	"new_text",
	"new_string",
	"newString",
	"new_str",
	"newStr",
	"replacement",
	"replace",
	"content",
];
const REPLACE_ALL_KEYS = ["replace_all", "replaceAll", "all", "global"];
const WRAPPER_KEYS = ["edit", "edit_args", "arguments", "input", "params"];

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function firstString(record: Record<string, unknown>, keys: readonly string[]): string | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "string") return value;
	}
	return undefined;
}

function firstBoolean(record: Record<string, unknown>, keys: readonly string[]): boolean | undefined {
	for (const key of keys) {
		const value = record[key];
		if (typeof value === "boolean") return value;
		if (value === "true") return true;
		if (value === "false") return false;
	}
	return undefined;
}

function describeExpectedEdit(): string {
	return `{"oldText": "...", "newText": "..."} (aliases: old_string/new_string, old_str/new_str)`;
}

function normalizeOneEdit(value: unknown, index: number, path: string): EditArg {
	const where = `edits[${index}] of ${path || "edit"}`;

	// Some models emit positional pairs: [[oldText, newText], ...].
	if (Array.isArray(value)) {
		if (value.length === 2 && typeof value[0] === "string" && typeof value[1] === "string") {
			return { oldText: value[0], newText: value[1] };
		}
		throw new Error(`edit: ${where} is an array. Expected ${describeExpectedEdit()}.`);
	}
	if (!isRecord(value)) {
		throw new Error(`edit: ${where} is not an object. Expected ${describeExpectedEdit()}.`);
	}

	const oldText = firstString(value, OLD_KEYS);
	const newText = firstString(value, NEW_KEYS);
	if (oldText === undefined || newText === undefined) {
		const missing = oldText === undefined ? "oldText" : "newText";
		throw new Error(`edit: ${where} has no ${missing}. Expected ${describeExpectedEdit()}.`);
	}

	const replaceAll = firstBoolean(value, REPLACE_ALL_KEYS);
	return replaceAll === undefined ? { oldText, newText } : { oldText, newText, replace_all: replaceAll };
}

/** Reject a call that mixes files; pi's edit edits exactly one file. */
function resolvePath(
	args: Record<string, unknown>,
	rawEdits: unknown[],
): string {
	const declared = firstString(args, PATH_KEYS);
	const perEdit = new Set<string>();
	for (const edit of rawEdits) {
		if (!isRecord(edit)) continue;
		const entryPath = firstString(edit, PATH_KEYS);
		if (entryPath !== undefined) perEdit.add(entryPath);
	}
	if (perEdit.size > 1) {
		throw new Error(
			`edit: this call names ${perEdit.size} different files (${[...perEdit].join(", ")}). pi's edit edits one file per call; split it into one call per file.`,
		);
	}
	if (declared !== undefined && perEdit.size === 1 && !perEdit.has(declared)) {
		throw new Error(
			`edit: path "${declared}" and the edits' own path "${[...perEdit][0]}" disagree. One call edits one file.`,
		);
	}
	const path = declared ?? [...perEdit][0];
	if (path === undefined) {
		throw new Error(
			'edit: no file path. Include "path" (or the Claude alias "file_path") next to "edits".',
		);
	}
	return path;
}

/** Explain the str_replace_editor commands pi's edit cannot express. */
function rejectForeignCommand(args: Record<string, unknown>): void {
	const command = typeof args.command === "string" ? args.command.trim() : "";
	if (!command) return;
	if (command === "view" || command === "read") {
		throw new Error("edit: `command: view` is not an edit. Use the read tool to inspect a file.");
	}
	if (command === "create") {
		throw new Error("edit: `command: create` writes a new file. Use the write tool instead.");
	}
	if (command === "undo_edit") {
		throw new Error("edit: `command: undo_edit` is not available. Re-edit the file with the text you want.");
	}
	if (command === "insert") {
		throw new Error(
			'edit: `command: insert` is not supported. Express the insertion as oldText (the line to anchor on, including surrounding context) and newText (that line plus the inserted text).',
		);
	}
	if (command !== "str_replace" && command !== "replace") {
		throw new Error(`edit: unknown command "${command}". Use edits[] with {oldText, newText}.`);
	}
}

function normalizeEditArguments(raw: unknown): EditArgs {
	if (raw === undefined || raw === null) {
		throw new Error('edit: no arguments. Expected {"path": "...", "edits": [{"oldText": "...", "newText": "..."}]}.');
	}

	// A bare array is an edits list: some models drop the wrapper object.
	let args: Record<string, unknown> = Array.isArray(raw)
		? { edits: raw }
		: isRecord(raw)
			? raw
			: {};

	rejectForeignCommand(args);

	// Unwrap one level of {"edit": {...}} / {"arguments": {...}} when the call has
	// no edits of its own.
	if (args.edits === undefined) {
		for (const key of WRAPPER_KEYS) {
			const inner = args[key];
			if (isRecord(inner)) {
				args = { ...inner, path: firstString(inner, PATH_KEYS) ?? firstString(args, PATH_KEYS) };
				rejectForeignCommand(args);
				break;
			}
		}
	}

	let editsValue: unknown = args.edits;
	if (typeof editsValue === "string") {
		try {
			editsValue = JSON.parse(editsValue);
		} catch {
			throw new Error(
				'edit: "edits" is a string but not valid JSON. Send it as an array: [{"oldText": "...", "newText": "..."}].',
			);
		}
	}

	let rawEdits: unknown[];
	if (editsValue === undefined) {
		// Legacy/Claude top-level single edit, or nothing usable at all.
		rawEdits = [args];
	} else if (Array.isArray(editsValue)) {
		rawEdits = editsValue;
	} else if (isRecord(editsValue)) {
		rawEdits = [editsValue];
	} else {
		throw new Error(`edit: "edits" must be an array. Expected ${describeExpectedEdit()}.`);
	}

	const path = resolvePath(args, rawEdits);
	const edits = rawEdits.map((value, index) => normalizeOneEdit(value, index, path));
	const replaceAll = firstBoolean(args, REPLACE_ALL_KEYS);
	return replaceAll === undefined ? { path, edits } : { path, edits, replace_all: replaceAll };
}

// ---------------------------------------------------------------------------
// edit: replace_all
// ---------------------------------------------------------------------------

/**
 * pi's edit requires every oldText to be unique, so `replace_all` cannot be
 * expressed as an edits[] entry. Instead, apply every edit to a private copy of
 * the file (sequentially, like Claude does) and hand pi a single whole-file
 * replacement. pi still owns BOM handling, CRLF restoration, the write queue and
 * the diff, and the rendered diff is unaffected by the whole-file oldText.
 *
 * The read happens outside pi's per-file mutation queue because that queue is
 * not reentrant. A file changed between this read and pi's own read only makes
 * the call fail with "could not find", never corrupts the file.
 */
async function expandReplaceAll(input: EditArgs, cwd: string): Promise<BareEditInput> {
	const absolutePath = isAbsolute(input.path) ? input.path : resolve(cwd, input.path);
	const raw = await readFile(absolutePath, "utf8");

	const hasBom = raw.charCodeAt(0) === 0xfeff;
	const text = hasBom ? raw.slice(1) : raw;
	// Match pi's detectLineEnding: the earliest terminator wins.
	const crlfIndex = text.indexOf("\r\n");
	const lfIndex = text.indexOf("\n");
	const ending = crlfIndex !== -1 && (lfIndex === -1 || crlfIndex < lfIndex) ? "\r\n" : "\n";

	let content = normalizeToLF(text);
	for (let index = 0; index < input.edits.length; index++) {
		const edit = input.edits[index];
		const oldText = normalizeToLF(edit.oldText);
		const newText = normalizeToLF(edit.newText);
		if (oldText === "") {
			throw new Error(`edits[${index}].oldText must not be empty in ${input.path}.`);
		}
		const first = content.indexOf(oldText);
		if (first === -1) {
			throw new Error(
				`Could not find edits[${index}] in ${input.path}. The oldText must match exactly including all whitespace and newlines.`,
			);
		}
		if (edit.replace_all === true || input.replace_all === true) {
			content = content.split(oldText).join(newText);
			continue;
		}
		if (content.indexOf(oldText, first + 1) !== -1) {
			throw new Error(
				`Found multiple occurrences of edits[${index}] in ${input.path}. Each oldText must be unique.`,
			);
		}
		content = content.slice(0, first) + newText + content.slice(first + oldText.length);
	}

	return {
		path: input.path,
		edits: [{ oldText: text, newText: restoreLineEndings(content, ending) }],
	};
}

function normalizeToLF(text: string): string {
	return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function restoreLineEndings(text: string, ending: "\n" | "\r\n"): string {
	return ending === "\r\n" ? text.replace(/\n/g, "\r\n") : text;
}

function toBareEditInput(input: EditArgs): BareEditInput {
	// Drop alias-only extras so pi sees exactly its own shape.
	return { path: input.path, edits: input.edits.map(({ oldText, newText }) => ({ oldText, newText })) };
}

/** Turn the failures Claude-trained models hit into a next step they can take. */
function addRepairHint(error: unknown): unknown {
	if (!(error instanceof Error)) return error;
	const message = error.message;
	if (/multiple occurrences|Found \d+ occurrences/i.test(message) || /must be unique/.test(message)) {
		error.message = `${message}\nHint: pass replace_all: true to replace every occurrence, or widen oldText with surrounding lines so it is unique. Disjoint changes belong in one call as separate edits[].`;
	} else if (/Could not find/i.test(message)) {
		error.message = `${message}\nHint: oldText is matched against the file on disk. If it changed since you read it, read the file again and copy the exact lines.`;
	}
	return error;
}

// ---------------------------------------------------------------------------
// extension
// ---------------------------------------------------------------------------

export default function toolDescriptionsExtension(pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		const read = createReadToolDefinition(ctx.cwd);
		pi.registerTool({
			...read,
			description: READ_DESCRIPTION,
			promptSnippet: "Read file contents (preferred way to inspect files)",
			promptGuidelines: READ_GUIDELINES,
			// Do not change which tools are active; only replace the definitions
			// of tools that are already selected.
			defaultActive: false,
		});

		const bash = createBashToolDefinition(ctx.cwd);
		pi.registerTool({
			...bash,
			description: BASH_DESCRIPTION,
			promptSnippet: "Run shell commands (not for file reads or edits)",
			promptGuidelines: BASH_GUIDELINES,
			defaultActive: false,
		});

		const edit = createEditToolDefinition(ctx.cwd);
		const editDefinition: ToolDefinition<typeof editSchema, EditToolDetails | undefined> = {
			...edit,
			description: EDIT_DESCRIPTION,
			parameters: editSchema,
			prepareArguments: (args) => normalizeEditArguments(args),
			async execute(toolCallId, params, signal, onUpdate, toolCtx) {
				const input = params as EditArgs;
				const replaceAll = input.replace_all === true || input.edits.some((entry) => entry.replace_all === true);
				try {
					if (!replaceAll) {
						return await edit.execute(toolCallId, toBareEditInput(input), signal, onUpdate, toolCtx);
					}
					const expanded = await expandReplaceAll(input, toolCtx?.cwd ?? ctx.cwd);
					return await edit.execute(toolCallId, expanded, signal, onUpdate, toolCtx);
				} catch (error) {
					throw addRepairHint(error);
				}
			},
			defaultActive: false,
		};
		pi.registerTool(editDefinition);
	});
}
