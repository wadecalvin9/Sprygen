import inquirer from 'inquirer';
import { ProjectGenerator } from '../generator/ProjectGenerator';
import { ProjectOptions } from '../types';
import { validatePackageName, validateProjectName, toPackagePath } from '../utils/validator';
import { logger } from '../utils/logger';

export async function newCommand(projectName: string): Promise<void> {
  logger.title('🚀 Sprygen — Spring Boot Project Generator');

  const validResult = validateProjectName(projectName);
  if (typeof validResult === 'string') {
    logger.error(validResult);
    process.exit(1);
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'packageName',
      message: 'Package name:',
      default: `com.example.${projectName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      validate: validatePackageName,
    },
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: `${projectName} Spring Boot Application`,
    },
    {
      type: 'list',
      name: 'buildTool',
      message: 'Build tool:',
      choices: [
        { name: 'Maven (recommended)', value: 'maven' },
        { name: 'Gradle (Groovy DSL)', value: 'gradle' },
      ],
      default: 'maven',
    },
    {
      type: 'list',
      name: 'database',
      message: 'Database:',
      choices: [
        { name: 'H2 (in-memory, great for dev/testing)', value: 'h2' },
        { name: 'MySQL', value: 'mysql' },
        { name: 'PostgreSQL', value: 'postgresql' },
      ],
      default: 'h2',
    },
    {
      type: 'list',
      name: 'javaVersion',
      message: 'Java version:',
      choices: ['21', '17'],
      default: '21',
    },
    {
      type: 'checkbox',
      name: 'modules',
      message: 'Optional modules (space to select):',
      choices: [
        { name: 'Swagger / OpenAPI UI', value: 'Swagger', checked: true },
        { name: 'Mail (Spring Mail SMTP)', value: 'Mail' },
        { name: 'Logging (Logback with file appender)', value: 'Logging' },
      ],
    },
  ]);

  const options: ProjectOptions = {
    projectName,
    packageName: answers.packageName,
    packagePath: toPackagePath(answers.packageName),
    database: answers.database,
    buildTool: answers.buildTool,
    modules: answers.modules,
    javaVersion: answers.javaVersion,
    springBootVersion: '3.2.4',
    description: answers.description,
  };

  const generator = new ProjectGenerator();
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
