import chalk from 'chalk';

// ── Color palette ─────────────────────────────────────────────
const G = {
  bright : '#3fb950',
  base   : '#2da44e',
  dim    : '#26913d',
  soft   : '#156e2e',
};

// ── Big block-letter ASCII art (6 lines) ──────────────────────
//   Generated with FIGlet "Doom" style, rendered in Unicode box chars
const LOGO = [
  '  ███████╗██████╗ ██████╗ ██╗   ██╗ ██████╗ ███████╗███╗   ██╗',
  '  ██╔════╝██╔══██╗██╔══██╗╚██╗ ██╔╝██╔════╝ ██╔════╝████╗  ██║',
  '  ███████╗██████╔╝██████╔╝ ╚████╔╝ ██║  ███╗█████╗  ██╔██╗ ██║',
  '  ╚════██║██╔═══╝ ██╔══██╗  ╚██╔╝  ██║   ██║██╔══╝  ██║╚██╗██║',
  '  ███████║██║     ██║  ██║   ██║   ╚██████╔╝███████╗██║ ╚████║',
  '  ╚══════╝╚═╝     ╚═╝  ╚═╝   ╚═╝    ╚═════╝ ╚══════╝╚═╝  ╚═══╝',
];

// ── Render the banner ─────────────────────────────────────────
export function printBanner(version = '1.0.0'): void {
  console.log();

  // Big logo — top 2 rows slightly dimmer, main rows bright
  LOGO.forEach((line, i) => {
    if (i < 2) {
      process.stdout.write(chalk.hex(G.soft)(line) + '\n');
    } else {
      process.stdout.write(chalk.hex(G.bright)(line) + '\n');
    }
  });

  // Tagline row
  console.log();
  const tag = '  Spring Boot Project Generator';
  const ver = `v${version}`;
  process.stdout.write(
    chalk.hex(G.base)(tag) +
    chalk.dim('  ·  ') +
    chalk.dim(ver) +
    '\n'
  );

  // Rule
  console.log(chalk.hex(G.soft)('  ' + '─'.repeat(62)));
  console.log();
}

// ── Section header ────────────────────────────────────────────
export function printSection(label: string): void {
  console.log(
    '\n' +
    chalk.hex(G.bright)('  ◆ ') +
    chalk.bold.white(label)
  );
}

// ── Separator ─────────────────────────────────────────────────
export function printSeparator(): void {
  console.log(chalk.hex(G.soft)('  ' + '─'.repeat(62)));
}

// ── Logger methods ────────────────────────────────────────────
export const logger = {
  info: (msg: string) =>
    console.log(`  ${chalk.hex(G.base)('·')} ${chalk.white(msg)}`),

  success: (msg: string) =>
    console.log(`  ${chalk.hex(G.bright)('+')} ${chalk.white(msg)}`),

  warn: (msg: string) =>
    console.log(`  ${chalk.yellow('!')} ${chalk.yellow(msg)}`),

  error: (msg: string) =>
    console.error(`  ${chalk.red('×')} ${chalk.red(msg)}`),

  title: (msg: string) => {
    console.log();
    console.log(chalk.hex(G.bright)('  ◆ ') + chalk.bold.white(msg));
    console.log();
  },

  file: (filePath: string) =>
    console.log(`    ${chalk.hex(G.soft)('write')} ${chalk.dim(filePath)}`),

  step: (num: number, total: number, msg: string) =>
    console.log(
      chalk.hex(G.soft)(`  [${num}/${total}]`) +
      '  ' +
      chalk.white(msg)
    ),

  done: () => {
    console.log();
    printSeparator();
    console.log(`  ${chalk.hex(G.bright)('+')} ${chalk.bold.white('Done.')}`);
    console.log();
  },
};
