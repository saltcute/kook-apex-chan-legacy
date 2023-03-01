import { BaseMenu } from 'kasumi.js';
import { apexConnect } from './apex.connect.app';
import { apexSearch } from './apex.search.app';

class ApexMenu extends BaseMenu {
    name = 'apex';
    prefix = './!'
}

export const apexMenu = new ApexMenu(apexSearch, apexConnect);
