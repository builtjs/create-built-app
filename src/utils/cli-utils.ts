import ora from 'ora';
import chalk from 'chalk';
import figures from 'figures';
import { SingleBar, Presets } from 'cli-progress';

export function createSpinner(text: string) {
  return ora({
    text,
    spinner: 'dots',
    color: 'cyan'
  });
}

export function createProgressBar() {
  return new SingleBar({
    format: `${chalk.cyan('{bar}')} ${chalk.cyan('{percentage}%')} | {value}/{total} sections`,
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  }, Presets.shades_classic);
}

export const symbols = {
  success: chalk.green(figures.tick),
  error: chalk.red(figures.cross),
  warning: chalk.yellow(figures.warning),
  info: chalk.blue(figures.info)
};