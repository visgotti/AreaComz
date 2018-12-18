import { ChannelClient } from './ChannelClient';
export declare class Channel {
    private dealerSocket;
    private clients;
    private pendingStates;
    areaId: string;
    areaIndex: number;
    constructor(dealerSocket: any, areaIndex: number, gameId: number);
    onAreaMessage(message: any): void;
    addClient(sessionId: string): ChannelClient;
    /** Removes client completely from system, allows options to relay message to area server.
     * @param sessionId
     * @param reasonCode - if the removal came from the connector end we need to notify
     * the area server with a disconnect message with a reason code.
     * @param data - If you need to send extra data along about the removal
     */
    removeClient(sessionId: string, reasonCode?: number, data?: any): void;
    updateClientState(sessionId: any, data: any): void;
    getCurrentState(sessionId: any): any;
    relayClientState(sessionId: any, data: any): void;
    sendMessage(message: any): void;
    sendClientStates(): void;
    /**
     * @param sessionId - id of client to disconnect
     * @param reasonCode - reason the channel is telling the area client disconnected
     * @param data - optional data to send a long with the disconnect message
     * @private
     */
    private _sendClientDisconnect;
}
