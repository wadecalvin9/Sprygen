import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { execSync } from 'child_process';
import ejs from 'ejs';
import { ProjectOptions } from '../types';
import { logger } from '../utils/logger';

export class NextJsGenerator {
  private templatesDir: string;

  constructor() {
    const candidates = [
      path.resolve(__dirname, '../../templates/nextjs'),
      path.resolve(__dirname, '../templates/nextjs'),
    ];
    const found = candidates.find(p => fs.existsSync(p));
    if (!found) {
      throw new Error(
        `Could not locate nextjs templates directory. Tried:\n${candidates.join('\n')}`
      );
    }
    this.templatesDir = found;
  }

  async generate(options: ProjectOptions, backendDir: string): Promise<void> {
    const projectRoot = path.resolve(process.cwd(), options.projectName);
    const frontendDir = path.join(projectRoot, 'frontend');

    let spinner = ora({ text: 'Preparing Next.js scaffold…', color: 'cyan' }).start();

    try {
      // ── Step 1: Run create-next-app ────────────────────────────────────────
      // Stop spinner first — create-next-app prints its own output.
      spinner.stop();
      console.log();
      logger.info('Running create-next-app — this may take 1-2 minutes...');
      console.log();

      // Build command as a string — execSync goes through the shell on all
      // platforms (required on Windows for npx to resolve correctly).
      // Wrap frontendDir in quotes to handle paths with spaces.
      const escapedDir = frontendDir.replace(/"/g, '\\"');
      const createCmd = [
        'npx -y create-next-app@latest',
        `"${escapedDir}"`,
        '--typescript',
        '--tailwind',
        '--eslint',
        '--app',
        '--src-dir',
        '--import-alias "@/*"',
        '--no-git',
        '--use-npm',
      ].join(' ');

      try {
        execSync(createCmd, {
          stdio: 'inherit',           // live output — user sees download progress
          env: { ...process.env },    // no CI=true, no npm_config_yes (can break CNA)
        });
      } catch {
        throw new Error(
          `create-next-app failed. See output above for details.\n` +
          `You can retry manually:\n  ${createCmd}`
        );
      }

      // Re-launch spinner for the Sprygen injection steps
      spinner = ora({ text: 'Injecting API client, auth hooks, and pages...', color: 'cyan' }).start();

      // ── Step 2: Build template context ────────────────────────────────────
      const ctx = {
        projectName:    options.projectName,
        backendUrl:     options.backendUrl,
        isJwtAuth:      options.authStrategy === 'jwt',
        hasSwagger:     options.modules.includes('Swagger'),
        year:           new Date().getFullYear(),
      };

      // ── Step 3: Inject Sprygen files ──────────────────────────────────────
      spinner.text = 'Injecting API client, auth hooks, and pages…';

      const srcDir = path.join(frontendDir, 'src');

      // Folders to ensure
      await fs.ensureDir(path.join(srcDir, 'lib'));
      await fs.ensureDir(path.join(srcDir, 'hooks'));
      await fs.ensureDir(path.join(srcDir, 'components'));
      await fs.ensureDir(path.join(srcDir, 'app', 'login'));
      await fs.ensureDir(path.join(srcDir, 'app', 'register'));
      await fs.ensureDir(path.join(srcDir, 'app', 'dashboard'));

      // Files to render from EJS templates
      const renderPairs: Array<[string, string]> = [
        // [output path relative to frontendDir, template path relative to this.templatesDir]
        ['src/lib/api.ts',                       'lib/api.ts.ejs'],
        ['src/lib/types.ts',                     'lib/types.ts.ejs'],
        ['src/hooks/useAuth.ts',                 'hooks/useAuth.ts.ejs'],
        ['src/hooks/useFetch.ts',                'hooks/useFetch.ts.ejs'],
        ['tailwind.config.ts',                   'tailwind.config.ts.ejs'],
        ['src/components/Sidebar.tsx',           'components/Sidebar.tsx.ejs'],
        ['src/components/ThemeProvider.tsx',     'components/ThemeProvider.tsx.ejs'],
        ['src/components/ProtectedRoute.tsx',    'components/ProtectedRoute.tsx.ejs'],
        ['src/app/layout.tsx',                   'app/layout.tsx.ejs'],
        ['src/app/globals.css',                  'app/globals.css.ejs'],
        ['src/app/page.tsx',                     'app/page.tsx.ejs'],
        ['src/app/dashboard/layout.tsx',         'app/dashboard/layout.tsx.ejs'],
        ['src/app/dashboard/page.tsx',           'app/dashboard/page.tsx.ejs'],
        ['src/app/dashboard/users/page.tsx',     'app/dashboard/users/page.tsx.ejs'],
      ];

      // Auth pages only for JWT
      if (options.authStrategy === 'jwt') {
        renderPairs.push(
          ['src/app/login/page.tsx',    'app/login/page.tsx.ejs'],
          ['src/app/register/page.tsx', 'app/register/page.tsx.ejs'],
        );
      }

      for (const [outRel, tplRel] of renderPairs) {
        const tplPath = path.join(this.templatesDir, tplRel);
        const outPath = path.join(frontendDir, outRel);
        if (await fs.pathExists(tplPath)) {
          const rendered = await ejs.renderFile(tplPath, ctx, { async: true });
          await fs.ensureDir(path.dirname(outPath));
          await fs.writeFile(outPath, rendered, 'utf8');
        } else {
          logger.warn(`Next.js template not found, skipping: ${tplRel}`);
        }
      }

      // -- Step 4: Install extra dependencies ────────────────────────────────
      spinner.text = 'Installing axios, lucide-react, next-themes...';
      try {
        execSync('npm install axios lucide-react next-themes', {
          cwd: frontendDir,
          stdio: 'pipe',
        });
      } catch {
        logger.warn('Could not auto-install dependencies. Run: cd frontend && npm install axios lucide-react next-themes');
      }

      // ── Step 5: Write .env files ──────────────────────────────────────────
      spinner.text = 'Writing environment files…';
      await this.writeEnvFiles(frontendDir, ctx);

      // ── Step 6: Patch next.config for API proxy ───────────────────────────
      spinner.text = 'Configuring Next.js API proxy…';
      await this.patchNextConfig(frontendDir, options.backendUrl);

      // ── Step 7: Root DX files ─────────────────────────────────────────────
      spinner.text = 'Writing Makefile and docker-compose…';
      await this.writeRootFiles(projectRoot, options, backendDir, ctx);

      spinner.succeed('Next.js frontend scaffolded and wired!');
    } catch (err) {
      spinner.fail('Next.js frontend generation failed.');
      throw err;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async writeEnvFiles(
    frontendDir: string,
    ctx: { backendUrl: string }
  ): Promise<void> {
    const envLocal   = `NEXT_PUBLIC_API_URL=${ctx.backendUrl}\n`;
    const envExample = `NEXT_PUBLIC_API_URL=http://localhost:8080\n`;

    await fs.writeFile(path.join(frontendDir, '.env.local'),   envLocal,   'utf8');
    await fs.writeFile(path.join(frontendDir, '.env.example'), envExample, 'utf8');

    // Append .env.local to .gitignore so secrets don't leak
    const gitignorePath = path.join(frontendDir, '.gitignore');
    if (await fs.pathExists(gitignorePath)) {
      let gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
      if (!gitignoreContent.includes('.env.local')) {
        gitignoreContent += '\n# Sprygen — local env\n.env.local\n';
        await fs.writeFile(gitignorePath, gitignoreContent, 'utf8');
      }
    }
  }

  private async patchNextConfig(frontendDir: string, backendUrl: string): Promise<void> {
    // Try next.config.ts first (newer versions), then next.config.js
    const tsConfig = path.join(frontendDir, 'next.config.ts');
    const jsConfig = path.join(frontendDir, 'next.config.js');
    const configPath = (await fs.pathExists(tsConfig)) ? tsConfig : jsConfig;

    if (!(await fs.pathExists(configPath))) {
      // Create a minimal config with rewrites
      const minimal = `/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: \`${backendUrl}/:path*\`,
      },
    ];
  },
};

module.exports = nextConfig;
`;
      await fs.writeFile(jsConfig, minimal, 'utf8');
      return;
    }

    let content = await fs.readFile(configPath, 'utf8');

    // If already has rewrites, skip
    if (content.includes('rewrites')) return;

    const rewriteBlock = `
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: \`${backendUrl}/:path*\`,
      },
    ];
  },`;

    // Insert before the closing of the config object
    content = content.replace(
      /const nextConfig[^=]*=\s*\{/,
      `const nextConfig = {\n${rewriteBlock}`
    );

    await fs.writeFile(configPath, content, 'utf8');
  }

  private async writeRootFiles(
    projectRoot: string,
    options: ProjectOptions,
    backendDir: string,
    ctx: Record<string, unknown>
  ): Promise<void> {
    const runCmd = options.buildTool === 'maven' ? './mvnw spring-boot:run' : './gradlew bootRun';

    // ── Makefile ─────────────────────────────────────────────────────────────
    const makefile = `# ${options.projectName} — sprygen fullstack
.PHONY: dev backend frontend

dev:
\t@echo "Starting backend and frontend..."
\t@make backend &
\t@make frontend

backend:
\tcd backend && ${runCmd}

frontend:
\tcd frontend && npm run dev
`;
    await fs.writeFile(path.join(projectRoot, 'Makefile'), makefile, 'utf8');

    // ── README ────────────────────────────────────────────────────────────────
    const dbSection = options.database !== 'h2'
      ? `\n### Database\nMake sure **${options.database}** is running before starting the backend.\nUpdate credentials in \`backend/src/main/resources/application.yml\`.\n`
      : '\n### Database\nUsing **H2 in-memory** — no setup needed.\n';

    const swaggerSection = options.modules.includes('Swagger')
      ? '\n| API Docs (Swagger) | http://localhost:8080/swagger-ui/index.html |\n'
      : '';

    const readme = `# ${options.projectName}

> Generated by [Sprygen](https://github.com/wadecalvin9/Sprygen) — Spring Boot + Next.js fullstack starter

## Quick Start

\`\`\`bash
# Start both at once (requires make)
make dev

# Or manually:
cd backend && ${runCmd}
cd frontend && npm run dev
\`\`\`

## URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |${swaggerSection}
| Health Check | http://localhost:8080/actuator/health |
${dbSection}
## Structure

\`\`\`
${options.projectName}/
├── backend/          Spring Boot (${options.authStrategy === 'jwt' ? 'JWT auth' : 'Session auth'}, ${options.database})
├── frontend/         Next.js 14 (App Router, Tailwind CSS)
├── Makefile          \`make dev\` starts both services
└── README.md
\`\`\`

## Auth Strategy: ${options.authStrategy === 'jwt' ? 'JWT (Stateless)' : 'Session (Form-Login)'}

${options.authStrategy === 'jwt' ? `- Tokens stored in \`localStorage\` (configurable to httpOnly cookies)
- \`useAuth\` hook in \`frontend/src/hooks/useAuth.ts\` handles login/logout/state
- All API calls go through \`frontend/src/lib/api.ts\` (Axios + auto-attach token)
- Protected routes use \`<ProtectedRoute>\` — redirects to \`/login\` if unauthenticated` : `- Spring Security form-login handles sessions server-side
- Thymeleaf templates served by the backend`}
`;
    await fs.writeFile(path.join(projectRoot, 'README.md'), readme, 'utf8');

    // ── docker-compose.yml ────────────────────────────────────────────────────
    const dbService = this.buildDockerDbService(options.database, options.projectName);
    const dockerCompose = `version: "3.9"
# ${options.projectName} — generated by Sprygen
# Run: docker-compose up
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: docker
    depends_on:
      - db

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8080
    depends_on:
      - backend
${dbService}
`;
    await fs.writeFile(path.join(projectRoot, 'docker-compose.yml'), dockerCompose, 'utf8');
  }

  private buildDockerDbService(database: string, projectName: string): string {
    const name = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    switch (database) {
      case 'mysql':
        return `
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: ${name}
    ports:
      - "3306:3306"
`;
      case 'postgresql':
        return `
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ${name}
    ports:
      - "5432:5432"
`;
      default: // h2 — no external db needed
        return '';
    }
  }
}
