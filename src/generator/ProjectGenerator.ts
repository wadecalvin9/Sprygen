import path from 'path';
import ora from 'ora';
import { ProjectOptions } from '../types';
import { copyTemplate } from '../utils/fileWriter';
import { logger } from '../utils/logger';
import fs from 'fs-extra';

export class ProjectGenerator {
  private templatesDir: string;

  constructor() {
    // When installed globally, templates are alongside dist/
    this.templatesDir = path.resolve(__dirname, '../../templates/project');
  }

  async generate(options: ProjectOptions): Promise<void> {
    const outputDir = path.resolve(process.cwd(), options.projectName);

    // Check if output directory already exists
    if (await fs.pathExists(outputDir)) {
      throw new Error(`Directory "${options.projectName}" already exists. Please choose a different project name or remove the existing directory.`);
    }

    logger.title(`Generating Spring Boot project: ${options.projectName}`);

    const spinner = ora({ text: 'Scaffolding project files...', color: 'cyan' }).start();

    try {
      const context = this.buildContext(options, outputDir);
      const javaSourceBase = path.join(
        outputDir,
        'src/main/java',
        options.packagePath,
      );
      const testSourceBase = path.join(
        outputDir,
        'src/test/java',
        options.packagePath,
      );
      const resourcesBase = path.join(outputDir, 'src/main/resources');

      // Ensure source directories
      await fs.ensureDir(javaSourceBase);
      await fs.ensureDir(testSourceBase);
      await fs.ensureDir(resourcesBase);

      spinner.text = 'Writing root project files...';
      await this.generateRootFiles(outputDir, context, options);

      spinner.text = 'Writing Java source files...';
      await this.generateJavaSources(javaSourceBase, context);

      spinner.text = 'Writing test files...';
      await this.generateTests(testSourceBase, context);

      spinner.text = 'Writing resources...';
      await this.generateResources(resourcesBase, context, options);

      spinner.succeed(`Project "${options.projectName}" generated successfully!`);
    } catch (err) {
      spinner.fail('Project generation failed.');
      throw err;
    }

    this.printSuccessMessage(options);
  }

  private buildContext(options: ProjectOptions, outputDir: string) {
    const { projectName, packageName, packagePath, database, buildTool, modules } = options;
    const artifactId = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const groupId = packageName.split('.').slice(0, -1).join('.') || packageName;
    const mainClassName = this.toPascalCase(projectName.replace(/[^a-zA-Z0-9]/g, '')) + 'Application';

    const dbDependencies = this.getDbDependencies(database);
    const dbConfig = this.getDbConfig(database, artifactId);
    const hasSwagger = modules.includes('Swagger');
    const hasMail = modules.includes('Mail');
    const hasLogging = modules.includes('Logging');

    return {
      projectName,
      projectNamePascal: mainClassName.replace('Application', ''),
      artifactId,
      groupId,
      packageName,
      packagePath,
      database,
      buildTool,
      mainClassName,
      javaVersion: options.javaVersion,
      springBootVersion: options.springBootVersion,
      description: options.description,
      hasSwagger,
      hasMail,
      hasLogging,
      dbDependency: dbDependencies.dependency,
      dbDriverClass: dbDependencies.driverClass,
      dbConfig,
      outputDir,
      modules,
      year: new Date().getFullYear(),
    };
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getDbDependencies(db: string) {
    switch (db) {
      case 'mysql':
        return {
          dependency: 'mysql',
          driverClass: 'com.mysql.cj.jdbc.Driver',
        };
      case 'postgresql':
        return {
          dependency: 'postgresql',
          driverClass: 'org.postgresql.Driver',
        };
      default:
        return { dependency: 'h2', driverClass: 'org.h2.Driver' };
    }
  }

  private getDbConfig(db: string, artifactId: string) {
    switch (db) {
      case 'mysql':
        return {
          url: `jdbc:mysql://localhost:3306/${artifactId}?useSSL=false&serverTimezone=UTC`,
          username: 'root',
          password: 'YOUR_PASSWORD',
          dialect: 'org.hibernate.dialect.MySQL8Dialect',
        };
      case 'postgresql':
        return {
          url: `jdbc:postgresql://localhost:5432/${artifactId}`,
          username: 'postgres',
          password: 'YOUR_PASSWORD',
          dialect: 'org.hibernate.dialect.PostgreSQLDialect',
        };
      default:
        return {
          url: `jdbc:h2:mem:${artifactId};MODE=MySQL`,
          username: 'sa',
          password: '',
          dialect: 'org.hibernate.dialect.H2Dialect',
        };
    }
  }

  private async generateRootFiles(outputDir: string, context: object, options: ProjectOptions): Promise<void> {
    const templateDir = this.templatesDir;
    const buildFile = options.buildTool === 'maven' ? 'pom.xml.ejs' : 'build.gradle.ejs';
    const { writeGeneratedFile } = await import('../utils/fileWriter');

    await writeGeneratedFile(
      path.join(outputDir, options.buildTool === 'maven' ? 'pom.xml' : 'build.gradle'),
      path.join(templateDir, buildFile),
      context as Record<string, unknown>,
    );

    // .gitignore
    await writeGeneratedFile(
      path.join(outputDir, '.gitignore'),
      path.join(templateDir, '.gitignore.ejs'),
      context as Record<string, unknown>,
    );

    // README
    await writeGeneratedFile(
      path.join(outputDir, 'README.md'),
      path.join(templateDir, 'README.md.ejs'),
      context as Record<string, unknown>,
    );
  }

  private async generateJavaSources(javaBase: string, context: object): Promise<void> {
    const { writeGeneratedFile } = await import('../utils/fileWriter');
    const tDir = path.join(this.templatesDir, 'java');
    const ctx = context as Record<string, unknown>;

    const files: Array<[string, string]> = [
      ['Application.java', 'Application.java.ejs'],
      ['config/SecurityConfig.java', 'config/SecurityConfig.java.ejs'],
      ['config/CorsConfig.java', 'config/CorsConfig.java.ejs'],
      ['entity/User.java', 'entity/User.java.ejs'],
      ['repository/UserRepository.java', 'repository/UserRepository.java.ejs'],
      ['service/UserService.java', 'service/UserService.java.ejs'],
      ['service/JwtService.java', 'service/JwtService.java.ejs'],
      ['controller/AuthController.java', 'controller/AuthController.java.ejs'],
      ['controller/UserController.java', 'controller/UserController.java.ejs'],
      ['security/JwtAuthFilter.java', 'security/JwtAuthFilter.java.ejs'],
      ['security/UserDetailsServiceImpl.java', 'security/UserDetailsServiceImpl.java.ejs'],
      ['dto/AuthRequest.java', 'dto/AuthRequest.java.ejs'],
      ['dto/AuthResponse.java', 'dto/AuthResponse.java.ejs'],
      ['dto/UserDto.java', 'dto/UserDto.java.ejs'],
    ];

    // Conditionally add swagger config
    if (ctx['hasSwagger']) {
      files.push(['config/SwaggerConfig.java', 'config/SwaggerConfig.java.ejs']);
    }

    for (const [outName, tplName] of files) {
      await writeGeneratedFile(
        path.join(javaBase, outName),
        path.join(tDir, tplName),
        ctx,
      );
    }
  }

  private async generateTests(testBase: string, context: object): Promise<void> {
    const { writeGeneratedFile } = await import('../utils/fileWriter');
    const tDir = path.join(this.templatesDir, 'test');
    const ctx = context as Record<string, unknown>;

    await writeGeneratedFile(
      path.join(testBase, 'ApplicationTests.java'),
      path.join(tDir, 'ApplicationTests.java.ejs'),
      ctx,
    );
  }

  private async generateResources(resourcesBase: string, context: object, options: ProjectOptions): Promise<void> {
    const { writeGeneratedFile } = await import('../utils/fileWriter');
    const tDir = path.join(this.templatesDir, 'resources');
    const ctx = context as Record<string, unknown>;

    await writeGeneratedFile(
      path.join(resourcesBase, 'application.yml'),
      path.join(tDir, 'application.yml.ejs'),
      ctx,
    );

    if (options.modules.includes('Logging')) {
      await writeGeneratedFile(
        path.join(resourcesBase, 'logback-spring.xml'),
        path.join(tDir, 'logback-spring.xml.ejs'),
        ctx,
      );
    }
  }

  private printSuccessMessage(options: ProjectOptions): void {
    logger.success(`\nProject "${options.projectName}" is ready!\n`);
    console.log(`  Next steps:\n`);
    console.log(`    cd ${options.projectName}`);
    if (options.buildTool === 'maven') {
      console.log(`    ./mvnw spring-boot:run`);
    } else {
      console.log(`    ./gradlew bootRun`);
    }
    console.log('');
    console.log(`  API Docs: http://localhost:8080/swagger-ui.html`);
    console.log(`  Health:   http://localhost:8080/actuator/health`);
    console.log('');
  }
}
