# MCP Atlas Census

**Live census of MCP tool records** — **229,827** tool records with `input_schema` from **13,120** servers (of **42,163** surveyed). Byte-verified. **CC0 1.0**.

Built for parameter-level risk research, conformance vectors, and agent-security tooling.

Related runtime product: **[agent-runtime-guard](https://github.com/DSHCorrectover/agent-runtime-guard)** — fail-closed tool-call interception + Ed25519 receipts (`npx -y agent-runtime-guard`).

## Contents

| File | Where | Records | Notes |
|------|-------|---------|-------|
| `server_tools.jsonl.gz` | [release v1.0.0](https://github.com/DSHCorrectover/mcp-atlas-census/releases/download/v1.0.0/server_tools.jsonl.gz) | **229,827** tools | full `input_schema` · ~90 MB |
| `servers.jsonl.gz` | in-repo `data/` | **42,163** servers | full surveyed population · ~8.5 MB |

Counts byte-verified 2026-10-29 (`wc -l`, zero malformed lines).

### Schema

- `server_tools.jsonl.gz` → `{id, server_id, tool_name, tool_description, input_schema, created_at}`
- `servers.jsonl.gz` → server metadata including `tool_count`, package fields, GitHub fields, harvest status

## Use it

- Parameter-level risk classification
- Conformance / red-team corpus generation
- Discovery-layer security analysis

## License

**CC0 1.0 Universal** — public domain dedication. Use for anything; permission not required.  
Attribution requested, not required: "Correctover MCP Atlas" — https://github.com/DSHCorrectover/mcp-atlas-census

## Verify

`server_tools.jsonl.gz` SHA-256: `2350dc773dc43fd6ed0b012588f3ff295fb358106a0291a7dc59c57427f5780f`

```bash
shasum -a 256 server_tools.jsonl.gz
```

## Contact

Correctover — agent runtime security research & audits  
wangguigui@correctover.com · https://github.com/DSHCorrectover/agent-runtime-guard
