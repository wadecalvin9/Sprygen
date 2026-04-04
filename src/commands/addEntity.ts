import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { EntityGenerator } from '../generator/EntityGenerator';
import { EntityOptions, EntityField } from '../types';
import { validateEntityName, toPascalCase, toCamelCase } from '../utils/validator';
import { logger } from '../utils/logger';

export async function addEntityCommand(entityName: string): Promise<void> {
  const validResult = validateEntityName(entityName);
  if (typeof validResult === 'string') {
    logger.error(validResult);
    process.exit(1);
  }

  const projectDir = process.cwd();
  
  // Try to read pom.xml or build.gradle to extract package name
  let packageName = '';
  try {
    const mainJavaDir = path.join(projectDir, 'src/main/java');
    if (await fs.pathExists(mainJavaDir)) {
       const dirs = await fs.readdir(mainJavaDir);
       if (dirs.length > 0) {
           let currentDir = path.join(mainJavaDir, dirs[0]);
           packageName = dirs[0];
           
           while(true) {
               const subdirs = await fs.readdir(currentDir, { withFileTypes: true });
               const nextDirs = subdirs.filter(dirent => dirent.isDirectory());
               if (nextDirs.length === 1) {
                   packageName += '.' + nextDirs[0].name;
                   currentDir = path.join(currentDir, nextDirs[0].name);
               } else {
                   break;
               }
           }
       }
    }
  } catch (e) {
      // ignore
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'packageName',
      message: 'Base package name (e.g. com.example.myapp):',
      default: packageName || 'com.example.myapp',
    }
  ]);

  const fields: EntityField[] = [];
  let addingFields = true;

  logger.info('\nAdd fields to your entity (leave name empty to finish)\n');

  while (addingFields) {
    const fieldPrompt = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Field name (camelCase):',
      }
    ]);

    if (!fieldPrompt.name || fieldPrompt.name.trim() === '') {
      addingFields = false;
      break;
    }

    const typePrompt = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: `Type for ${fieldPrompt.name}:`,
        choices: ['String', 'Integer', 'Long', 'Boolean', 'Double', 'LocalDate', 'LocalDateTime'],
        default: 'String'
      },
      {
         type: 'confirm',
         name: 'nullable',
         message: 'Can it be null?',
         default: false
      }
    ]);

    fields.push({
      name: fieldPrompt.name,
      type: typePrompt.type,
      nullable: typePrompt.nullable
    });
  }

  const entityNamePascal = toPascalCase(entityName);

  // Detect Flyway by looking for .sprygen/meta.json or db/migration folder
  const flywayDetected =
    (await fs.pathExists(path.join(projectDir, '.sprygen/meta.json'))) ||
    (await fs.pathExists(path.join(projectDir, 'src/main/resources/db/migration')));

  const options: EntityOptions = {
    entityName: entityNamePascal,
    entityNameLower: entityName.toLowerCase(),
    entityNameUpper: entityName.toUpperCase(),
    packageName: answers.packageName,
    packagePath: answers.packageName.replace(/\./g, '/'),
    fields,
    relations: [], // Basic CLI prompt doesn't ask for relations yet
    projectDir,
    flyway: flywayDetected,
  };

  const generator = new EntityGenerator();
  try {
    await generator.generate(options);
  } catch (err: unknown) {
    if (err instanceof Error) {
      logger.error(err.message);
    } else {
      logger.error('An unexpected error occurred.');
    }
    process.exit(1);
  }
}
