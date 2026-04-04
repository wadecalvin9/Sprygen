import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { EntityOptions } from '../types';
import { writeGeneratedFile } from '../utils/fileWriter';
import { logger } from '../utils/logger';

const META_FILE = '.sprygen/meta.json';

export class EntityGenerator {
  private templatesDir: string;

  constructor() {
    const candidates = [
      path.resolve(__dirname, '../../templates/entity'),
      path.resolve(__dirname, '../templates/entity'),
    ];
    const found = candidates.find(p => fs.existsSync(p));
    if (!found) throw new Error('Could not locate entity templates directory.');
    this.templatesDir = found;
  }

  async generate(options: EntityOptions): Promise<void> {
    logger.title(`Generating entity: ${options.entityName}`);

    const spinner = ora({ text: 'Scaffolding entity files...', color: 'cyan' }).start();

    try {
      const javaBase = path.join(options.projectDir, 'src/main/java', options.packagePath);
      const testBase = path.join(options.projectDir, 'src/test/java', options.packagePath);

      if (!(await fs.pathExists(javaBase))) {
        throw new Error(
          `Cannot find Java source directory at "${javaBase}". ` +
          `Make sure you are running this command inside a Sprygen-generated project.`,
        );
      }

      // Resolve next Flyway migration version
      const migrationVersion = await this.getNextMigrationVersion(options.projectDir);
      const context = this.buildContext(options, migrationVersion);

      spinner.text = 'Writing entity, repository, spec, service, mapper, controller…';

      // Core entity stack
      await writeGeneratedFile(
        path.join(javaBase, 'entity', `${options.entityName}.java`),
        path.join(this.templatesDir, 'Entity.java.ejs'),
        context,
      );

      await writeGeneratedFile(
        path.join(javaBase, 'repository', `${options.entityName}Repository.java`),
        path.join(this.templatesDir, 'EntityRepository.java.ejs'),
        context,
      );

      // Specification (always — needed by service)
      await fs.ensureDir(path.join(javaBase, 'repository'));
      await writeGeneratedFile(
        path.join(javaBase, 'repository', `${options.entityName}Specification.java`),
        path.join(this.templatesDir, 'EntitySpecification.java.ejs'),
        context,
      );

      // Filter DTO
      await writeGeneratedFile(
        path.join(javaBase, 'dto', `${options.entityName}Filter.java`),
        path.join(this.templatesDir, 'EntityFilter.java.ejs'),
        context,
      );

      // Response DTO
      await writeGeneratedFile(
        path.join(javaBase, 'dto', `${options.entityName}Dto.java`),
        path.join(this.templatesDir, 'EntityDto.java.ejs'),
        context,
      );

      // MapStruct mapper (always-on)
      await fs.ensureDir(path.join(javaBase, 'mapper'));
      await writeGeneratedFile(
        path.join(javaBase, 'mapper', `${options.entityName}Mapper.java`),
        path.join(this.templatesDir, 'EntityMapper.java.ejs'),
        context,
      );

      // Service
      await writeGeneratedFile(
        path.join(javaBase, 'service', `${options.entityName}Service.java`),
        path.join(this.templatesDir, 'EntityService.java.ejs'),
        context,
      );

      // Controller
      await writeGeneratedFile(
        path.join(javaBase, 'controller', `${options.entityName}Controller.java`),
        path.join(this.templatesDir, 'EntityController.java.ejs'),
        context,
      );

      // Test stub
      spinner.text = 'Writing integration test stub…';
      await fs.ensureDir(path.join(testBase, 'controller'));
      await writeGeneratedFile(
        path.join(testBase, 'controller', `${options.entityName}ControllerTest.java`),
        path.join(this.templatesDir, 'EntityControllerTest.java.ejs'),
        context,
      );

      // Flyway migration (only if .sprygen/meta.json exists indicating flyway project)
      if (options.flyway) {
        spinner.text = 'Writing Flyway migration…';
        const migrationDir = path.join(options.projectDir, 'src/main/resources/db/migration');
        await fs.ensureDir(migrationDir);
        const migrationFile = `V${migrationVersion}__create_${options.entityNameLower}_table.sql`;
        await writeGeneratedFile(
          path.join(migrationDir, migrationFile),
          path.join(this.templatesDir, 'Vmigration__create_table.sql.ejs'),
          context,
        );
        await this.incrementMigrationVersion(options.projectDir, migrationVersion);
      }

      spinner.succeed(`Entity "${options.entityName}" generated successfully!`);
    } catch (err) {
      spinner.fail('Entity generation failed.');
      throw err;
    }

    logger.success(`\nEntity "${options.entityName}" files created.\n`);
  }

  /** Read next migration version from .sprygen/meta.json */
  private async getNextMigrationVersion(projectDir: string): Promise<number> {
    const metaPath = path.join(projectDir, META_FILE);
    if (await fs.pathExists(metaPath)) {
      const meta = await fs.readJson(metaPath);
      return (meta.migrationVersion ?? 1) + 1;
    }
    return 2; // V1 is always the init schema
  }

  /** Persist incremented version back to meta.json */
  private async incrementMigrationVersion(projectDir: string, used: number): Promise<void> {
    const metaPath = path.join(projectDir, META_FILE);
    await fs.ensureDir(path.dirname(metaPath));
    let meta: Record<string, unknown> = {};
    if (await fs.pathExists(metaPath)) meta = await fs.readJson(metaPath);
    meta.migrationVersion = used;
    await fs.writeJson(metaPath, meta, { spaces: 2 });
  }

  private buildContext(options: EntityOptions, migrationVersion: number): Record<string, unknown> {
    return {
      entityName:       options.entityName,
      entityNameLower:  options.entityNameLower,
      entityNameUpper:  options.entityNameUpper,
      packageName:      options.packageName,
      packagePath:      options.packagePath,
      fields:           options.fields,
      relations:        options.relations || [],
      flyway:           options.flyway,
      migrationVersion,
      year:             new Date().getFullYear(),
    };
  }
}
