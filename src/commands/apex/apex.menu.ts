import { Card, MenuCommand } from 'kbotify';
import { apexConnect } from './apex.connect.app';
import { apexSearch } from './apex.search.app';

class ApexMenu extends MenuCommand {
    code = 'apex';
    trigger = 'apex';
    help = '';

    intro = '复读菜单';
    menu = new Card()
        .addText('```\n.apex search <username> <origin|pc|psn|ps|xbl|xbox>\n```')
        .addText('```\n.apex connect <username> <origin|pc|psn|ps|xbl|xbox>\n```')
        .toString();
    useCardMenu = true; // 使用卡片菜单
}

export const apexMenu = new ApexMenu(apexSearch, apexConnect);
