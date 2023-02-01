import { Card, MenuCommand } from 'kbotify';
import { apexSearch } from './apex.search.app';

class ApexMenu extends MenuCommand {
    code = 'apex';
    trigger = 'apex';
    help = '';

    intro = '复读菜单';
    menu = new Card().addText('一些卡片里需要展示的东西').toString();
    useCardMenu = true; // 使用卡片菜单
}

export const apexMenu = new ApexMenu(apexSearch);
