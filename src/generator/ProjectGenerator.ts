import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { ProjectOptions } from '../types';
import { logger } from '../utils/logger';

export class ProjectGenerator {
  private templatesDir: string;

  constructor() {
    // Resolve templates in all execution environments:
    //   ts-node:       __dirname = src/generator  → ../../templates/project
    //   tsup bundle:   __dirname = dist           → ../templates/project
    //   global install:__dirname = dist           → ../templates/project (bundled)
    const candidates = [
      path.resolve(__dirname, '../../templates/project'),  // ts-node
      path.resolve(__dirname, '../templates/project'),     // tsup single bundle / global
    ];
    const found = candidates.find(p => fs.existsSync(p));
    if (!found) {
      throw new Error(
        `Could not locate templates directory. Tried:\n${candidates.join('\n')}`
      );
    }
    this.templatesDir = found;
  }


  async generate(options: ProjectOptions): Promise<void> {
    const outputDir = path.resolve(process.cwd(), options.projectName);

    // Check if output directory already exists
    if (await fs.pathExists(outputDir)) {
      throw new Error(`Directory "${options.projectName}" already exists. Please choose a different project name or remove the existing directory.`);
    }

    logger.title(`Generating Spring Boot project: ${options.projectName}`);
    const spinner = ora({ text: 'Downloading from Spring Initializr...', color: 'cyan' }).start();

    try {
      const artifactId = options.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const groupId = options.packageName.split('.').slice(0, -1).join('.') || options.packageName;
      
      const type = options.buildTool === 'maven' ? 'maven-project' : 'gradle-project';
      let dependencies = 'web,data-jpa,security,validation,lombok';
      
      if (options.database === 'mysql') dependencies += ',mysql';
      if (options.database === 'postgresql') dependencies += ',postgresql';
      if (options.database === 'h2') dependencies += ',h2';
      
      if (options.modules.includes('Mail')) dependencies += ',mail';

      const url = new URL('https://start.spring.io/starter.zip');
      url.searchParams.append('type', type);
      url.searchParams.append('language', 'java');
      url.searchParams.append('baseDir', options.projectName);
      url.searchParams.append('groupId', groupId);
      url.searchParams.append('artifactId', artifactId);
      url.searchParams.append('name', options.projectName);
      url.searchParams.append('description', options.description);
      url.searchParams.append('packageName', options.packageName);
      url.searchParams.append('packaging', 'jar');
      url.searchParams.append('javaVersion', options.javaVersion);
      url.searchParams.append('dependencies', dependencies);

      const response = await axios({
        url: url.toString(),
        method: 'GET',
        responseType: 'arraybuffer',
      });

      spinner.text = 'Extracting project scaffold...';
      const tmpZipPath = path.resolve(process.cwd(), `${options.projectName}-tmp.zip`);
      await fs.writeFile(tmpZipPath, response.data);

      const zip = new AdmZip(tmpZipPath);
      zip.extractAllTo(process.cwd(), true);
      await fs.unlink(tmpZipPath);

      spinner.text = 'Patching dependencies and writing custom templates...';
      
      await this.patchDependencies(outputDir, options);
      
      const context = this.buildContext(options, outputDir, artifactId, groupId);
      
      const javaSourceBase = path.join(outputDir, 'src/main/java', options.packagePath);
      const resourcesBase = path.join(outputDir, 'src/main/resources');

      await fs.ensureDir(javaSourceBase);
      await fs.ensureDir(resourcesBase);

      // Clean up properties and write our own yaml
      if (await fs.pathExists(path.join(resourcesBase, 'application.properties'))) {
        await fs.unlink(path.join(resourcesBase, 'application.properties'));
      }
      
      await this.generateJavaSources(javaSourceBase, context, options.modules.includes('Swagger'));
      await this.generateResources(resourcesBase, context, options);

      spinner.succeed(`Project "${options.projectName}" scaffolded via Spring Initializr successfully!`);
    } catch (err) {
      spinner.fail('Project generation failed.');
      throw err;
    }

    this.printSuccessMessage(options);
  }

  private async patchDependencies(outputDir: string, options: ProjectOptions) {
    const hasSwagger = options.modules.includes('Swagger');
    
    if (options.buildTool === 'maven') {
      const pomPath = path.join(outputDir, 'pom.xml');
      let pomContent = await fs.readFile(pomPath, 'utf8');
      
      const jwtdeps = `
        <!-- JWT Dependencies -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.11.5</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.11.5</version>
            <scope>runtime</scope>
        </dependency>`;
        
      const swaggerDep = hasSwagger ? `
        <!-- Swagger Dependency -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>` : '';
        
      pomContent = pomContent.replace('</dependencies>', `${jwtdeps}${swaggerDep}\n    </dependencies>`);
      await fs.writeFile(pomPath, pomContent, 'utf8');
      
    } else {
      const gradlePath = path.join(outputDir, 'build.gradle');
      const swaggerDepStr = hasSwagger ? `\n    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0'` : '';
      
      const appendStr = `\n
dependencies {
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.11.5'${swaggerDepStr}
}\n`;
      await fs.appendFile(gradlePath, appendStr, 'utf8');
    }
  }

  private buildContext(options: ProjectOptions, outputDir: string, artifactId: string, groupId: string) {
    const mainClassName = this.toPascalCase(options.projectName.replace(/[^a-zA-Z0-9]/g, '')) + 'Application';
    const dbDependencies = this.getDbDependencies(options.database);
    const dbConfig = this.getDbConfig(options.database, artifactId);

    return {
      projectName: options.projectName,
      projectNamePascal: mainClassName.replace('Application', ''),
      artifactId,
      groupId,
      packageName: options.packageName,
      packagePath: options.packagePath,
      database: options.database,
      buildTool: options.buildTool,
      mainClassName,
      javaVersion: options.javaVersion,
      springBootVersion: options.springBootVersion,
      description: options.description,
      hasSwagger: options.modules.includes('Swagger'),
      hasMail: options.modules.includes('Mail'),
      hasLogging: options.modules.includes('Logging'),
      dbDependency: dbDependencies.dependency,
      dbDriverClass: dbDependencies.driverClass,
      dbConfig,
      outputDir,
      modules: options.modules,
      year: new Date().getFullYear(),
    };
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getDbDependencies(db: string) {
    switch (db) {
      case 'mysql': return { dependency: 'mysql', driverClass: 'com.mysql.cj.jdbc.Driver' };
      case 'postgresql': return { dependency: 'postgresql', driverClass: 'org.postgresql.Driver' };
      default: return { dependency: 'h2', driverClass: 'org.h2.Driver' };
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

  private async generateJavaSources(javaBase: string, context: object, hasSwagger: boolean): Promise<void> {
    const { writeGeneratedFile } = await import('../utils/fileWriter');
    const tDir = path.join(this.templatesDir, 'java');
    const ctx = context as Record<string, unknown>;

    const files: Array<[string, string]> = [
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

    if (hasSwagger) {
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
