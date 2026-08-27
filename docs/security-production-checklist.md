# Production security checklist

This repository includes baseline application controls: strict input validation, trusted-origin checks, request-size limits, signed admin sessions, Stripe webhook verification, CSP/security headers, and append-only audit-log storage.

Before exposing real homeowner or contractor data:

- Use an MFA-capable identity provider with RBAC for administrators. The legacy shared-password route is suitable only for a controlled pilot and must be replaced before enterprise launch.
- Put rate limiting and bot protection at the edge using a distributed provider such as Vercel Firewall, Cloudflare, or an equivalent managed service. The in-process limiter is not sufficient across multiple instances.
- Configure production CSP nonces and remove `unsafe-inline` / `unsafe-eval` where supported by the chosen Next.js deployment.
- Confirm HSTS is served only over HTTPS and submit the domain for preload only after every subdomain is HTTPS-safe.
- Use separate staging and production projects, databases, Stripe accounts/keys, Search Console properties, and secret stores.
- Enforce TLS for Postgres, least-privilege database roles, encrypted backups, tested restore procedures, retention periods, and verified deletion/export workflows.
- Monitor authentication failures, webhook failures, abusive form traffic, privilege changes, and data exports. Alert on thresholds.
- Run dependency audit, secret scanning, SAST, and DAST in CI. The repository includes a security workflow for npm audit, Gitleaks, and CodeQL.
- Perform an independent penetration test covering authentication, authorization, API abuse, SSRF, injection, privacy, payment flows, and data access before making an enterprise-security claim.

Security controls reduce risk; no implementation can withstand every possible threat. Keep dependencies, platform configuration, and incident-response contacts current.
