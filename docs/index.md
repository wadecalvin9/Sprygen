---
layout: default
title: Sprygen Documentation
description: Enterprise Spring Boot Generator
---

# Sprygen Documentation

Welcome to **Sprygen** — the modern, robust, and enterprise-grade Spring Boot project generator.

Sprygen goes beyond basic scaffolding. It generates clean, layered architectures tailored for production, equipped with robust integrations out-of-the-box like MapStruct, Flyway, JPA Specifications, and secure JWT/Session authentication.

## Getting Started

### Prerequisites
- Node.js (v16+)
- Java 17 or 21
- Maven or Gradle

### Installation
Sprygen is an npm package installed globally:
```bash
npm install -g sprygen
```

Verify the installation:
```bash
sprygen --version
```

## Core Commands

### 1. `sprygen new`
Scaffold an entirely new Spring Boot 3+ project.

Run `sprygen new` in your terminal and answer the interactive prompts. You will configure:
- **Java Version:** 17 or 21
- **Build Tool:** Maven or Gradle
- **Database:** MySQL, PostgreSQL, or H2 (in-memory)
- **Auth Strategy:** Stateless REST (JWT) or Stateful Web (Session)
- **Modules:** Flyway Database Migrations, Swagger/OpenAPI, Spring Mail, Logback

Upon completion, Sprygen downloads the base from Spring Initializr, injects your custom architecture, and writes out all foundational config, security logic, and a base `User` entity stack.

### 2. `sprygen add-entity <Name>`
Accelerate feature development. Inside your Sprygen project, run `sprygen add-entity Product` to instantly generate the full persistence and API layer for a new domain object.

**What gets generated?**
1. **Entity:** `Product.java` extends `AbstractAuditingEntity` for auto-timestamps.
2. **Repository:** `ProductRepository.java` equipped with `JpaSpecificationExecutor`.
3. **Specification Builder:** `ProductSpecification.java` for dynamic query building.
4. **DTOs:** `ProductDto.java` and `ProductFilter.java`.
5. **Mapper:** `ProductMapper.java` utilizing MapStruct for zero-boilerplate object translation.
6. **Service:** `ProductService.java` handling core business logic, mapping, and returning `Page<ProductDto>`.
7. **Controller:** `ProductController.java` with complete REST CRUD endpoints, auto-wired for pagination and filtering.
8. **Test:** `ProductControllerTest.java` integration test stub.
9. **Migration:** `V2__create_product_table.sql` Flyway script (if Flyway is enabled).

### 3. `sprygen block-generate <schema.json>`
Design your database schema declaratively and generate your entire backend in one highly optimized pass.

**Example `schema.json`**:
```json
[
  {
    "name": "Product",
    "fields": [
      { "name": "title", "type": "String", "nullable": false },
      { "name": "price", "type": "Double", "nullable": false }
    ],
    "relations": [
      { "type": "ManyToOne", "target": "Category", "fieldName": "category", "eager": true }
    ]
  },
  {
    "name": "Category",
    "fields": [
      { "name": "name", "type": "String", "nullable": false }
    ]
  }
]
```

Run:
```bash
sprygen block-generate schema.json
```

### 4. `sprygen migrate:init`
Convert any non-Flyway project seamlessly to Flyway. It patches your `application.yml` setting `ddl-auto: none`, writes a baseline `V1__baseline.sql`, injects Flyway dependencies into your `pom.xml`/`build.gradle`, and tags the project metadata so future entity generations automatically draft Flyway SQL.

### 5. `sprygen generate-auth`
Need to inject a secure JWT layer into an existing codebase? This command drafts `JwtService`, `JwtAuthFilter`, `SecurityConfig`, and all Auth DTOs straight into your `src/main/java`.

## Architecture Guide

### MapStruct
Sprygen relies unconditionally on [MapStruct](https://mapstruct.org/) for entity-DTO mapping. It generates a `@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)` interface.
This provides compile-time safety and offloads the tedious manual mapping logic out of your Services.

### Pagination & Dynamic Filtering
Every generated endpoint natively supports pagination via Spring's `PageableDefault`.
`GET /api/v1/products?page=0&size=20&sort=id,desc`

Furthermore, endpoints support dynamic field filtering instantly:
`GET /api/v1/products?title=Apple&price=500`

This is powered by the generated `EntitySpecification.java` class which dynamically aggregates `Predicate` lists safely without method explosion.

### JPA Auditing
Say goodbye to manual timestamps. All entities extend `AbstractAuditingEntity` pre-decorated with `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy`, and `@LastModifiedBy`. 
The accompanying `AuditingConfig` listens to the Spring Security Context and seamlessly populates the acting user's identifier on modification.

## Contributing

Sprygen is built with TypeScript and EJS templates. To test locally:
1. Clone the repo and run `npm install`.
2. Run `npm run dev` to watch TypeScript changes.
3. Run `npm link` to sympathetically link the binary to your global node environment for testing.
