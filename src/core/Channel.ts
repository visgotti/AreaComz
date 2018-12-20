import { ChannelClient } from './ChannelClient';

import { getAreaId } from './../helpers/getAreaId';
import { CONNECTOR_REQUEST_CODES, LEAVE_AREA_CODE_LOOKUP } from './../index';

export class Channel {
    private dealerSocket: any;
    private pendingStates: any;
    public areaId: string;
    public clients: Array<any>;
    public areaIndex: number;

    constructor(dealerSocket: any, areaIndex: number, gameId: number) {
        this.dealerSocket = dealerSocket;
        this.areaId = getAreaId(areaIndex, gameId);
        this.areaIndex = areaIndex;
        this.clients = [];
        this.pendingStates = {};
    }

    public onAreaMessage(areaIndex, data) {}

    public addClient(channelClient: ChannelClient, data?: any) {
        // attach channelClient to the client
        this.clients.push(channelClient);
        channelClient.channels.push(this);
        this._sendClientConnect(channelClient.uid, data);
    }

    /** Removes client completely from system, allows options to relay message to area server.
     * @param uid - unique identifier of client
     * @param reasonCode - if the removal came from the connector end we need to notify
     * the area server with a disconnect message with a reason code.
     * @param data - If you need to send extra data along about the removal
     */
    public removeClient(uid: string, reasonCode?: number, data?: any) {
        this.clients = this.clients.filter((_client) => {
            return _client.uid !== uid
        });

        delete this.pendingStates[uid];

        if(reasonCode !== null && !(isNaN(reasonCode))) {
            if(!(LEAVE_AREA_CODE_LOOKUP[reasonCode])) {
                throw 'Invalid reason code provided to removeClient';
            }
            this._sendClientDisconnect(uid, reasonCode, data);
        }
    }

    // this overrides any past state for the session as newest.
    public updateClientState(uid, data) {
        this.pendingStates[uid] = data;
    }

    // used to get current state of player in channel
    public getCurrentState(uid) {
        return this.pendingStates[uid];
    }

    // use this if you dont want to wait to relay
    // states in batched intervals
    public relayClientState(uid, data) {
        const serialized = JSON.stringify({ uid, data });
        this.dealerSocket.send([ this.areaId, '', serialized])
    }

    // this is when you want the area server
    // to start processing client state.
    public sendClientStates() {
        this.sendMessage({
            type: CONNECTOR_REQUEST_CODES.DATA,
            data: this.pendingStates
        });
    }

    // sending any other type of data to area other than
    // state updates/disconnect/connect
    public sendData(data: any) {
        this.sendMessage({
            type: CONNECTOR_REQUEST_CODES.DATA,
            data,
        })
    }

    public hasClient(uid: string) {
        for(let i = 0; i < this.clients.length; i++) {
            if(this.clients[i].uid === uid) {
                return true;
            }
        }
        return false;
    }

    private registerResponseHandlers(){}


    /**
     * @param uid - unique id of client to disconnect
     * @param reasonCode - reason the channel is telling the area client disconnected
     * @param data - optional data to send a long with the disconnect message
     * @private
     */
    private _sendClientDisconnect(uid, reasonCode: number, data?: any) {
        this.sendMessage({
            type: CONNECTOR_REQUEST_CODES.CLIENT_DISCONNECT,
            from: this.dealerSocket.identity,
            uid,
            reasonCode,
            data,
        });
    }

    /**
     * @param uid - unique id of client to connect
     * @param data - any data you want the area to process when connected
     * @private
     */
    private _sendClientConnect(uid: string, data?: any) {
        this.sendMessage({
            type: CONNECTOR_REQUEST_CODES.CLIENT_CONNECT,
            from: this.dealerSocket.identity,
            uid,
            data,
        });
    }


    /** lowest level function for parsing then sending message through a channel.
     * @param message - data to send over socket
     */
    private sendMessage(message: any) {
        const serialized = JSON.stringify(message);
        this.dealerSocket.send([ this.areaId, '', serialized]);
    }
};