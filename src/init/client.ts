import Kasumi from 'kasumi.js';
import auth from '../configs/auth';
import { KasumiConfig } from 'kasumi.js/dist/type';

let config: KasumiConfig;

if (auth.useWebHook) {
    config = {
        type: 'webhook',
        token: auth.khltoken,
        verifyToken: auth.khlverify,
        encryptKey: auth.khlkey,
        port: auth.khlport,
        disableSnOrderCheck: auth.disableSnOrderCheck
    }
} else {
    config = {
        type: 'websocket',
        token: auth.khltoken,
        disableSnOrderCheck: auth.disableSnOrderCheck
    }
}

export const bot = new Kasumi(config);
