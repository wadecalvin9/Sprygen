import inquirer from 'inquirer';
import { ProjectGenerator } from '../generator/ProjectGenerator';
import { ProjectOptions } from '../types';
import { validatePackageName, validateProjectName, toPackagePath } from '../utils/validator';
import { logger, printBanner, printSection } from '../utils/logger';

export async function newCommand(projectName: string): Promise<void> {
  printBanner('1.0.0');

  const validResult = validateProjectName(projectName);
  if (typeof validResult === 'string') {
    logger.error(validResult);
    process.exit(1);
  }

  printSection('Configure Project');

  const basics = await inquirer.prompt([
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
        { name: 'Maven  (recommended)', value: 'maven' },
        { name: 'Gradle (Groovy DSL)', value: 'gradle' },
      ],
      default: 'maven',
    },
    {
      type: 'list',
      name: 'database',
      message: 'Database:',
      choices: [
        { name: 'H2        (in-memory, great for dev/testing)', value: 'h2' },
        { name: 'MySQL     ', value: 'mysql' },
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
  ]);

  printSection('Authentication & Frontend');

  const authAnswers = await inquirer.prompt([
    {
      type: 'list',
      name: 'authStrategy',
      message: 'Authentication method:',
      choices: [
        {
          name: 'JWT       — stateless, token-based, ideal for REST + SPA  (recommended)',
          value: 'jwt',
        },
        {
          name: 'Session   — Spring form-login, stateful, ideal for Thymeleaf apps',
          value: 'session',
        },
      ],
      default: 'jwt',
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'Project type:',
      choices: [
        {
          name: 'REST API  — JSON responses only, no frontend',
          value: 'api',
        },
        {
          name: 'Fullstack — REST API + frontend (dashboard, profiles, admin panel)',
          value: 'fullstack',
        },
      ],
      default: 'api',
    },
  ]);

  printSection('Select Modules');

  const modulesAnswer = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'modules',
      message: 'Optional modules (space to toggle):',
      choices: [
        { name: 'Swagger / OpenAPI UI', value: 'Swagger', checked: true },
        { name: 'Mail  (Spring Mail SMTP)', value: 'Mail' },
        { name: 'Logging (Logback with file appender)', value: 'Logging' },
      ],
    },
  ]);

  const options: ProjectOptions = {
    projectName,
    packageName: basics.packageName,
    packagePath: toPackagePath(basics.packageName),
    database: basics.database,
    buildTool: basics.buildTool,
    modules: modulesAnswer.modules,
    javaVersion: basics.javaVersion,
    springBootVersion: '3.2.4',
    description: basics.description,
    authStrategy: authAnswers.authStrategy,
    projectType: authAnswers.projectType,
  };

  const generator = new ProjectGenerator();
  try {
    printSection(`Generating  ${projectName}`);
    console.log();
    await generator.generate(options);
    logger.done();
  } catch (err: unknown) {
    console.log();
    if (err instanceof Error) {
      logger.error(err.message);
    } else {
      logger.error('An unexpected error occurred.');
    }
    process.exit(1);
  }
}
