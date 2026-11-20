---
name: code-style-guide
description: Clean up code style and structure after a change is verified. Use when asked to apply the style guide, tidy or clean up a diff, restructure files, or review code formatting and boolean/control-flow layout.
---

# Style additions

Apply this style guide to any change once it has been vetted, tested, or otherwise verified, to
clean up the style. The guide exists at two loosely coupled levels, the first is the structural
level, and last the code level. Scope the changes to the change - and change context - bugfixes or
small additions and features prompt a line-level review, large changes and green field additions
result in wider ranging review of existing related code sections.

## Structure

In general structural changes are proposed then approved by the user, rather than silently
implemented.

1. Read through the hierarchy of the added or modified files. Identify areas of concern and split
   code into files, mirroring the current file structure, or proposing a new one where none exists.
2. When relying on an interface, identify other consumers and create interface wrappers that
   implement the mechanical parts of it's use, leaving each consumer to handle only the business
   level logic.

For example, two consumers of the same CSV format may implement decoding individually to
dictionaries. Unify both by creating a shared class and decoding logic.

## Code style

This applies to all languages, language specific styles are called out specifically.

1. No date, time, or file name constants, and prefer passing these in via arguments.

The only exception is where the file name is built up from several parts as happens frequently in
log file creation:
```c
def create_file(log_path: str, logs: str)
	file_name = f"some-process-log-{datetime.now().iso_format()}.text"
	with open(os.path.join(log_path, file_name), "w+") as f:
		f.write(logs)
```
2. de-compress style guides (sentence style),

The rules are:
- include an empty line after a "}" unless the next line contains only a "}"
- include an empty line before variable instantiation, unless it's the start of the method
- include an empty line after an assignment unless:
- It is clearly a temporary value. eg.

```c
int combined_numbers_mod_2(int a, int b, int c) {
    int a_and_b = a + b; // <-- Clearly a temporary value
    int result = a_and_b + c;

    return result % 2;
}
```

- or it involves the assignment of multiple elements of a struct,
- it initialises a set variables at the start of function/class with simple data (simple values line
  `0`, `[]` or `{}`, or empty constructors eg. `foo()`)
- the next line closes a scope

3. Only use turnery operator when it clearly presents a simple switch, eg.

   ```c
   action_e action = do_sample ? ACTION_DIAG_RSSI_SEND_IAM : ACTION_SEND_IAM;
   ```

   or when only the positive case implements extra logic,

```c
// OK
should_record ? resp_data[i] : "";
// bad
resp_data.id == i ? resp_data[i] : comms_state.last_rssi;
// ^ extra logic                   ^ additional complexity
```

  and not when the outcome is passed to a function,

```c
enqueue_iam(resp_data_sz == 1U ? resp_data[0] : comms_state.last_rssi);
```

  Otherwise, prefer explicit if statements with if statements.

4. If an if statement has more than 2 OR'd or AND'd inputs, chain if or else if statements.
5. If a piece of boolean logic flows over a line after formatting, pull it out into a well named
  temporary value above the statement
6. if one side of a piece of boolean logic combines more than 2 variables, pull it out onto a
  function.
7. Group outcomes by logical path in a process similar to mathematical factorisation:

Before:

```c
static void at_cmd_seq_complete_entry(
        at_cmd_seq_t *seq, at_seq_entry_t *entry_ptr, bool success, uint8_t *resp, size_t resp_sz) {
    action_e action = success ? entry_ptr->success_action : entry_ptr->failure_action;
    seq->ops->on_action(seq->src, action, entry_ptr->action_data, success, resp, resp_sz);
    entry_ptr->status = success ? SEQ_ENTRY_STATUS_SUCCESS : SEQ_ENTRY_STATUS_FAILED;
}
```

- both the elements switch on success, group them eg.
After:

```c
static void at_cmd_seq_complete_entry(
    at_cmd_seq_t *seq, at_seq_entry_t *entry_ptr, bool success, uint8_t *resp, size_t resp_sz) {
    if(success) {
        seq->ops->on_action(seq->src, entry_ptr->success_action, entry_ptr->action_data, success, resp, resp_sz);
        entry_ptr->status = SEQ_ENTRY_STATUS_SUCCESS;
    } else {
        seq->ops->on_action(seq->src, entry_ptr->failure_action, entry_ptr->action_data, success, resp, resp_sz);
        entry_ptr->status = SEQ_ENTRY_STATUS_FAILED;
    }
}
```

8. (C) Use the switch style:

```c
switch (on_var) {
    case case_var: {
        // code
    } break;
    case case_var2: {
        // code
    } break;
}
```

9. (C) Use the C17 standard features, particularly the anonymous struct instantiation where safe:

```c
function_that_takes_a_struct((struct_a_function_takes *){/* struct members */})
```

10. (C) Constants `const <type> CONSTANT_NAME = ...`.
11. (Python) Always use argparse for cli tool arguments
12. (Python, bash) Always build a sane interface for cli tooling

