---
layout: default
title: block-generate
parent: Commands
nav_order: 3
---

# `sprygen block-generate`

Design your database schema declaratively and generate your entire backend in one highly optimized pass.

This command reads a `schema.json` file and translates all entities and relationships into fully functioning, compiling Java classes.

## Example `schema.json`

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

## Running the generation

```bash
sprygen block-generate schema.json
```

This will run the equivalent of `add-entity` for every item in your schema and properly wire up the `@ManyToOne`, `@OneToMany`, etc. JPA relationship annotations automatically.
