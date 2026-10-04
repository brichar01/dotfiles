---
name: hive-buffers
description: Write files into the user's running Neovim as unsaved buffers through hive.nvim, instead of to disk, so the user reviews every change before it is saved. Use only when the user asks for it, for example "write to buffers", "use hive writes" or "let me review in Neovim". Never use it by default.
---

# Write files through Neovim buffers

`hive-buf`, next to this file, sends file content to hive.nvim's buffer layer (`hive.fs`)
in the user's running Neovim. It is the same code the hive agent uses for its `write` and
`edit` tools. A write puts the content into the file's buffer, and loads one when the file
has none. The buffer stays modified and unsaved, and nothing reaches disk until the user
saves it.

This path is in testing. Use it as it is. Do not work around a fault, and do not fall back
to the Write or Edit tool. Report what went wrong and stop.

## Find the Neovim

`hive-buf` uses `$HIVE_NVIM`, then `$NVIM`, then the one Neovim socket whose working
directory contains the path. If it reports no match or several, ask the user for the socket
and set `HIVE_NVIM`.

## Read a file you will change

```sh
~/.claude/skills/hive-buffers/hive-buf read <path>
```

This prints the buffer's bytes when Neovim has the file loaded, and the file on disk
otherwise. The Read tool sees only disk, so it misses unsaved changes, including your own
earlier writes. Use `hive-buf read` for every file you are about to change.

## Write a file

1. Make the complete new content. `hive-buf` replaces the whole file, so for a small change
   read the current content first and change only what you must.
2. Write the content to a file in your scratchpad with the Write tool. This keeps the bytes
   exact, with no shell quoting.
3. Send it:

   ```sh
   ~/.claude/skills/hive-buffers/hive-buf write <path> < <scratchpad file>
   ```

Keep the file's line endings, BOM and final newline as `hive-buf read` showed them.
`hive.fs` copies them into the buffer's `fileformat`, `bomb` and `eol`.

`hive-buf write` creates missing directories on disk, the same as Pi's write tool. Only the
file content stays in Neovim.

## Stop after writing

After the writes for a change, stop. Do not run tests, builds, linters, formatters, git, or
any command that reads the changed files. Until the user saves, those files on disk are the
old versions, so the results would be wrong.

List the files you wrote and say they are unsaved buffers in Neovim. Then wait for the user
to say they have reviewed the changes. Their message tells you what to change before
testing:

- If they ask for changes, make them the same way, then stop and wait again.
- If they say the changes are good and saved, continue with testing.

## When something goes wrong

- **"has a swap file"**: another Neovim has the file open, or an old session crashed. Tell
  the user, and do not write the file another way.
- **"hive.nvim is not loaded"**: the Neovim found is not the user's editor, or the plugin
  failed to load. Ask the user which socket to use.
- **Unexpected content**: for example a changed line ending, a lost final newline or a
  missing character. Report the file, what you sent and what `hive-buf read` returns. This
  is the kind of fault the testing is for.
