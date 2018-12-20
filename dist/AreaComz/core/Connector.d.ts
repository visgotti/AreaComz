import { Channel } from './Channel';
import { ChannelClient } from './ChannelClient';
export declare class Connector {
    private dealerSocket;
    private subscriberSocket;
    private channelMap;
    private uidMap;
    private awaitingConnectionCallbacks;
    channels: Array<Channel>;
    gameId: number;
    constructor(brokerRouterURI: string, areasData: Array<any>, connectorIndex: number, gameId: number);
    onAreaMessage(areaId: string, message: any): void;
    getChannel(areaId: any): Channel;
    disconnectClient(uid: any): void;
    /**
     * Creates channel client
     * @param uid
     * @returns {ChannelClient}
     */
    initializeChannelClient(uid: any): ChannelClient;
    /**
     * Connects a channel client to the area, it isnt asynchronous so it allows
     * you to start sending data right away, but the channelClient.onConfirmedConnection
     * or onFailedConnection will be fired asynchronously if you do want to wait.
     * @param uid
     * @param areaIndex
     * @param data
     */
    connectClientToArea(uid: any, areaIndex: any, data?: any): void;
    removeClientFromArea(uid: any, areaIndex: any, data?: any): void;
    sendChannelStates(): void;
    close(): void;
    private handleReceivedMessage;
    private createChannels;
    private registerResponseHandlers;
    private _addUidToMap;
    private _deleteChanelClient;
    private _getChannelClient;
}
