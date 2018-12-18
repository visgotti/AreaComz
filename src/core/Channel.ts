import { ChannelClient } from './ChannelClient';

import { getAreaId } from './../helpers/getAreaId';
import { MESSAGE_CODE_LOOKUP, LEAVE_AREA_CODE_LOOKUP } from './../index';

export class Channel {
    private dealerSocket: any;
    private clients: Array<any>;
    private pendingStates: any;
    public areaId: string;
    public areaIndex: number;

    constructor(dealerSocket: any, areaIndex: number, gameId: number) {
        this.dealerSocket = dealerSocket;
        this.areaId = getAreaId(areaIndex, gameId);
        this.areaIndex = areaIndex;
        this.clients = [];
        this.pendingStates = {};
    }

    public onAreaMessage(message) {}

    public addClient(sessionId: string) {
        const channelClient = new ChannelClient(sessionId, this);
        // attach channelClient to the client
        this.clients.push(channelClient);
        return channelClient;
    }

    /** Removes client completely from system, allows options to relay message to area server.
     * @param sessionId
     * @param reasonCode - if the removal came from the connector end we need to notify
     * the area server with a disconnect message with a reason code.
     * @param data - If you need to send extra data along about the removal
     */
    public removeClient(sessionId: string, reasonCode?: number, data?: any) {
        this.clients = this.clients.filter((_client) => {
            return _client.sessionId !== sessionId
        });

        delete this.pendingStates[sessionId];

        if(reasonCode !== null && !(isNaN(reasonCode))) {
            console.log('the reason code was', reasonCode);
            if(!(LEAVE_AREA_CODE_LOOKUP[reasonCode])) {
                throw 'Invalid reason code provided to removeClient';
            }
            this._sendClientDisconnect(sessionId, reasonCode, data);
        }
    }

    // this overrides any past state for the session as newest.
    public updateClientState(sessionId, data) {
        this.pendingStates[sessionId] = data;
    }

    // used to get current state of player in channel
    public getCurrentState(sessionId) {
        return this.pendingStates[sessionId];
    }

    // use this if you dont want to wait to relay
    // states in batched intervals
    public relayClientState(sessionId, data) {
        const serialized = JSON.stringify({ sessionId, data });
        this.dealerSocket.send([ this.areaId, '', serialized])
    }

    public sendMessage(message) {
        const serialized = JSON.stringify(message);
        this.dealerSocket.send([ this.areaId, '', serialized]);
    }

    // this is when you want the area server
    // to start processing client state.
    public sendClientStates() {
        const serialized = JSON.stringify(this.pendingStates);
        this.dealerSocket.send([this.areaId, '', serialized])
    }

    /**
     * @param sessionId - id of client to disconnect
     * @param reasonCode - reason the channel is telling the area client disconnected
     * @param data - optional data to send a long with the disconnect message
     * @private
     */
    private _sendClientDisconnect(sessionId, reasonCode: number, data?: any) {
        const msg : any = {
            type: MESSAGE_CODE_LOOKUP.DISCONNECT,
            reasonCode,
        };

        if(data) {
            msg.data = data;
        };

        this.sendMessage({
            type: MESSAGE_CODE_LOOKUP.DISCONNECT,
            sessionId,
            reasonCode,
        });
    }
};