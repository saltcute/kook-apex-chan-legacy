import { AppCommand, AppFunc, BaseSession, Card } from 'kbotify';
import auth from 'configs/auth';
import apex, { Apex, humanToTrackerGG } from './lib/apex';
import { generateImage } from 'commands/apex/lib/drawer';
import { bot } from 'init/client';
import sharp from 'sharp';

class ApexSearch extends AppCommand {
    code = 'search'; // 只是用作标记
    trigger = 'search'; // 用于触发的文字
    help = '';
    intro = '';
    apexClient: Apex;
    constructor() {
        super();
        this.apexClient = apex(auth.trackerggKey, auth.alsKey)
    }
    func: AppFunc<BaseSession> = async (session) => {
        let ts = Date.now();
        console.log(`Start: ${ts}`);
        let username = session.args[0];
        let plat = session.args[1];
        let platform: 'PC' | 'PS4' | 'X1' = 'PC';
        if (!username) {
            let connection = this.apexClient.getConnection(platform, session.userId);
            if (connection) {
                username = connection.username;
            } else return session.reply('您还未绑定！请先绑定或输入用户名');
        }
        if (humanToTrackerGG[plat]) {
            platform = humanToTrackerGG[plat];
        }
        let messageId = (await session.sendCard(new Card().addText('正在加载……请稍候'))).msgSent?.msgId || '';
        return this.apexClient.getPlayerDetail(platform, username)
            .then(async (user) => {
                bot.logger.debug('Generation: Recieved data from remote API');
                let br_predator = await this.apexClient.getPredatorRequirement('RP', platform);
                let ar_predator = await this.apexClient.getPredatorRequirement('AP', platform);
                let formater = Intl.NumberFormat('en-US', {
                    notation: 'compact',
                    maximumFractionDigits: 2
                });

                let stat = user.global;
                let legend = user.legends.selected;
                let detail_header_1, detail_number_1, detail_header_2, detail_number_2, detail_header_3, detail_number_3;
                // detail_header_1 = detail_number_1 = detail_header_2 = detail_number_2 = detail_header_3 = detail_number_3 = '';

                detail_header_1 = legend.data[0]?.name || "";
                detail_number_1 = legend.data[0] ? formater.format(legend.data[0].value) : "";
                detail_header_2 = legend.data[1]?.name || "";
                detail_number_2 = legend.data[1] ? formater.format(legend.data[1].value) : "";
                detail_header_3 = legend.data[2]?.name || "";
                detail_number_3 = legend.data[2] ? formater.format(legend.data[2].value) : "";
                let stat_header_1, stat_number_1, stat_header_2, stat_number_2, stat_header_3, stat_number_3, stat_header_4, stat_number_4;
                //stat_header_1 = stat_number_1 = stat_header_2 = stat_number_2 = stat_header_3 = stat_number_3 = stat_header_4 = stat_number_4 = '';

                stat_header_1 = "Level";
                stat_number_1 = formater.format(stat.level);
                stat_header_2 = "BP Level"
                stat_number_2 = formater.format(stat.battlepass.level);
                stat_header_3 = "Active Bans";
                stat_number_3 = stat.bans.isActive ? `${formater.format(stat.bans.remainingSeconds)}s` : "None";
                stat_header_4 = "Platform";
                stat_number_4 = stat.platform;
                bot.logger.debug('Generation: Start generation');
                let buffer = await generateImage({
                    username: user.global.name,
                    user_avatar_url: user.global.avatar || "https://img.kookapp.cn/assets/2022-07/vlOSxPNReJ0dw0dw.jpg",

                    stat_header_1,
                    stat_number_1,
                    stat_header_2,
                    stat_number_2,
                    stat_header_3,
                    stat_number_3,
                    stat_header_4,
                    stat_number_4,

                    br_current_rank_number: stat.rank.rankScore,
                    br_point_until_next_rank: br_predator.val - stat.rank.rankScore,
                    br_next_rank_number: br_predator.val,
                    br_current_rank_image: stat.rank.rankImg || Apex.defaultRankImage,
                    br_next_rank_image: Apex.predatorRankImage,

                    ar_current_rank_number: stat.arena.rankScore,
                    ar_point_until_next_rank: ar_predator.val - stat.arena.rankScore,
                    ar_next_rank_number: ar_predator.val,
                    ar_current_rank_image: stat.arena.rankImg || Apex.defaultRankImage,
                    ar_next_rank_image: Apex.predatorRankImage,

                    detail_legend_name: legend.LegendName,
                    detail_legend_image: `https://trackercdn.com/cdn/apex.tracker.gg/legends/${legend.LegendName.toLowerCase()}-tall.png`, // need fix
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
                session.updateMessage(messageId, new Card().addText(`查询成功，本次用时：(font)${(Date.now() - ts) / 1000}s(font)[${Date.now() - ts > 6657 ? Date.now() - ts > 8964 ? 'danger' : 'warning' : 'success'}]`).addModule(<any>{
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
                session.updateMessage(messageId, new Card().addText(`获取名为 ${username} 的 ${platform} 用户的资料失败\n此用户可能不存在，请检查输入`).toString());
            });
    }
}

export const apexSearch = new ApexSearch();