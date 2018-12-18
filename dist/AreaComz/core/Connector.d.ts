import { Channel } from './Channel';
import { ChannelClient } from './ChannelClient';
export declare class Connector {
    private dealerSocket;
    private subscriberSocket;
    private channelMap;
    private sessionIdMap;
    channels: Array<Channel>;
    gameId: number;
    constructor(brokerURI: string, areasData: Array<any>, gameId: number);
    onAreaMessage(areaId: string, message: any): void;
    getChannel(areaId: any): Channel;
    changeClientArea(sessionId: any, newAreaIndex: any): ChannelClient;
    disconnectClient(sessionId: any): void;
    initializeClientChannel(sessionId: any, areaIndex: any): ChannelClient;
    sendChannelStates(): void;
    close(): void;
    private handleReceivedMessage;
    private createChannels;
    private _addSessionIdToMap;
    private _deleteChanelClient;
    private _getChannelClient;
}
