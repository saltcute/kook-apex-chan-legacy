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
        const { err, data } = (await session.send(new Card().addText('正在加载……请稍候')));
        if (err) return this.logger.error(err);
        let messageId = data.msg_id;
        if (humanToTrackerGG[plat]) {
            platform = humanToTrackerGG[plat];
        }
        return this.apexClient.getPlayerDetail(platform, username)
            .then(async (user) => {
                if (this.apexClient.isError(user)) {
                    return session.update(messageId, new Card()
                        .addText(`绑定名为 ${username} 的 ${platform} 用户的资料失败\n(font)${user.Error}(font)[danger]`));
                }
                this.apexClient.connectPlatform(platform, username, session.authorId);
                this.apexClient.writeConnectionMap();
                session.update(messageId, new Card().addText(`绑定成功！`));
                let ses = session;
                ses.args = [username, platform];
                apexSearch.exec(ses);
            }).catch((e) => {
                // console.log(e);
                this.logger.error(e);
                session.update(messageId, new Card().addText(`绑定名为 ${username} 的 ${platform} 用户的资料失败\n(font)其他错误(font)[danger]`));
            });
    }
}

export const apexConnect = new ApexConnect();