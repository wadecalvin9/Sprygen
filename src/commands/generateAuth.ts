import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { AuthGenerator } from '../generator/AuthGenerator';
import { AuthOptions } from '../types';
import { logger } from '../utils/logger';

export async function generateAuthCommand(): Promise<void> {
  const projectDir = process.cwd();
  
  // Try to read pom.xml or build.gradle to extract package name
  let packageName = '';
  let projectName = path.basename(projectDir);
  
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

  const options: AuthOptions = {
    packageName: answers.packageName,
    packagePath: answers.packageName.replace(/\./g, '/'),
    projectDir,
    projectName,
  };

  const generator = new AuthGenerator();
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
