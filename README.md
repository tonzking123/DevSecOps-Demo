# DevSecOps Demo — Intentionally Vulnerable

> **WARNING:** This repo contains deliberately insecure code for demonstrating Microsoft Defender for Cloud (MDC) DevOps Security scanning. Do NOT use in production.

## What's here

| File | Scanner | What MDC should flag |
|------|---------|---------------------|
| `Dockerfile.bad` | Container scanner (Trivy) | Old nginx base image with known CVEs |
| `infra/main.bicep` | IaC scanner (TemplateAnalyzer) | Open NSG, public storage, no encryption |
| `infra/main.tf` | IaC scanner (Terrascan/Checkov) | Same misconfigs in Terraform |
| `app/server.js` | SAST (ESLint security) | SQL injection, hardcoded secrets |
| `app/package.json` | Dependency scanner | Vulnerable n8n version |
| `.github/workflows/mdc-scan.yml` | — | Runs the MDC security scanner on every push |
