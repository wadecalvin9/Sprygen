---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started

## Prerequisites

Before using Sprygen, ensure you have the following installed on your system:

- **Node.js** (v20 or newer recommended for Next.js 15)
- **Java Development Kit (JDK)** 17 or 21
- **Maven** or **Gradle** (matching your preferred build tool)

## Installation

Sprygen is distributed as an npm package. Install it globally to make the `sprygen` command available from your terminal anywhere.

```bash
npm install -g sprygen
```

*(If you are developing Sprygen locally, clone the repository, run `npm install`, compile it using `npm run build`, and link it using `npm link`.)*

## Creating Your First Project

The fastest way to get started is by scaffolding a new project:

```bash
sprygen new my-project
```

Then answer the interactive prompts to define your stack. For a **Fullstack** experience, select "Fullstack (Next.js 15 + Spring Boot)".

### Running a Fullstack Project

If you generated a Fullstack project, you will have a monorepo structure. You'll need two terminals to run both parts:

**Terminal 1: Backend**
```bash
cd my-project/backend
./mvnw spring-boot:run
```

**Terminal 2: Frontend**
```bash
cd my-project/frontend
npm install
npm run dev
```

Your backend will be available at `http://localhost:8080` and your frontend at `http://localhost:3000`.

## Next Steps

- Explore [CLI Commands]({{ site.baseurl }}/commands) to add entities to your project.
- Understand the [Architecture]({{ site.baseurl }}/architecture) behind your new application.
