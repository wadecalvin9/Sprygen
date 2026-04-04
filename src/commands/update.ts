import { exec } from 'child_process';
import { logger, printBanner, printSection } from '../utils/logger';

export function updateCommand(): void {
  printBanner();
  printSection('Updating Sprygen');
  
  logger.info('Fetching latest version from npm...');
  
  exec('npm install -g sprygen@latest', (error, stdout, stderr) => {
    if (error) {
      logger.error('Failed to update Sprygen.');
      console.error(stderr);
      return;
    }
    logger.success('Successfully updated to the latest version!');
    console.log();
  });
}
