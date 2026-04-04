#!/usr/bin/env node
import { Command } from 'commander';
import { newCommand } from './commands/new';
import { addEntityCommand } from './commands/addEntity';
import { generateAuthCommand } from './commands/generateAuth';
import { updateCommand } from './commands/update';

const program = new Command();

const { version } = require('../package.json');

program
  .name('sprygen')
  .description('A production-ready Spring Boot project generator CLI')
  .version(version);

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

program
  .command('update')
  .description('Update Sprygen to the latest version')
  .action(() => {
    updateCommand();
  });

// Setup parsing of the CLI args
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
