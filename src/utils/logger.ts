import chalk from 'chalk';

const LOGO = `
  ███████╗██████╗ ██████╗ ██╗   ██╗ ██████╗ ███████╗███╗  ██╗
  ██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝██╔════╝ ██╔════╝████╗ ██║
  ███████╗██████╔╝██████╔╝ ╚████╔╝ ██║  ███╗█████╗  ██╔██╗██║
  ╚════██║██╔═══╝ ██╔══██╗  ╚██╔╝  ██║   ██║██╔══╝  ██║╚████║
  ███████║██║     ██║  ██║   ██║   ╚██████╔╝███████╗██║ ╚███║
  ╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝╚═╝  ╚══╝`;

function gradient(text: string): string {
  const colors = ['#7c3aed', '#6d28d9', '#4f46e5', '#4338ca', '#3730a3'];
  return text
    .split('\n')
    .map((line, i) => chalk.hex(colors[i % colors.length])(line))
    .join('\n');
}

export function printBanner(version = '1.0.0'): void {
  console.log(gradient(LOGO));
  console.log(
    '  ' +
      chalk.bold.hex('#7c3aed')('Spring Boot') +
      chalk.dim(' · ') +
      chalk.bold.white('Project Generator') +
      chalk.dim('  v' + version),
  );
  console.log(
    '  ' + chalk.dim('─'.repeat(60)),
  );
  console.log();
}

export function printSection(label: string): void {
  console.log();
  console.log(
    chalk.hex('#7c3aed')('◆') + ' ' + chalk.bold.white(label),
  );
}

const prefix = chalk.hex('#7c3aed').bold('▸');

export const logger = {
  info: (msg: string) =>
    console.log(`  ${prefix} ${chalk.white(msg)}`),

  success: (msg: string) =>
    console.log(`  ${chalk.green('✔')} ${chalk.greenBright(msg)}`),

  warn: (msg: string) =>
    console.log(`  ${chalk.yellow('⚠')} ${chalk.yellow(msg)}`),

  error: (msg: string) =>
    console.error(`  ${chalk.red('✖')} ${chalk.redBright(msg)}`),

  /** Legacy box-style title — kept for non-banner uses */
  title: (msg: string) => {
    const line = '─'.repeat(msg.length + 4);
    console.log('');
    console.log(chalk.hex('#7c3aed')(`  ╭${line}╮`));
    console.log(chalk.hex('#7c3aed')(`  │  ${chalk.bold.white(msg)}  │`));
    console.log(chalk.hex('#7c3aed')(`  ╰${line}╯`));
    console.log('');
  },

  file: (filePath: string) =>
    console.log(`    ${chalk.dim('→')} ${chalk.dim(filePath)}`),

  step: (num: number, total: number, msg: string) =>
    console.log(
      '  ' +
        chalk.hex('#7c3aed')(`[${num}/${total}]`) +
        ' ' +
        chalk.white(msg),
    ),

  done: () => {
    console.log();
    console.log(
      '  ' + chalk.hex('#7c3aed')('─'.repeat(60)),
    );
    console.log(
      '  ' +
        chalk.green('✔') +
        ' ' +
        chalk.bold.white('Project scaffolded successfully!'),
    );
    console.log();
  },
};
