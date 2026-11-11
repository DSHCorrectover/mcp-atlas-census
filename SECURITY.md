# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability in CCS, please follow these steps:

### Responsible Disclosure

1. **DO NOT** open a public GitHub issue
2. Email security@example.com (or use GitHub's private vulnerability reporting)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: 1 month

### After Reporting

- We will work with you to understand and validate the issue
- We will develop and test a fix
- We will coordinate disclosure with you
- We will credit you in the advisory (unless you prefer anonymity)

## Security Best Practices

### For Users

- Always verify receipt signatures before trusting evaluation results
- Keep your CCS implementation up to date
- Use strong, unique keys for signing operations
- Rotate keys regularly
- Monitor for security announcements

### For Developers

- Follow the specification exactly
- Use constant-time comparison for signatures
- Validate all inputs
- Implement proper error handling
- Audit your code for side-channel attacks

## Security Updates

Security updates are announced via:
- GitHub Security Advisories
- Release notes
- Mailing list (subscribe at [link])

## Known Issues

None at this time.

## Security Research

This repository includes security research on MCP description obfuscation. See [docs/MCP_Description_Obfuscation_Vulnerability_Report_v1.0.md](docs/MCP_Description_Obfuscation_Vulnerability_Report_v1.0.md) for details.

## Contact

- **Security issues**: security@example.com
- **General questions**: Open a GitHub issue
- **IETF discussions**: [mailing list]

---

Last updated: 2026-11-11
