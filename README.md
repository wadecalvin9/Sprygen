# Sprygen

A fully-functional project generator tool similar to JHipster, written in Node.js with TypeScript, that can scaffold Spring Boot projects with authentication and common modules pre-configured.

## Features

* **Generate Spring Boot Project**: Scaffolds a full Spring Boot 3.x project with Maven or Gradle.
* **Pre-configured Auth**: Includes JWT authentication via Spring Security.
* **Database Support**: Choose between H2 (in-memory), MySQL, or PostgreSQL.
* **Optional Modules**: Switch on Swagger OpenAPI, Spring Mail, and custom Logback logging.
* **Entity Generator**: Quickly add new JPA entities with full repository, service, and controller layers (CRUD REST API).
* **Standalone Auth Generator**: Add JWT security configurations to any existing Spring Boot project.

## Installation

Install globally using npm:

```bash
npm install -g sprygen
```

*(For local development, clone the repository, run `npm install`, then `npm run build`, and `npm link`)*

## Commands

### `sprygen new <project-name>`

Launches an interactive prompt to scaffold a new project.

```bash
sprygen new my-awesome-api
```

It will prompt you for:
- Package name (e.g. `com.example.app`)
- Description
- Build Tool (Maven/Gradle)
- Database (H2/MySQL/PostgreSQL)
- Java Version (21/17)
- Optional Modules (Swagger, Mail, Logging)

### `sprygen add-entity <entity-name>`

Must be run inside the generated project's root folder. It prompts you to define fields (types and nullability) for your entity and automatically generates:
- JPA Entity class
- Spring Data JpaRepository
- Service class
- REST Controller with standard CRUD endpoints
- DTO class
- Controller integration test stub

```bash
cd my-awesome-api
sprygen add-entity Product
```

### `sprygen generate-auth`

Scaffolds JWT authentication and Spring Security configuration. Useful if you want to add Sprygen's security setup to an existing project not scaffolded by `sprygen new`.

```bash
sprygen generate-auth
```

## Development

```bash
# Install dependencies
npm install

# Run the CLI in development mode using ts-node
npm run dev new test-project

# Build the project (compiles TypeScript to dist/)
npm run build
```

## License

MIT
