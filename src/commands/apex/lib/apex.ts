import axios, { AxiosInstance } from 'axios';
import upath from 'upath';
import mcache from 'memory-cache';
import * as fs from 'fs';
import auth from 'configs/auth';

export let humanToTrackerGG: {
    [key: string]: 'PC' | 'PS4' | 'X1'
} = {
    origin: 'PC',
    psn: 'PS4',
    ps: 'PS4',
    xbox: 'X1',
    xbl: 'X1',
    playstation: 'PS4',
    pc: 'PC'
}

namespace segement {
    export type stat = {
        rank: null | number,
        percentile: number,
        displayName: string,
        displayCategory: string,
        category: any,
        description: any,
        metadata: {
            iconUrl?: string,
            rankName?: string,
            sectionLabel?: string,
        },
        value: number,
        displayValue: string,
        displayType: string
    }
    export type overview = {
        type: 'overview',
        attributes: {},
        metadata: {
            name: string
        },
        expiryDate: string,
        stats: {
            level: stat,
            kills: stat,
            damage: stat,
            headshots: stat,
            winsWithFullSquad: stat,
            rankScore: stat,
            arenaRankScore: stat,
            season6Wins?: stat,
            season7Wins?: stat,
            season7Kills?: stat,
            season8Kills?: stat,
            season9Kills?: stat,
            season11Wins?: stat,
            season11Kills?: stat,
            season12Wins?: stat,
            wins?: stat,
            peakRankScore: stat,
            [name: string]: stat | undefined
        }
    }
    export type legend = {
        type: 'legend',
        attributes: {
            id: string,
        },
        metadata: {
            name: string,
            imageUrl: string,
            tallImageUrl: string,
            bgImageUrl: string,
            protraitImageUrl: string,
            legendColor: string,
            isActive: boolean
        },
        stats: {
            [name: string]: stat
        }
    }
}

interface userDetailGG {
    platformInfo: {
        platformSlug: 'origin' | 'xbl' | 'psn',
        platformUserId: string,
        platformUserHandle: string,
        platformUserIdentifier: string,
        avatarUrl: string,
        additionalParameters: any
    },
    userInfo: {
        userId: null | string,
        isPremium: boolean,
        isVerified: boolean,
        isInfluencer: boolean,
        isPartner: boolean,
        countryCode: null | string,
        customAvatarUrl: null | string,
        customHeroUrl: null | string,
        socialAccounts: any[],
        pageviews: number,
        isSuspicious: null | boolean
    },
    metadata: {
        currenSeason: number,
        activeLegend: string,
        activeLegendName: string,
        activeLegendStats: string[],
        isGameBanned: boolean,
        isOverwolfAppUser: boolean
    },
    segments: [segement.overview, ...segement.legend[]],
    availableSegments: {
        type: string,
        attributes: any,
        metadata: any
    }[],
    expiryDate: string,
};

interface userDetail {
    global: {
        name: string,
        uid: number,
        avatar: string,
        platform: string,
        level: number,
        toNextLevelPercent: number,
        internalUpdateCount: number,
        bans: {
            isActive: boolean,
            remainingSeconds: number,
            last_banReason: string
        },
        rank: {
            rankScore: number,
            rankName: string,
            ranDiv: number,
            ladderPosPlatform: number,
            rankImg: string,
            rankedSeason: string
        },
        arena: {
            rankScore: number,
            rankName: string,
            rankDiv: number,
            ladderPosPlatform: number,
            rankImg: string,
            rankedSeason: string
        },
        battlepass: {
            level: number,
            history: {
                [key: string]: number
            }
        },
        internalParsingVersion: number,
        badges: {
            name: string,
            value: number
        }[],
        levelPrestige: number
    },
    realtime: {
        lobbyState: string,
        isOnline: 0 | 1,
        isInGame: 0 | 1,
        canJoin: 0 | 1,
        partyFull: 0 | 1,
        selectedLegend: string,
        currentState: string,
        currentStateSinceTimestamp: number,
        currentStateAsText: string
    },
    legends: {
        selected: {
            LegendName: string,
            data: {
                name: string,
                value: number,
                key: string,
                global: boolean
            }[],
            gameInfo: {
                skin: string,
                skinRariry: string,
                frame: string,
                frameRarity: string,
                pose: string,
                poseRarity: string,
                intro: string,
                introRarity: string,
                badge: {
                    name: string,
                    value: number,
                    category: string
                }[]
            }
        },
        ImgAssets: {
            icon: string,
            banner: string
        }
    }
    all: {
        [key: string]: any
    }
}

namespace predator {
    export type requirement = {
        foundRank: number,
        val: number,
        uid: string,
        updateTimestamp: number,
        totalMastersAndPreds: number
    }
    export type platform = {
        PC: requirement,
        PS4: requirement,
        X1: requirement,
        SWITCH: requirement
    }
    export type data = {
        RP: platform,
        AP: platform
    }
}

export type connection = {
    PC?: {
        username: string,
        timestamp: number
    },
    PS4?: {
        username: string,
        timestamp: number
    },
    X1?: {
        username: string,
        timestamp: number
    }
}

export class Apex {
    private trackergg_token: string;
    private als_token: string;
    private _requestor_gg: AxiosInstance;
    private _requestor_als: AxiosInstance;
    private connection_map: Map<string, connection> = new Map();
    public static defaultRankImage = 'https://trackercdn.com/cdn/apex.tracker.gg/ranks/bronze4.png';
    public static predatorRankImage = 'https://trackercdn.com/cdn/apex.tracker.gg/ranks/apex.png';
    constructor(trackergg_token: string, als_token: string) {
        this.trackergg_token = trackergg_token;
        this.als_token = als_token;
        this._requestor_gg = axios.create({
            baseURL: 'https://public-api.tracker.gg/',
            headers: {
                'TRN-Api-Key': this.trackergg_token
            }
        })
        this._requestor_als = axios.create({
            baseURL: 'https://api.mozambiquehe.re/',
            params: {
                auth: this.als_token
            }
        })

        this.readConnectionMap();
    }

    readConnectionMap() {
        let connect_data = this._readJSON(upath.join(__dirname, 'data', 'connection.json'));
        if (connect_data) this.connection_map = new Map(Object.entries(connect_data));
    }

    writeConnectionMap() {
        this._writeJSON(upath.join(__dirname, 'data', 'connection.json'), Object.fromEntries(this.connection_map));
    }

    _readJSON(path: string): any | undefined {
        try {
            return JSON.parse(fs.readFileSync(path, { encoding: 'utf-8', flag: 'r' }));
        } catch (e) {
            return undefined;
        }
    }
    _writeJSON(path: string, data: any): void {
        let dir = upath.dirname(path);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path, JSON.stringify(data));
    }
    getCache(keyp: string[]): Promise<any | undefined> {
        let key = keyp.join('');
        let cache = mcache.get(key);
        return cache
    }
    putCache(keyp: string[], data: any) {
        let key = keyp.join('');
        mcache.put(key, data, 30 * 60 * 1000);
        return data;
    }
    private async requestor_gg(endpoint: string) {
        return this._requestor_gg({
            url: endpoint
        }).then((res) => {
            return res.data
        }).catch((e) => { console.log(e); throw e; })
    }
    private async requestor_als(endpoint: string, params?: any) {
        return this._requestor_als({
            url: endpoint,
            params
        }).then((res) => {
            return res.data
        }).catch((e) => { console.log(e); throw e; })
    }
    private async cache(keyp: string[], func: () => Promise<any>) {
        let cache = this.getCache(keyp);
        if (cache) return cache;
        else {
            let data = await func();
            this.putCache(keyp, data);
            return data;
        }
    }
    public getConnection(platform: 'PC' | 'PS4' | 'X1', kookUserId: string) {
        let connection = this.connection_map.get(kookUserId);
        if (connection) return connection[platform];
        else return undefined;
    }
    public connectPlatform(platform: 'PC' | 'PS4' | 'X1', username: string, kookUserId: string) {
        let connection = this.connection_map.get(kookUserId);
        if (connection) {
            connection[platform] = {
                username,
                timestamp: Date.now()
            }
        } else {
            this.connection_map.set(kookUserId, {
                [platform]: {
                    username,
                    timestamp: Date.now()
                }
            })
        }
    }
    public disconnectPlatform(platform: 'PC' | 'PS4' | 'X1', kook_userId: string) {
        let connection = this.connection_map.get(kook_userId);
        if (connection) connection[platform] = undefined;
    }
    /*
    public async getPlayerDetail(platform: 'PC' | 'PS4' | 'X1', username: string): Promise<userDetail> {
        return this.cache(['player_detail', platform, username], async () => {
            return this.requestor_gg(upath.join('v2', 'apex', 'standard', 'profile', platform, username))
                .then((res) => { return res.data; })
                .catch((e) => { console.log(e); throw e });
        })
    }*/
    public async getPlayerDetail(platform: 'PC' | 'PS4' | 'X1', username: string): Promise<userDetail> {
        return this.cache(['player_detail', platform, username], async () => {
            return this.requestor_als(upath.join('bridge'), { auth: auth.alsKey, player: username, platform })
                .then((res) => { return res; })
                .catch((e) => { throw e });
        }).catch(e => { throw e });
    }
    public async getPredatorRequirement(type: 'RP' | 'AP', platform: 'PC' | 'PS4' | 'X1'): Promise<predator.requirement> {
        return this.cache(['predator_requirement', type, platform], async () => {
            return this.requestor_als('predator')
                .then((res: predator.data) => { return res[type][platform]; })
                .catch((e) => { throw e });
        })
    }
}

let apex: Apex
export default (trackergg_token: string, als_token: string) => {
    if (!apex) apex = new Apex(trackergg_token, als_token);
    return apex;
}