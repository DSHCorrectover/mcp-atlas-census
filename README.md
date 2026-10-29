# MCP Atlas Census — milestone-a v1

The largest known live census of MCP (Model Context Protocol) tools.

## Contents

| File | Where | Records | Notes |
|---|---|---|---|
| `server_tools.jsonl.gz` | [release v1.0.0](https://github.com/DSHCorrectover/mcp-atlas-census/releases/download/v1.0.0/server_tools.jsonl.gz) | **229,827** tool records | from **13,120** servers that expose tool-level schemas; each record carries `input_schema` (machine-readable parameter definitions for risk classification) · 90,047,371 bytes |
| `servers.jsonl.gz` | in-repo `data/` | **42,163** server records | the full surveyed server population, incl. servers without tool-level schemas · 8,576,997 bytes |

Counts byte-verified 2026-10-29 against the published files (`wc -l`, zero malformed lines).

Schema per line:
- `server_tools.jsonl.gz` → `{id, server_id, tool_name, tool_description, input_schema, created_at}`
- `servers.jsonl.gz` → `{id, slug, name, description, version, category, source, package_name, package_type, package_url, has_tools, has_resources, has_prompts, tool_count, github_url, github_stars, github_forks, github_open_issues, github_last_push, github_license, github_language, github_contributors, github_archived, readme_content, npm_weekly_downloads, registry_status, registry_published_at, registry_updated_at, registry_tags, is_official, featured, created_at, updated_at, last_synced_at, search_vector, canonical_slug, github_checked_at, readme_length, tool_harvest_status, tool_harvest_at, tool_harvest_url}`

## Use it

Parameter-level risk research, conformance test generation, discovery-layer security analysis.
See `draft-correctover-gg-mcp-parameter-risk` for the risk-classification draft this dataset feeds.

## License

Data: CC-BY-SA-4.0 · Attribution: Correctover MCP Atlas
Full legal code: [LICENSE](./LICENSE) · https://creativecommons.org/licenses/by-sa/4.0/legalcode
