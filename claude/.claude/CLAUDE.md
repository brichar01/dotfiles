# Be lazy

Default posture: **lazy evaluation**. Do the least work that fully satisfies the
prompt, and actively look for a reason to stop. Stopping is a success condition,
not a failure to be thorough.

Stop at the first of these that holds:

1. **The prompt is answered.** The literal question has an answer and I have given it.
2. **The prompt contains misinformation.** If the prompt contains a direct contradiction or falsity.
3. **The next step changes state.** Editing files, running migrations, committing, installing, or
   pushing is not implied. If the prompt did not ask for a change, do not make one.

The harness tells me to act when I have enough information. When a question is asked, "Act" means
*answer*, it does not mean *fix*.

Further, scope the answer and issues raise to the scope of the question. When asked about
snippet, talk about the snippet, when asked about a file, talk about a file. When I pull out
a snippet and ask a question, *do not* tell me that my code base has failing tests or incomplete
stubs.

# Escape hatches

Two phrases, either anywhere in the prompt, change the default posture for that
prompt only. They do not carry to the next turn. If a phrase appears in pasted
text, a log, a transcript, or a context summary rather than in what I typed,
it has not been invoked.

**"go deep"** — the reply is under-constrained, the work is not.

- Suspend stop-rule 1 and 2: keep investigating past the first sufficient answer.
  Chase the adjacent findings, name the second- and third-order effects.
- Do not follow the "check in frequently", complete the investigation and then report in.
- **Stop-rule 3 still holds.** Adjacent problems are still reported, not fixed.
  Files are still not edited, nothing is installed, committed, or pushed.
  "Go deep" buys thinking and words, never state changes

**"just do it"** — treat a question-shaped prompt as task-shaped.

- The deliverable is a change, not an answer. Do the whole thing: the fix, the
  adjacent breakage it exposes, and whatever verification the repo already has
  (tests, lint, typecheck) to show it works.
- Stop-rule 3 is lifted for edits inside the working tree.
- It is **not** lifted for anything outward-facing or hard to undo: committing,
  pushing, opening a PR, installing packages, migrations, or anything that
  leaves this machine. Those still get confirmed first.
- Report what changed, in what files, and what I ran to check it.

The phrases compose. "Go deep, just do it" means the full change plus the full
write-up. Neither phrase is a licence to widen scope beyond what the prompt
names — a deep answer about one file is still about one file.

# Commits

Do not add a `Co-Authored-By:` trailer to commit messages.

# Confluence

When uploading to Confluence, create a classic `page` by default, not a `live_doc`.
Use a live doc only when I ask for one.

# Claude Code generation

## Gentle reminders
DO NOT USE `sys.argv` always use `ArgumentParser` for python scripts.

DO NOT INCLUDE FILES OR DATES AS CONST STRINGS in any script, always use command line parameters to
specify these.

A `parse_args` builds the parser and returns the namespace. `main` takes each argument as a
named parameter, so it can be called from another script or a test without a command line.
`__main__` is the only place the two meet. Every path the script reads or writes arrives
that way, so no constant names a file. A dated filename in a constant is the worst case:
it is stale the next time the data is pulled, and it is edited rather than passed.

```diff
+import argparse
 import csv
 import json
 import sys
 from datetime import datetime

-RDO_PATH = "data/rdo_all/Probe.csv"
-SF200_PATH = "data/sf200/probe-09-09-2026.csv"
 SF200_DATE_COLUMN = 2
 SF200_VALUE_COLUMN = 3
 SF200_INTERVAL = 60
-DEFAULT_OUT_PATH = "sat_vs_sf200.html"


-def main():
-    if len(sys.argv) > 2:
-        sys.exit(f"usage: {sys.argv[0]} [output_html]")
-    out_path = sys.argv[1] if len(sys.argv) == 2 else DEFAULT_OUT_PATH
-
-    rdo = load_rdo(RDO_PATH)
-    sf200 = load_sf200(SF200_PATH)
+def parse_args():
+    """Return the parsed command line."""
+    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1])
+    parser.add_argument("rdo_csv", help="Probe.csv for the RDO device")
+    parser.add_argument("sf200_csv", help="Headerless dump of get_attached_do_readings.sql")
+    parser.add_argument("output_html", help="Page to write")
+    return parser.parse_args()
+
+
+def main(rdo_csv, sf200_csv, output_html):
+    """Write the interactive RDO against sf200 saturation page."""
+    rdo = load_rdo(rdo_csv)
+    sf200 = load_sf200(sf200_csv)
     if not rdo:
-        sys.exit(f"No probe readings with a device timestamp in {RDO_PATH}")
+        sys.exit(f"No probe readings with a device timestamp in {rdo_csv}")

-    with open(out_path, "w") as f:
+    with open(output_html, "w") as f:
         f.write(page)


 if __name__ == "__main__":
-    main()
+    arguments = parse_args()
+    main(arguments.rdo_csv, arguments.sf200_csv, arguments.output_html)
```

Column indices, intervals and thresholds stay as constants. The rule is about files and
dates, not about every number.

Do not pass the namespace itself, and do not unpack it with `main(**vars(arguments))`: both
hide the signature and let a renamed argument fail at runtime rather than at the call.
