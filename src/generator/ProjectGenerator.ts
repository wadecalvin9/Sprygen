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
    const candidates = [
      path.resolve(__dirname, '../../templates/project'),
      path.resolve(__dirname, '../templates/project'),
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

    if (await fs.pathExists(outputDir)) {
      throw new Error(
        `Directory "${options.projectName}" already exists. Please choose a different project name or remove the existing directory.`
      );
    }

    const artifactId = options.projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const groupId    = options.packageName.split('.').slice(0, -1).join('.') || options.packageName;

    logger.title(`Generating Spring Boot project: ${options.projectName}`);

    const spinner = ora({ text: 'Downloading from Spring Initializr…', color: 'cyan' }).start();

    try {
      // ── Step 1: Download from Spring Initializr ──────────────
      let dependencies = 'data-jpa,security,validation,lombok';
      dependencies += ',web';                      // always include web

      if (options.database === 'mysql')      dependencies += ',mysql';
      if (options.database === 'postgresql') dependencies += ',postgresql';
      if (options.database === 'h2')         dependencies += ',h2';
      if (options.modules.includes('Mail'))  dependencies += ',mail';

      // Thymeleaf only added for session + fullstack
      const needsThymeleaf =
        options.authStrategy === 'session' && options.projectType === 'fullstack';
      if (needsThymeleaf) dependencies += ',thymeleaf';

      const type = options.buildTool === 'maven' ? 'maven-project' : 'gradle-project';
      const url  = new URL('https://start.spring.io/starter.zip');
      url.searchParams.append('type',        type);
      url.searchParams.append('language',    'java');
      url.searchParams.append('baseDir',     options.projectName);
      url.searchParams.append('groupId',     groupId);
      url.searchParams.append('artifactId',  artifactId);
      url.searchParams.append('name',        options.projectName);
      url.searchParams.append('description', options.description);
      url.searchParams.append('packageName', options.packageName);
      url.searchParams.append('packaging',   'jar');
      url.searchParams.append('javaVersion', options.javaVersion);
      url.searchParams.append('dependencies', dependencies);

      const response = await axios({
        url:          url.toString(),
        method:       'GET',
        responseType: 'arraybuffer',
      });

      spinner.text = 'Extracting project scaffold…';
      const tmpZipPath = path.resolve(process.cwd(), `${options.projectName}-tmp.zip`);
      await fs.writeFile(tmpZipPath, response.data);
      const zip = new AdmZip(tmpZipPath);
      zip.extractAllTo(process.cwd(), true);
      await fs.unlink(tmpZipPath);

      // ── Step 2: Patch pom.xml / build.gradle ─────────────────
      spinner.text = 'Patching dependencies…';
      await this.patchDependencies(outputDir, options, needsThymeleaf);

      // ── Step 3: Build template context ───────────────────────
      spinner.text = 'Writing source files…';
      const context = this.buildContext(options, outputDir, artifactId, groupId);

      const javaBase      = path.join(outputDir, 'src/main/java', options.packagePath);
      const resourcesBase = path.join(outputDir, 'src/main/resources');

      await fs.ensureDir(javaBase);
      await fs.ensureDir(resourcesBase);

      // Clean up Spring Initializr's properties file
      const propsFile = path.join(resourcesBase, 'application.properties');
      if (await fs.pathExists(propsFile)) await fs.unlink(propsFile);

      // ── Step 4: Generate Java sources ────────────────────────
      await this.generateJavaSources(javaBase, context, options);

      // ── Step 5: Generate resources ────────────────────────────
      await this.generateResources(resourcesBase, context, options);

      // ── Step 6: Generate frontend ────────────────────────────
      if (options.projectType === 'fullstack') {
        spinner.text = 'Writing frontend files…';
        await this.generateFrontend(outputDir, context, options, needsThymeleaf);
      }

      spinner.succeed(`Project "${options.projectName}" scaffolded successfully!`);
    } catch (err) {
      spinner.fail('Project generation failed.');
      throw err;
    }

    this.printSuccessMessage(options);
  }

  private async patchDependencies(
    outputDir: string,
    options: ProjectOptions,
    needsThymeleaf: boolean,
  ) {
    const hasSwagger = options.modules.includes('Swagger');

    if (options.buildTool === 'maven') {
      const pomPath    = path.join(outputDir, 'pom.xml');
      let pomContent   = await fs.readFile(pomPath, 'utf8');

      // JWT deps (only for JWT auth strategy)
      const jwtDeps = options.authStrategy === 'jwt' ? `
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
        </dependency>` : '';

      const swaggerDep = hasSwagger ? `
        <!-- Swagger/OpenAPI -->
        <dependency>
            <groupId>org.springdoc</groupId>
            <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
            <version>2.3.0</version>
        </dependency>` : '';

      // Thymeleaf Spring Security extras (role checks in templates)
      const thymeleafSecDep = needsThymeleaf ? `
        <!-- Thymeleaf Spring Security Extras -->
        <dependency>
            <groupId>org.thymeleaf.extras</groupId>
            <artifactId>thymeleaf-extras-springsecurity6</artifactId>
        </dependency>` : '';

      pomContent = pomContent.replace(
        '</dependencies>',
        `${jwtDeps}${swaggerDep}${thymeleafSecDep}\n    </dependencies>`
      );
      await fs.writeFile(pomPath, pomContent, 'utf8');

    } else {
      const gradlePath = path.join(outputDir, 'build.gradle');
      const swaggerStr = hasSwagger
        ? `\n    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0'`
        : '';
      const thymeleafStr = needsThymeleaf
        ? `\n    implementation 'org.thymeleaf.extras:thymeleaf-extras-springsecurity6'`
        : '';
      const jwtStr = options.authStrategy === 'jwt' ? `
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    runtimeOnly    'io.jsonwebtoken:jjwt-impl:0.11.5'
    runtimeOnly    'io.jsonwebtoken:jjwt-jackson:0.11.5'` : '';

      const appendStr = `\ndependencies {${jwtStr}${swaggerStr}${thymeleafStr}\n}\n`;
      await fs.appendFile(gradlePath, appendStr, 'utf8');
    }
  }

  private buildContext(
    options: ProjectOptions,
    outputDir: string,
    artifactId: string,
    groupId: string,
  ) {
    const mainClassName  = this.toPascalCase(
      options.projectName.replace(/[^a-zA-Z0-9]/g, '')
    ) + 'Application';
    const dbDependencies = this.getDbDependencies(options.database);
    const dbConfig       = this.getDbConfig(options.database, artifactId);

    return {
      projectName:       options.projectName,
      projectNamePascal: mainClassName.replace('Application', ''),
      artifactId,
      groupId,
      packageName:       options.packageName,
      packagePath:       options.packagePath,
      database:          options.database,
      buildTool:         options.buildTool,
      mainClassName,
      javaVersion:       options.javaVersion,
      springBootVersion: options.springBootVersion,
      description:       options.description,
      hasSwagger:        options.modules.includes('Swagger'),
      hasMail:           options.modules.includes('Mail'),
      hasLogging:        options.modules.includes('Logging'),
      isJwtAuth:         options.authStrategy === 'jwt',
      isSessionAuth:     options.authStrategy === 'session',
      isFullstack:       options.projectType  === 'fullstack',
      isApiOnly:         options.projectType  === 'api',
      dbDependency:      dbDependencies.dependency,
      dbDriverClass:     dbDependencies.driverClass,
      dbConfig,
      outputDir,
      modules:           options.modules,
      year:              new Date().getFullYear(),
    };
  }

  private async generateJavaSources(
    javaBase: string,
    context: object,
    options: ProjectOptions,
  ): Promise<void> {
    const { writeGeneratedFile } = await import('../utils/fileWriter');
    const tDir = path.join(this.templatesDir, 'java');
    const ctx  = context as Record<string, unknown>;

    // ── Always-generated files ───
    const files: Array<[string, string]> = [
      ['entity/User.java',                  'entity/User.java.ejs'],
      ['entity/Role.java',                  'entity/Role.java.ejs'],
      ['repository/UserRepository.java',    'repository/UserRepository.java.ejs'],
      ['service/UserService.java',          'service/UserService.java.ejs'],
      ['controller/AuthController.java',    'controller/AuthController.java.ejs'],
      ['controller/UserController.java',    'controller/UserController.java.ejs'],
      ['controller/HomeController.java',    'controller/HomeController.java.ejs'],
      ['controller/ProfileController.java', 'controller/ProfileController.java.ejs'],
      ['controller/AdminController.java',   'controller/AdminController.java.ejs'],
      ['config/CorsConfig.java',            'config/CorsConfig.java.ejs'],
      ['dto/AuthRequest.java',              'dto/AuthRequest.java.ejs'],
      ['dto/AuthResponse.java',             'dto/AuthResponse.java.ejs'],
      ['dto/RegisterRequest.java',          'dto/RegisterRequest.java.ejs'],
      ['dto/ProfileUpdateRequest.java',     'dto/ProfileUpdateRequest.java.ejs'],
      ['dto/UserDto.java',                  'dto/UserDto.java.ejs'],
    ];

    // ── JWT-only files ───
    if (options.authStrategy === 'jwt') {
      files.push(
        ['service/JwtService.java',               'service/JwtService.java.ejs'],
        ['security/JwtAuthFilter.java',            'security/JwtAuthFilter.java.ejs'],
        ['security/UserDetailsServiceImpl.java',   'security/UserDetailsServiceImpl.java.ejs'],
        ['config/SecurityConfig.java',             'config/SecurityConfig.java.ejs'],
      );
    } else {
      // Session auth
      files.push(
        ['security/UserDetailsServiceImpl.java',   'security/UserDetailsServiceImpl.java.ejs'],
        ['config/SecurityConfig.java',             'config/SecurityConfigSession.java.ejs'],
      );
    }

    // ── Swagger ───
    if (options.modules.includes('Swagger')) {
      files.push(['config/SwaggerConfig.java', 'config/SwaggerConfig.java.ejs']);
    }

    for (const [outName, tplName] of files) {
      const tplPath = path.join(tDir, tplName);
      if (await fs.pathExists(tplPath)) {
        await writeGeneratedFile(path.join(javaBase, outName), tplPath, ctx);
      } else {
        logger.warn(`Template not found, skipping: ${tplName}`);
      }
    }
  }

  private async generateResources(
    resourcesBase: string,
    context: object,
    options: ProjectOptions,
  ): Promise<void> {
    const { writeGeneratedFile } = await import('../utils/fileWriter');
    const tDir = path.join(this.templatesDir, 'resources');
    const ctx  = context as Record<string, unknown>;

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

  private async generateFrontend(
    outputDir: string,
    context: object,
    options: ProjectOptions,
    isThymeleaf: boolean,
  ): Promise<void> {
    const { writeGeneratedFile } = await import('../utils/fileWriter');
    const ctx = context as Record<string, unknown>;

    if (isThymeleaf) {
      // ── Session + Thymeleaf ─────────────────────────────────
      const tDir      = path.join(this.templatesDir, 'thymeleaf');
      const targetDir = path.join(outputDir, 'src/main/resources/templates');
      await fs.ensureDir(targetDir);
      await fs.ensureDir(path.join(targetDir, 'admin'));

      const pages: Array<[string, string]> = [
        ['login.html',       'login.html.ejs'],
        ['register.html',    'register.html.ejs'],
        ['dashboard.html',   'dashboard.html.ejs'],
        ['profile.html',     'profile.html.ejs'],
        ['admin/users.html', 'admin/users.html.ejs'],
      ];
      for (const [out, tpl] of pages) {
        await writeGeneratedFile(path.join(targetDir, out), path.join(tDir, tpl), ctx);
      }

      // CSS → static/css/
      const cssDir = path.join(outputDir, 'src/main/resources/static/css');
      await fs.ensureDir(cssDir);
      await fs.copyFile(
        path.join(this.templatesDir, 'static/css/style.css'),
        path.join(cssDir, 'style.css'),
      );
    } else {
      // ── JWT + Static multi-page ─────────────────────────────
      const tDir      = path.join(this.templatesDir, 'static');
      const targetDir = path.join(outputDir, 'src/main/resources/static');

      await fs.ensureDir(path.join(targetDir, 'css'));
      await fs.ensureDir(path.join(targetDir, 'js'));

      // HTML pages (EJS-rendered with project context)
      const pages: Array<[string, string]> = [
        ['index.html',     'index.html.ejs'],
        ['login.html',     'login.html.ejs'],
        ['register.html',  'register.html.ejs'],
        ['dashboard.html', 'dashboard.html.ejs'],
        ['profile.html',   'profile.html.ejs'],
        ['admin.html',     'admin.html.ejs'],
      ];
      for (const [out, tpl] of pages) {
        const tplPath = path.join(tDir, tpl);
        if (await fs.pathExists(tplPath)) {
          await writeGeneratedFile(path.join(targetDir, out), tplPath, ctx);
        }
      }

      // JS — nav.js rendered (has projectName), auth.js and ui.js are plain copies
      await writeGeneratedFile(
        path.join(targetDir, 'js/nav.js'),
        path.join(tDir, 'js/nav.js.ejs'),
        ctx,
      );
      await fs.copyFile(
        path.join(tDir, 'js/auth.js'),
        path.join(targetDir, 'js/auth.js'),
      );
      await fs.copyFile(
        path.join(tDir, 'js/ui.js'),
        path.join(targetDir, 'js/ui.js'),
      );

      // CSS — plain copy
      await fs.copyFile(
        path.join(tDir, 'css/style.css'),
        path.join(targetDir, 'css/style.css'),
      );
    }
  }

  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private getDbDependencies(db: string) {
    switch (db) {
      case 'mysql':      return { dependency: 'mysql',      driverClass: 'com.mysql.cj.jdbc.Driver' };
      case 'postgresql': return { dependency: 'postgresql', driverClass: 'org.postgresql.Driver' };
      default:           return { dependency: 'h2',         driverClass: 'org.h2.Driver' };
    }
  }

  private getDbConfig(db: string, artifactId: string) {
    switch (db) {
      case 'mysql':
        return {
          url:      `jdbc:mysql://localhost:3306/${artifactId}?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true`,
          username: 'root',
          password: 'YOUR_PASSWORD',
          dialect:  'org.hibernate.dialect.MySQLDialect',
        };
      case 'postgresql':
        return {
          url:      `jdbc:postgresql://localhost:5432/${artifactId}`,
          username: 'postgres',
          password: 'YOUR_PASSWORD',
          dialect:  'org.hibernate.dialect.PostgreSQLDialect',
        };
      default: // h2
        return {
          url:      `jdbc:h2:mem:${artifactId}`,
          username: 'sa',
          password: '',
          dialect:  'org.hibernate.dialect.H2Dialect',
        };
    }
  }

  private printSuccessMessage(options: ProjectOptions): void {
    const isJwt      = options.authStrategy === 'jwt';
    const isFullstack = options.projectType === 'fullstack';
    const runCmd     = options.buildTool === 'maven' ? './mvnw spring-boot:run' : './gradlew bootRun';

    console.log();
    logger.success(`Project "${options.projectName}" is ready!\n`);
    console.log(`  Next steps:\n`);
    console.log(`    cd ${options.projectName}`);
    console.log(`    ${runCmd}`);
    console.log();
    console.log(`  Endpoints:`);
    console.log(`    Home          http://localhost:8080/`);
    if (isFullstack) {
      console.log(`    Dashboard     http://localhost:8080/${isJwt ? '' : 'dashboard'}`);
    }
    if (options.modules.includes('Swagger')) {
      console.log(`    API Docs      http://localhost:8080/swagger-ui/index.html`);
    }
    console.log(`    Health        http://localhost:8080/actuator/health`);
    console.log();
    console.log(`  Auth strategy:  ${isJwt ? 'JWT (stateless)' : 'Session (form-login)'}`);
    console.log(`  Project type:   ${isFullstack ? 'Fullstack' : 'REST API only'}`);
    console.log();
  }
}
