import axios from 'axios';
import { apexConnect } from 'commands/apex/apex.connect.app';
import { apexSearch } from 'commands/apex/apex.search.app';
import auth from 'configs/auth';
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

if (auth.useBotMarket) botMarketStayOnline();
function botMarketStayOnline() {
    axios({
        url: 'http://bot.gekj.net/api/v1/online.bot',
        method: "POST",
        headers: {
            uuid: auth.botMarketUUID
        }
    }).then((res) => {
        if (res.data.code == 0) {
            bot.logger.debug(`BotMarket: Successfully updated online status with remote returning: `);
            bot.logger.debug(res.data);
            setTimeout(botMarketStayOnline, (res.data.data.onTime + 5) * 1000);
        } else if (res.data.code == -1) {
            bot.logger.warn(`BotMarket: Failed updating online status with remote returning: `);
            bot.logger.warn(res.data);
            bot.logger.warn(`BotMarket: Retries in 30 minutes`);
            setTimeout(botMarketStayOnline, 30 * 60 * 1000);
        }
    }).catch((e) => {
        bot.logger.warn(`BotMarket: Failed updating online status with remote returning: `);
        bot.logger.warn(e.message);
        bot.logger.warn(`BotMarket: Retries in 30 minutes`);
        setTimeout(botMarketStayOnline, 30 * 60 * 1000);
    })
}
