---
layout: default
title: add-entity
parent: Commands
nav_order: 2
---

# `sprygen add-entity`

Accelerate feature development. Inside your Sprygen project, run `sprygen add-entity <Name>` to instantly generate the full persistence and API layer for a new domain object.

## Process

The CLI prompts you to define fields iteratively:
- **Field Name:** e.g., `title`, `price`
- **Field Type:** String, Integer, Double, Boolean, LocalDate, etc.
- **Constraints:** Nullable, Unique

## What gets generated?

1. **Entity:** `Product.java` extends `AbstractAuditingEntity` for auto-timestamps.
2. **Repository:** `ProductRepository.java` equipped with `JpaSpecificationExecutor`.
3. **Specification Builder:** `ProductSpecification.java` for dynamic query building.
4. **DTOs:** Request/Response payloads + `ProductFilter.java`.
5. **Mapper:** `ProductMapper.java` utilizing MapStruct.
6. **Service:** `ProductService.java` handling core business logic, mapping, and returning `Page<ProductDto>`.
7. **Controller:** `ProductController.java` with complete REST CRUD endpoints, auto-wired for pagination and filtering.
8. **Test:** `ProductControllerTest.java` integration test stub.
9. **Migration:** `V2__create_product_table.sql` Flyway script *(if the project has Flyway enabled)*.

**Usage:**

```bash
cd my-awesome-backend
sprygen add-entity Product
```
