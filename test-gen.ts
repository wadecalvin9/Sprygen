import { ProjectGenerator } from './src/generator/ProjectGenerator';
import type { ProjectOptions } from './src/types';

async function run() {
  const options: ProjectOptions = {
    projectName: 'starterdebug',
    packageName: 'com.example.starter',
    packagePath: 'com/example/starter',
    database: 'mysql',
    buildTool: 'maven',
    modules: ['Swagger', 'Flyway Database Migrations'],
    javaVersion: '21',
    springBootVersion: '3.4.1',
    description: 'test db',
    authStrategy: 'jwt',
    projectType: 'api',
    flyway: true
  };
  const gen = new ProjectGenerator();
  await gen.generate(options);
}
run().catch(console.error);
