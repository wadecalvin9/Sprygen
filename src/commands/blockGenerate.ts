import path from 'path';
import fs from 'fs-extra';
import { EntityGenerator } from '../generator/EntityGenerator';
import { EntityOptions, SchemaEntity } from '../types';
import { toPascalCase, toCamelCase } from '../utils/validator';
import { logger, printBanner, printSection } from '../utils/logger';

export async function blockGenerateCommand(schemaFile: string): Promise<void> {
  printBanner();
  printSection('Block Generate');

  const schemaPath = path.resolve(process.cwd(), schemaFile);

  if (!(await fs.pathExists(schemaPath))) {
    logger.error(`Schema file not found: ${schemaPath}`);
    logger.info('Expected format: sprygen block-generate schema.json');
    process.exit(1);
  }

  let entities: SchemaEntity[];
  try {
    entities = await fs.readJson(schemaPath);
    if (!Array.isArray(entities) || entities.length === 0) {
      throw new Error('Schema must be a non-empty JSON array of entity definitions.');
    }
  } catch (err) {
    logger.error(`Failed to parse schema file: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const projectDir = process.cwd();

  // Auto-detect package from src/main/java
  let packageName = 'com.example.app';
  try {
    const mainJavaDir = path.join(projectDir, 'src/main/java');
    if (await fs.pathExists(mainJavaDir)) {
      const dirs = await fs.readdir(mainJavaDir);
      if (dirs.length > 0) {
        let currentDir = path.join(mainJavaDir, dirs[0]);
        packageName = dirs[0];
        while (true) {
          const subdirs = (await fs.readdir(currentDir, { withFileTypes: true })).filter(d => d.isDirectory());
          if (subdirs.length === 1) {
            packageName += '.' + subdirs[0].name;
            currentDir = path.join(currentDir, subdirs[0].name);
          } else {
            break;
          }
        }
      }
    }
  } catch {
    // fallback to default
  }

  // Detect Flyway by looking for .sprygen/meta.json or db/migration folder
  const flywayDetected =
    (await fs.pathExists(path.join(projectDir, '.sprygen/meta.json'))) ||
    (await fs.pathExists(path.join(projectDir, 'src/main/resources/db/migration')));

  logger.info(`Found ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'} in schema`);
  logger.info(`Package: ${packageName}`);
  if (flywayDetected) logger.info('Flyway detected — migration files will be generated');
  console.log();

  const generator = new EntityGenerator();

  for (const schema of entities) {
    if (!schema.name) {
      logger.warn('Skipping entity with no name.');
      continue;
    }

    const entityNamePascal = toPascalCase(schema.name);
    const options: EntityOptions = {
      entityName:      entityNamePascal,
      entityNameLower: entityNamePascal.charAt(0).toLowerCase() + entityNamePascal.slice(1),
      entityNameUpper: entityNamePascal.toUpperCase(),
      packageName,
      packagePath:     packageName.replace(/\./g, '/'),
      fields:          schema.fields || [],
      relations:       schema.relations || [],
      projectDir,
      flyway:          flywayDetected,
    };

    try {
      await generator.generate(options);
    } catch (err) {
      logger.error(
        `Failed to generate "${entityNamePascal}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  console.log();
  logger.success(`Block generation complete — ${entities.length} entit${entities.length === 1 ? 'y' : 'ies'} scaffolded.`);
}
