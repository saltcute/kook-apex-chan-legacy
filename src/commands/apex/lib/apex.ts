import axios, { AxiosInstance } from 'axios';
import upath from 'upath';
import mcache from 'memory-cache';
import { StrategyEnum } from 'sharp';

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

type userDetail = {
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

export default class Apex {
    private trackergg_token: string;
    private als_token: string;
    private _requestor_gg: AxiosInstance;
    private _requestor_als: AxiosInstance;
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
    private async requestor_als(endpoint: string) {
        return this._requestor_als({
            url: endpoint
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
    public async getPlayerDetail(platform: 'origin' | 'psn' | 'xbl', username: string): Promise<userDetail> {
        return this.cache(['player_detail', platform, username], async () => {
            return this.requestor_gg(upath.join('v2', 'apex', 'standard', 'profile', platform, username))
                .then((res) => { return res.data; })
                .catch((e) => { console.log(e); throw e });
        })
    }
    public async getPredatorRequirement(type: 'RP' | 'AP', platform: 'origin' | 'psn' | 'xbl'): Promise<predator.requirement> {
        let map: { [key: string]: 'PC' | 'PS4' | 'X1' } = {
            origin: 'PC',
            psn: 'PS4',
            xbl: 'X1'
        }
        return this.cache(['predator_requirement', type, platform], async () => {
            return this.requestor_als('predator')
                .then((res: predator.data) => { return res[type][map[platform]]; })
                .catch((e) => { console.log(e); throw e });
        })
    }
}