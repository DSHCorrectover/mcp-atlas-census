# MCP Atlas Census — milestone-a v1

The largest known live census of MCP (Model Context Protocol) tools.

## Contents
| File | Records | Notes |
|---|---|---|
| `server_tools.jsonl.gz` | **229,827** tool records | each with `input_schema` — machine-readable parameter definitions for risk classification |
| `servers.jsonl.gz` | 42,163 server records | in-repo (8.6MB) |

Counts byte-verified 2026-10-27. Schema per line: `{id, server_id, tool_name, tool_description, input_schema}`.

## Use it
Parameter-level risk research, conformance test generation, discovery-layer security analysis.
See `draft-correctover-gg-mcp-parameter-risk` for the risk-classification draft this dataset feeds.

## License
Data: CC-BY-SA-4.0 · Attribution: Correctover MCP Atlas
