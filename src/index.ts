import { bot } from 'init/client';
import { apexMenu } from './commands/apex/apex.menu';

bot.addCommands(apexMenu);

bot.connect();

bot.logger.debug('system init success');
