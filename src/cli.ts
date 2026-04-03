#!/usr/bin/env node
import { Command } from 'commander';
import { newCommand } from './commands/new';
import { addEntityCommand } from './commands/addEntity';
import { generateAuthCommand } from './commands/generateAuth';

const program = new Command();

program
  .name('sprygen')
  .description('A JHipster-like Spring Boot project generator CLI')
  .version('1.0.0');

program
  .command('new <project-name>')
  .description('Generate a new Spring Boot project')
  .action(async (projectName: string) => {
    await newCommand(projectName);
  });

program
  .command('add-entity <entity-name>')
  .description('Generate a repository, service, controller, and test for a new entity in an existing project')
  .action(async (entityName: string) => {
    await addEntityCommand(entityName);
  });

program
  .command('generate-auth')
  .description('Scaffold JWT authentication and security configuration in an existing project')
  .action(async () => {
    await generateAuthCommand();
  });

// Setup parsing of the CLI args
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
