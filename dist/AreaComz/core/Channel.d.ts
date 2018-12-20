import { ChannelClient } from './ChannelClient';
export declare class Channel {
    private dealerSocket;
    private pendingStates;
    areaId: string;
    clients: Array<any>;
    areaIndex: number;
    constructor(dealerSocket: any, areaIndex: number, gameId: number);
    onAreaMessage(areaIndex: any, data: any): void;
    addClient(channelClient: ChannelClient, data?: any): void;
    /** Removes client completely from system, allows options to relay message to area server.
     * @param uid - unique identifier of client
     * @param reasonCode - if the removal came from the connector end we need to notify
     * the area server with a disconnect message with a reason code.
     * @param data - If you need to send extra data along about the removal
     */
    removeClient(uid: string, reasonCode?: number, data?: any): void;
    updateClientState(uid: any, data: any): void;
    getCurrentState(uid: any): any;
    relayClientState(uid: any, data: any): void;
    sendClientStates(): void;
    sendData(data: any): void;
    hasClient(uid: string): boolean;
    private registerResponseHandlers;
    /**
     * @param uid - unique id of client to disconnect
     * @param reasonCode - reason the channel is telling the area client disconnected
     * @param data - optional data to send a long with the disconnect message
     * @private
     */
    private _sendClientDisconnect;
    /**
     * @param uid - unique id of client to connect
     * @param data - any data you want the area to process when connected
     * @private
     */
    private _sendClientConnect;
    /** lowest level function for parsing then sending message through a channel.
     * @param message - data to send over socket
     */
    private sendMessage;
}
