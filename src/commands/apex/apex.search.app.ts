import { AppCommand, AppFunc, BaseSession, Card } from 'kbotify';
import auth from 'configs/auth';
import Apex from './lib/apex';
import { generateImage } from 'commands/apex/lib/drawer';
import { bot } from 'init/client';
import sharp from 'sharp';


let map: {
    [key: string]: "xbl" | "psn" | "origin"
} = {
    origin: 'origin',
    psn: 'psn',
    ps: 'psn',
    xbox: 'xbl',
    xbl: 'xbl',
    playstation: 'psn',
    pc: 'origin'
}

class ApexSearch extends AppCommand {
    code = 'search'; // 只是用作标记
    trigger = 'search'; // 用于触发的文字
    help = '';
    intro = '';
    apexClient: Apex;
    constructor() {
        super();
        this.apexClient = new Apex(auth.trackerggKey, auth.alsKey)
    }
    func: AppFunc<BaseSession> = async (session) => {
        let ts = Date.now();
        console.log(`Start: ${ts}`);
        let username = session.args[0];
        let plat = session.args[1];
        let platform: "xbl" | "psn" | "origin" = 'origin';
        if (!username) {
            return session.reply('请输入用户名');
        }
        let messageId = (await session.sendCard(new Card().addText('正在加载……请稍候'))).msgSent?.msgId || '';
        if (map[plat]) {
            platform = map[plat];
        }
        return this.apexClient.getPlayerDetail(platform, username)
            .then(async (user) => {
                bot.logger.debug('Generation: Recieved data from remote API');
                let br_predator = await this.apexClient.getPredatorRequirement('RP', platform);
                let ar_predator = await this.apexClient.getPredatorRequirement('AP', platform);
                let formater = Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    maximumFractionDigits: 3
                });

                let stat = user.segments[0].stats;
                let legend = user.segments[1];
                let detail_header_1, detail_number_1, detail_header_2, detail_number_2, detail_header_3, detail_number_3;
                detail_header_1 = detail_number_1 = detail_header_2 = detail_number_2 = detail_header_3 = detail_number_3 = '';
                for (let key in legend.stats) {
                    let stat = legend.stats[key];
                    if (!detail_header_1 && !detail_number_1) {
                        detail_header_1 = stat.displayName;
                        detail_number_1 = formater.format(stat.value);
                    } else if (!detail_header_2 && !detail_number_2) {
                        detail_header_2 = stat.displayName;
                        detail_number_2 = formater.format(stat.value);
                    } else if (!detail_header_3 && !detail_number_3) {
                        detail_header_3 = stat.displayName;
                        detail_number_3 = formater.format(stat.value);
                    } else break;
                }
                let stat_header_1, stat_number_1, stat_header_2, stat_number_2, stat_header_3, stat_number_3, stat_header_4, stat_number_4;
                stat_header_1 = stat_number_1 = stat_header_2 = stat_number_2 = stat_header_3 = stat_number_3 = stat_header_4 = stat_number_4 = '';
                for (let key in stat) {
                    let sta = stat[key];
                    if (!sta) continue;
                    if (!stat_header_1 && !stat_number_1) {
                        stat_header_1 = sta.displayName;
                        stat_number_1 = formater.format(sta.value);
                    } else if (!stat_header_2 && !stat_number_2) {
                        stat_header_2 = sta.displayName;
                        stat_number_2 = formater.format(sta.value);
                    } else if (!stat_header_3 && !stat_number_3) {
                        stat_header_3 = sta.displayName;
                        stat_number_3 = formater.format(sta.value);
                    } else if (!stat_header_4 && !stat_number_4) {
                        stat_header_4 = sta.displayName;
                        stat_number_4 = formater.format(sta.value);
                    } else break;
                }
                bot.logger.debug('Generation: Start generation');
                let buffer = await generateImage({
                    username: user.platformInfo.platformUserId,
                    user_avatar_url: user.platformInfo.avatarUrl,

                    stat_header_1,
                    stat_number_1,
                    stat_header_2,
                    stat_number_2,
                    stat_header_3,
                    stat_number_3,
                    stat_header_4,
                    stat_number_4,

                    br_current_rank_number: stat.rankScore.value,
                    br_point_until_next_rank: br_predator.val - stat.rankScore.value,
                    br_next_rank_number: br_predator.val,
                    br_current_rank_image: stat.rankScore.metadata.iconUrl || Apex.defaultRankImage,
                    br_next_rank_image: Apex.predatorRankImage,

                    ar_current_rank_number: stat.arenaRankScore.value,
                    ar_point_until_next_rank: ar_predator.val - stat.arenaRankScore.value,
                    ar_next_rank_number: ar_predator.val,
                    ar_current_rank_image: stat.arenaRankScore.metadata.iconUrl || Apex.defaultRankImage,
                    ar_next_rank_image: Apex.predatorRankImage,

                    detail_legend_name: legend.metadata.name,
                    detail_legend_image: legend.metadata.tallImageUrl,
                    detail_header_1,
                    detail_number_1,
                    detail_header_2,
                    detail_number_2,
                    detail_header_3,
                    detail_number_3
                });
                bot.logger.debug('Generation: Start uploading');
                buffer = await sharp(buffer).jpeg().toBuffer();
                let url = (await bot.API.asset.create(buffer, { filename: 'image.jpg' })).url;
                bot.logger.debug('Generation: Present image to user');
                session.updateMessage(messageId, new Card().addText(`查询成功，本次用时：(font)${(Date.now() - ts) / 1000}s(font)[${Date.now() - ts > 6657 ? 'warning' : 'success'}]`).addModule(<any>{
                    type: "container",
                    elements: [{
                        "type": "image",
                        "src": url
                    }]
                }).toString());
                console.log(`End: ${Date.now()}`);
                console.log(`Generation time: ${Date.now() - ts}ms`);
            }).catch((e) => {
                console.log(e);
                session.reply(`无法找到名为 ${username} 的 ${platform} 用户`);
            });
    }
}

export const apexSearch = new ApexSearch();