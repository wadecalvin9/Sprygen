import chalk from 'chalk';

const prefix = chalk.bold.cyan('[Sprygen]');

export const logger = {
  info: (msg: string) => console.log(`${prefix} ${chalk.white(msg)}`),
  success: (msg: string) => console.log(`${prefix} ${chalk.green('✔')} ${chalk.greenBright(msg)}`),
  warn: (msg: string) => console.log(`${prefix} ${chalk.yellow('⚠')} ${chalk.yellow(msg)}`),
  error: (msg: string) => console.error(`${prefix} ${chalk.red('✖')} ${chalk.red(msg)}`),
  title: (msg: string) => {
    const line = '─'.repeat(msg.length + 4);
    console.log('');
    console.log(chalk.cyan(`  ╭${line}╮`));
    console.log(chalk.cyan(`  │  ${chalk.bold.white(msg)}  │`));
    console.log(chalk.cyan(`  ╰${line}╯`));
    console.log('');
  },
  file: (filePath: string) => console.log(`  ${chalk.gray('→')} ${chalk.dim(filePath)}`),
  step: (num: number, total: number, msg: string) =>
    console.log(chalk.cyan(`[${num}/${total}]`) + ' ' + chalk.white(msg)),
};
