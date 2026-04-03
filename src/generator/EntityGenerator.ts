import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { EntityOptions } from '../types';
import { writeGeneratedFile } from '../utils/fileWriter';
import { logger } from '../utils/logger';

export class EntityGenerator {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.resolve(__dirname, '../../templates/entity');
  }

  async generate(options: EntityOptions): Promise<void> {
    logger.title(`Generating entity: ${options.entityName}`);

    const spinner = ora({ text: 'Scaffolding entity files...', color: 'cyan' }).start();

    try {
      const javaBase = path.join(options.projectDir, 'src/main/java', options.packagePath);
      const testBase = path.join(options.projectDir, 'src/test/java', options.packagePath);

      if (!(await fs.pathExists(javaBase))) {
        throw new Error(
          `Cannot find Java source directory at "${javaBase}". Make sure you are running this command inside a Sprygen-generated project.`,
        );
      }

      const context = this.buildContext(options);

      spinner.text = 'Writing entity, repository, service, controller...';

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

      await writeGeneratedFile(
        path.join(javaBase, 'service', `${options.entityName}Service.java`),
        path.join(this.templatesDir, 'EntityService.java.ejs'),
        context,
      );

      await writeGeneratedFile(
        path.join(javaBase, 'controller', `${options.entityName}Controller.java`),
        path.join(this.templatesDir, 'EntityController.java.ejs'),
        context,
      );

      await writeGeneratedFile(
        path.join(javaBase, 'dto', `${options.entityName}Dto.java`),
        path.join(this.templatesDir, 'EntityDto.java.ejs'),
        context,
      );

      spinner.text = 'Writing entity test...';
      await fs.ensureDir(path.join(testBase, 'controller'));
      await writeGeneratedFile(
        path.join(testBase, 'controller', `${options.entityName}ControllerTest.java`),
        path.join(this.templatesDir, 'EntityControllerTest.java.ejs'),
        context,
      );

      spinner.succeed(`Entity "${options.entityName}" generated successfully!`);
    } catch (err) {
      spinner.fail('Entity generation failed.');
      throw err;
    }

    logger.success(`\nEntity "${options.entityName}" files created.\n`);
  }

  private buildContext(options: EntityOptions): Record<string, unknown> {
    return {
      entityName: options.entityName,
      entityNameLower: options.entityNameLower,
      entityNameUpper: options.entityNameUpper,
      packageName: options.packageName,
      packagePath: options.packagePath,
      fields: options.fields,
      year: new Date().getFullYear(),
    };
  }
}
