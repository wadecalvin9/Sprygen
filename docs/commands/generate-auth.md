---
layout: default
title: generate-auth
parent: Commands
nav_order: 5
---

# `sprygen generate-auth`

Need to inject a secure JWT layer into an existing codebase? This command drafts `JwtService`, `JwtAuthFilter`, `SecurityConfig`, and all Auth DTOs straight into your `src/main/java`.

## Features

- **Stateless Authentication:** Completely drops sessions, suitable for external API consumption and modern SPA frontends (React, Angular, Vue).
- **Security Filters:** Configures `OncePerRequestFilter` to gracefully interpret Bearer tokens.
- **DTOs & Controllers:** Generates `/api/v1/auth/login` and `/api/v1/auth/register` endpoints out of the box.

**Usage:**

```bash
sprygen generate-auth
```
