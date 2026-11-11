# CCS (Cryptographic Commitment Scheme) Verification Standard

**Model-agnostic verification infrastructure for AI evaluation receipts**

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![IETF Draft](https://img.shields.io/badge/IETF-draft--correctover--ccs--11-green.svg)](docs/draft-correctover-ccs-11.txt)

## Overview

CCS is a cryptographic verification standard for AI evaluation receipts. Unlike traditional security scanners that rely on LLM inference, CCS uses pure rule-based semantic chains for deterministic verification with zero token cost and sub-millisecond latency.

**Key Properties:**
- **Model-agnostic**: No LLM dependency, pure cryptographic verification
- **Zero token cost**: Rule-based evaluation, no inference required
- **Sub-millisecond latency**: Direct cryptographic verification
- **Deterministic**: Same input always produces same output
- **Auditable**: Full semantic chain traceability

## What This Repo Contains

```
.
├── docs/
│   ├── draft-correctover-ccs-11.txt          # IETF standard specification
│   ├── draft-correctover-ccs-11.xml          # IETF standard (XML format)
│   └── MCP_Description_Obfuscation_*.md/html # Security vulnerability research
├── examples/                                  # Usage examples
├── ccs-supplementary-benchmark-v2.zip        # Benchmark test vectors
└── correctover-supplementary-benchmark-v2.js # Benchmark implementation
```

## Quick Start

### Verify a Receipt

```javascript
const { verify } = require('./correctover-supplementary-benchmark-v2.js');

const receipt = {
  evaluation_id: "eval_123",
  timestamp: 1699900000,
  commitments: [...],
  signature: "..."
};

const result = verify(receipt);
console.log(result.valid); // true/false
console.log(result.confidence); // 0.0-1.0
```

### Run Benchmarks

```bash
# Unpack test vectors
unzip ccs-supplementary-benchmark-v2.zip

# Run 100k verification benchmark
node correctover-supplementary-benchmark-v2.js
```

## Standards

CCS is defined in [draft-correctover-ccs-11](docs/draft-correctover-ccs-11.txt), an IETF Individual Draft specification. The standard defines:

- **Receipt format**: Cryptographic commitment structure
- **Verification algorithm**: Rule-based semantic chain evaluation
- **Conformance criteria**: Test vectors and validation rules

## Security Research

This repository includes security research on MCP (Model Context Protocol) description obfuscation vulnerabilities. See [docs/MCP_Description_Obfuscation_Vulnerability_Report_v1.0.md](docs/MCP_Description_Obfuscation_Vulnerability_Report_v1.0.md) for details.

## Performance

Benchmark results (100k receipts, single core):
- **Verification time**: 0.3ms per receipt
- **Throughput**: 3,333 receipts/second
- **Memory**: < 10MB for 100k receipts
- **Token cost**: 0 (no LLM inference)

## Use Cases

1. **AI Evaluation Platforms**: Verify evaluation receipts without LLM overhead
2. **Compliance Auditing**: Deterministic verification for regulatory requirements
3. **Security Scanning**: Model-agnostic vulnerability detection
4. **API Services**: High-throughput verification endpoints

## API Service

CCS verification is available as an API service (coming soon). Contact us for early access.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Apache 2.0 - see [LICENSE](LICENSE) for details.

## Contact

- **IETF Draft**: [draft-correctover-ccs-11](docs/draft-correctover-ccs-11.txt)
- **Security Issues**: See [SECURITY.md](SECURITY.md)
- **General Questions**: Open an issue on GitHub

---

**Note**: This is an early release. The API and specification are subject to change.
