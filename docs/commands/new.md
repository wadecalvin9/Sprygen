---
layout: default
title: new
parent: Commands
nav_order: 1
---

# `sprygen new`

Scaffold an entirely new Spring Boot 3+ project.

Run `sprygen new <project-name>` in your terminal and answer the interactive prompts.

## Interactive Configuration

You will configure:
- **Java Version:** 17 or 21
- **Build Tool:** Maven or Gradle
- **Database:** MySQL, PostgreSQL, or H2 (in-memory)
- **Auth Strategy:** Stateless REST (JWT) or Stateful Web (Session)
- **Modules:** Flyway Database Migrations, Swagger/OpenAPI, Spring Mail, Logback

## What Happens Under the Hood?

Upon completion, Sprygen:
1. Downloads the base project directly from Spring Initializr.
2. Injects custom architecture patterns and dependencies.
3. Writes out all foundational config, security filtering logic, and global CORS configurations.
4. Generates a base `User` entity stack configured for Role-Based Access Control.

**Usage:**

```bash
sprygen new my-awesome-backend
```
