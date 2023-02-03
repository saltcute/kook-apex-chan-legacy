import { AppCommand, AppFunc, BaseSession, Card } from 'kbotify';
import auth from 'configs/auth';
import apex, { Apex, humanToTrackerGG } from './lib/apex';
import { apexSearch } from './apex.search.app';

class ApexConnect extends AppCommand {
    code = 'connect'; // 只是用作标记
    trigger = 'connect'; // 用于触发的文字
    help = '';
    intro = '';
    apexClient: Apex;
    constructor() {
        super();
        this.apexClient = apex(auth.trackerggKey, auth.alsKey)
    }
    func: AppFunc<BaseSession> = async (session) => {
        let username = session.args[0];
        let plat = session.args[1];
        let platform: "xbl" | "psn" | "origin" = 'origin';
        if (!username) {
            return session.reply('请输入用户名');
        }
        let messageId = (await session.sendCard(new Card().addText('正在加载……请稍候'))).msgSent?.msgId || '';
        if (humanToTrackerGG[plat]) {
            platform = humanToTrackerGG[plat];
        }
        return this.apexClient.getPlayerDetail(platform, username)
            .then(async (user) => {
                this.apexClient.connectPlatform(platform, username, session.userId);
                this.apexClient.writeConnectionMap();
                session.updateMessage(messageId, new Card().addText(`绑定成功！`).toString());
                apexSearch.exec('search', [username, platform], session.msg);
            }).catch((e) => {
                console.log(e);
                session.updateMessage(messageId, new Card().addText(`获取名为 ${username} 的 ${platform} 用户的资料失败\n此用户可能不存在，请检查输入`).toString());
            });
    }
}

export const apexConnect = new ApexConnect();