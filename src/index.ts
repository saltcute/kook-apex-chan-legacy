import { apexConnect } from 'commands/apex/apex.connect.app';
import { apexSearch } from 'commands/apex/apex.search.app';
import { bot } from 'init/client';
import { TextMessage } from 'kbotify';
import { apexMenu } from './commands/apex/apex.menu';

bot.addCommands(apexMenu);

bot.connect();

function getMatches(string: string, regex: RegExp): string[] {
    let matches = regex.exec(string);
    let res = [];
    if (matches) {
        for (let i = 1; i < matches.length; ++i) {
            res.push(matches[i]);
        }
    }
    return res;
}
bot.on('kmarkdownMessage', (event) => {
    const text = new TextMessage(event, bot);
    switch (true) {
        case /^绑定(origin|pc|xbl|xbox|psn|ps)? ?(.+)$/.test(event.content): {
            const [platform, username] = getMatches(event.content, /^绑定(origin|pc|xbl|xbox|psn|ps)? ?(.+)$/);
            apexConnect.exec('connect', [username, platform], text);
            break;
        };
        case /^查[询找](origin|pc|xbl|xbox|psn|ps)? ?(.+)?$/.test(event.content): {
            const [platform, username] = getMatches(event.content, /^查[询找](origin|pc|xbl|xbox|psn|ps)? ?(.+)?$/);
            apexSearch.exec('search', [username, platform], text);
            break;
        }
    }
})

bot.logger.debug('system init success');
