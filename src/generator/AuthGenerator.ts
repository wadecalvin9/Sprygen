import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { AuthOptions } from '../types';
import { writeGeneratedFile } from '../utils/fileWriter';
import { logger } from '../utils/logger';

export class AuthGenerator {
  private templatesDir: string;

  constructor() {
    this.templatesDir = path.resolve(__dirname, '../templates/auth');
  }

  async generate(options: AuthOptions): Promise<void> {
    logger.title('Generating JWT Authentication');

    const spinner = ora({ text: 'Scaffolding security files...', color: 'cyan' }).start();

    try {
      const javaBase = path.join(options.projectDir, 'src/main/java', options.packagePath);

      if (!(await fs.pathExists(javaBase))) {
        throw new Error(
          `Cannot find Java source directory. Make sure you are inside a Sprygen project directory.`,
        );
      }

      const context: Record<string, unknown> = {
        packageName: options.packageName,
        packagePath: options.packagePath,
        projectName: options.projectName,
        year: new Date().getFullYear(),
      };

      spinner.text = 'Writing SecurityConfig.java...';
      await writeGeneratedFile(
        path.join(javaBase, 'config', 'SecurityConfig.java'),
        path.join(this.templatesDir, 'SecurityConfig.java.ejs'),
        context,
      );

      spinner.text = 'Writing JwtService.java...';
      await writeGeneratedFile(
        path.join(javaBase, 'service', 'JwtService.java'),
        path.join(this.templatesDir, 'JwtService.java.ejs'),
        context,
      );

      spinner.text = 'Writing JwtAuthFilter.java...';
      await writeGeneratedFile(
        path.join(javaBase, 'security', 'JwtAuthFilter.java'),
        path.join(this.templatesDir, 'JwtAuthFilter.java.ejs'),
        context,
      );

      spinner.text = 'Writing AuthController.java...';
      await writeGeneratedFile(
        path.join(javaBase, 'controller', 'AuthController.java'),
        path.join(this.templatesDir, 'AuthController.java.ejs'),
        context,
      );

      spinner.text = 'Writing UserDetailsServiceImpl.java...';
      await writeGeneratedFile(
        path.join(javaBase, 'security', 'UserDetailsServiceImpl.java'),
        path.join(this.templatesDir, 'UserDetailsServiceImpl.java.ejs'),
        context,
      );

      spinner.succeed('JWT authentication scaffolded successfully!');
    } catch (err) {
      spinner.fail('Auth generation failed.');
      throw err;
    }

    logger.success('\nJWT auth files generated.\n');
    logger.info('Make sure your application.yml has: jwt.secret and jwt.expiration set.\n');
  }
}
