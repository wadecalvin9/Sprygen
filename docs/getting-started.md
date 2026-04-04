---
layout: default
title: Getting Started
nav_order: 2
---

# Getting Started

## Prerequisites

Before using Sprygen, ensure you have the following installed on your system:

- **Node.js** (v16 or newer)
- **Java Development Kit (JDK)** 17 or 21
- **Maven** or **Gradle** (matching your preferred build tool)

## Installation

Sprygen is distributed as an npm package. Install it globally to make the `sprygen` command available from your terminal anywhere.

```bash
npm install -g sprygen
```

*(If you are developing Sprygen locally, clone the repository, run `npm install`, compile it using `npm run build`, and link it using `npm link`.)*

## Verifying the Installation

Open a terminal and run:

```bash
sprygen --version
```

If it prints the version number, you are good to go!

## Creating Your First Project

The fastest way to get started is by scaffolding a new project:

```bash
sprygen new my-spring-app
```

Then answer the interactive prompts to define your stack. Once generation completes, you can navigate into your new project, build it from the terminal, and run it!

```bash
cd my-spring-app
./mvnw spring-boot:run
```

You've successfully started a Sprygen-powered Spring Boot application!
