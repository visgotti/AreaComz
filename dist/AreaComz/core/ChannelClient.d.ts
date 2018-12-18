import { Channel } from './Channel';
export declare class ChannelClient {
    private channel;
    private sessionId;
    constructor(sessionId: any, channel: any);
    updateState(state: any): void;
    getCurrentState(): any;
    getCurrentAreaId(): string;
    getCurrentAreaIndex(): number;
    getCurrentChannel(): Channel;
}
