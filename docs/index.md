---
layout: default
title: Home
nav_order: 1
description: "Enterprise-ready Spring Boot project generator CLI"
---

# Sprygen Documentation

Welcome to **Sprygen** — the modern, robust, and enterprise-grade Spring Boot project generator.

Sprygen goes beyond basic scaffolding. It generates clean, layered architectures tailored for production, equipped with robust integrations out-of-the-box like MapStruct, Flyway, JPA Specifications, and secure JWT/Session authentication.

> Scaffold a full CRUD application with JWT auth, an admin panel, and Swagger docs in under 30 seconds.

## ✨ Features

- **Interactive Scaffolding:** Prompt-based setup for Java 17/21, Maven/Gradle, and databases (H2, MySQL, PostgreSQL).
- **Fullstack Monorepo Support:** Generate a complete monorepo with a Spring Boot backend and a professional **Next.js 15** frontend (App Router) styled with **Tailwind CSS v4**.
- **Built-in Security:** Stateless JWT authentication or stateful Session-based logins with pre-wired frontend auth hooks.
- **Enterprise Architecture:** Compile-time safe mapping with **MapStruct**, auto-configured `Page<T>` pagination, and JPA `Specification` dynamic filtering out of the box.
- **Database Migrations:** First-class **Flyway** support. Automatically scaffold migration directories and generate `.sql` migrations per entity.
- **Role-Based Access Control & Auditing:** Pre-configured `ROLE_ADMIN` and `ROLE_USER` entities with JPA Auditing (`@CreatedBy`, `@LastModifiedDate`).
- **Entity Generator:** Scaffold JPA Entities, Repositories, Services, Mappers, DTOs, and REST Controllers instantly.
- **Batch Schema Generation:** Scaffold multiple interconnected entities at once using a declarative JSON schema.

## Next Steps

- Proceed to [Getting Started]({{ site.baseurl }}/getting-started) to install Sprygen.
- Explore the [CLI Commands]({{ site.baseurl }}/commands) to see what you can build.
