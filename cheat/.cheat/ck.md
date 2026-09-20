# ck

> Semantic code search — finds code by meaning as well as by pattern.
> Grep-compatible flags, plus embedding-based search over a local index.
> More information: <https://github.com/BeaconBay/ck>.

- Search by concept rather than exact text:

`ck --sem "{{error handling}}" {{path/to/directory}}`

- Search with a regex, grep-style, showing line numbers:

`ck {{[-n|--line-number]}} "{{TODO}}" {{path/to/file}}`

- Search recursively for a pattern:

`ck {{[-R|--recursive]}} "{{TODO|FIXME}}" {{path/to/directory}}`

- Combine semantic and keyword search (reciprocal rank fusion):

`ck --hybrid "{{connection timeout}}" {{path/to/directory}}`

- List only the names of matching files, with relevance scores:

`ck {{[-l|--files-with-matches]}} --scores --sem "{{authentication logic}}" {{path/to/directory}}`

- Limit results and filter by relevance, returning whole functions:

`ck --sem "{{retry logic}}" --topk {{10}} --threshold {{0.5}} --full-section {{path/to/directory}}`

- Emit structured output for scripting:

`ck --json --sem "{{database queries}}" {{path/to/directory}}`

- Build, inspect, or rebuild the search index:

`ck {{--index|--status|--clean}} {{path/to/directory}}`

- Start the interactive TUI or the MCP server for AI agents:

`ck {{--tui|--serve}}`
