---
layout: default
title: migrate:init
parent: Commands
nav_order: 4
---

# `sprygen migrate:init`

Convert any non-Flyway project seamlessly to Flyway.

If you generated your project without Flyway enabled initially (`ddl-auto: update`), you can run this command later once your database schema is stable and you're preparing for production.

## What it does

1. Patches your `application.yml` setting `ddl-auto: none`.
2. Creates the `src/main/resources/db/migration` directory.
3. Examines your existing entities and creates a baseline `V1__baseline.sql` script.
4. Injects Flyway dependencies into your `pom.xml` / `build.gradle`.
5. Updates your Sprygen metadata (`.sprygen/meta.json`).

After doing this, all future `sprygen add-entity` commands will automatically generate SQL migration schema files and place them in the `db/migration` folder.

**Usage:**

```bash
cd my-spring-project
sprygen migrate:init
```
