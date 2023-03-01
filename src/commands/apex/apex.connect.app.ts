import { BaseCommand, CommandFunction, BaseSession, Card } from 'kasumi.js';
import auth from 'configs/auth';
import apex, { Apex, humanToTrackerGG } from './lib/apex';
import { apexSearch } from './apex.search.app';

class ApexConnect extends BaseCommand {
    name = 'connect';
    description = '绑定账号';

    apexClient: Apex;
    constructor() {
        super();
        this.apexClient = apex(auth.trackerggKey, auth.alsKey)
    }
    func: CommandFunction<BaseSession, any> = async (session) => {
        let username = session.args[0];
        let plat = session.args[1];
        let platform: 'PC' | 'PS4' | 'X1' = 'PC';
        if (!username) {
            return session.reply('请输入用户名');
        }
        let message = (await session.send(new Card().addText('正在加载……请稍候')));
        let messageId = message ? message.msg_id : '';
        if (humanToTrackerGG[plat]) {
            platform = humanToTrackerGG[plat];
        }
        return this.apexClient.getPlayerDetail(platform, username)
            .then(async () => {
                this.apexClient.connectPlatform(platform, username, session.authorId);
                this.apexClient.writeConnectionMap();
                session.update(messageId, new Card().addText(`绑定成功！`));
                let ses = session;
                ses.args = [username, platform];
                apexSearch.exec(ses);
            }).catch((e) => {
                // console.log(e);
                session.update(messageId, new Card().addText(`获取名为 ${username} 的 ${platform} 用户的资料失败\n此用户可能不存在，请检查输入`));
            });
    }
}

export const apexConnect = new ApexConnect();