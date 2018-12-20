import { Channel } from './Channel';
export declare class ChannelClient {
    private state;
    channels: Array<Channel>;
    uid: string;
    constructor(uid: any);
    onConfirmedConnection(areaIndex: number, data?: any): void;
    onFailedConnection(areaIndex: number, data?: any): void;
    updateState(state: any): void;
    isInArea(areaIndex: any): boolean;
    getCurrentState(): any;
    getCurrentAreaIds(): string[];
    getCurrentAreaIndexes(): number[];
}
