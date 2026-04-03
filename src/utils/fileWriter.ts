import ejs from 'ejs';
import fs from 'fs-extra';
import path from 'path';
import { TemplateContext } from '../types';
import { logger } from './logger';

export async function renderTemplate(templatePath: string, context: TemplateContext): Promise<string> {
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  return ejs.render(templateContent, context, { async: false });
}

export async function writeGeneratedFile(
  outputPath: string,
  templatePath: string,
  context: TemplateContext,
): Promise<void> {
  const rendered = await renderTemplate(templatePath, context);
  await fs.ensureDir(path.dirname(outputPath));
  await fs.writeFile(outputPath, rendered, 'utf-8');
  logger.file(outputPath);
}

export async function copyTemplate(
  templateDir: string,
  outputDir: string,
  context: TemplateContext,
): Promise<void> {
  const entries = await fs.readdir(templateDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(templateDir, entry.name);
    const resolvedName = renderInlineName(entry.name, context);

    // Skip .ejs extension in output name
    const outputName = resolvedName.endsWith('.ejs')
      ? resolvedName.slice(0, -4)
      : resolvedName;

    const destPath = path.join(outputDir, outputName);

    if (entry.isDirectory()) {
      await fs.ensureDir(destPath);
      await copyTemplate(srcPath, destPath, context);
    } else if (entry.name.endsWith('.ejs')) {
      await writeGeneratedFile(destPath, srcPath, context);
    } else {
      await fs.copy(srcPath, destPath);
      logger.file(destPath);
    }
  }
}

function renderInlineName(name: string, context: TemplateContext): string {
  return name.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    String(context[key] ?? `{{${key}}}`),
  );
}
