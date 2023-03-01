import { apexConnect } from 'commands/apex/apex.connect.app';
import { apexSearch } from 'commands/apex/apex.search.app';
import { bot } from 'init/client';
import { apexMenu } from './commands/apex/apex.menu';

bot.plugin.load(apexMenu);

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
bot.message.on('allTextMessages', (event) => {
    switch (true) {
        case /^绑定(origin|pc|xbl|xbox|psn|ps)? ?(.+)$/.test(event.content): {
            const [platform, username] = getMatches(event.content, /^绑定(origin|pc|xbl|xbox|psn|ps)? ?(.+)$/);
            apexConnect.exec([username, platform], event, bot);
            break;
        };
        case /^查[询找](origin|pc|xbl|xbox|psn|ps)? ?(.+)?$/.test(event.content): {
            const [platform, username] = getMatches(event.content, /^查[询找](origin|pc|xbl|xbox|psn|ps)? ?(.+)?$/);
            apexSearch.exec([username, platform], event, bot);
            break;
        }
    }
})

bot.logger.debug('system init success');
