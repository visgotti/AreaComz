"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getAreaId_1 = require("./../helpers/getAreaId");
const index_1 = require("./../index");
class Channel {
    constructor(dealerSocket, areaIndex, gameId) {
        this.dealerSocket = dealerSocket;
        this.areaId = getAreaId_1.getAreaId(areaIndex, gameId);
        this.areaIndex = areaIndex;
        this.clients = [];
        this.pendingStates = {};
    }
    onAreaMessage(areaIndex, data) { }
    addClient(channelClient, data) {
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
    removeClient(uid, reasonCode, data) {
        this.clients = this.clients.filter((_client) => {
            return _client.uid !== uid;
        });
        delete this.pendingStates[uid];
        if (reasonCode !== null && !(isNaN(reasonCode))) {
            if (!(index_1.LEAVE_AREA_CODE_LOOKUP[reasonCode])) {
                throw 'Invalid reason code provided to removeClient';
            }
            this._sendClientDisconnect(uid, reasonCode, data);
        }
    }
    // this overrides any past state for the session as newest.
    updateClientState(uid, data) {
        this.pendingStates[uid] = data;
    }
    // used to get current state of player in channel
    getCurrentState(uid) {
        return this.pendingStates[uid];
    }
    // use this if you dont want to wait to relay
    // states in batched intervals
    relayClientState(uid, data) {
        const serialized = JSON.stringify({ uid, data });
        this.dealerSocket.send([this.areaId, '', serialized]);
    }
    // this is when you want the area server
    // to start processing client state.
    sendClientStates() {
        this.sendMessage({
            type: index_1.CONNECTOR_REQUEST_CODES.DATA,
            data: this.pendingStates
        });
    }
    // sending any other type of data to area other than
    // state updates/disconnect/connect
    sendData(data) {
        this.sendMessage({
            type: index_1.CONNECTOR_REQUEST_CODES.DATA,
            data,
        });
    }
    hasClient(uid) {
        for (let i = 0; i < this.clients.length; i++) {
            if (this.clients[i].uid === uid) {
                return true;
            }
        }
        return false;
    }
    registerResponseHandlers() { }
    /**
     * @param uid - unique id of client to disconnect
     * @param reasonCode - reason the channel is telling the area client disconnected
     * @param data - optional data to send a long with the disconnect message
     * @private
     */
    _sendClientDisconnect(uid, reasonCode, data) {
        this.sendMessage({
            type: index_1.CONNECTOR_REQUEST_CODES.CLIENT_DISCONNECT,
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
    _sendClientConnect(uid, data) {
        this.sendMessage({
            type: index_1.CONNECTOR_REQUEST_CODES.CLIENT_CONNECT,
            from: this.dealerSocket.identity,
            uid,
            data,
        });
    }
    /** lowest level function for parsing then sending message through a channel.
     * @param message - data to send over socket
     */
    sendMessage(message) {
        const serialized = JSON.stringify(message);
        this.dealerSocket.send([this.areaId, '', serialized]);
    }
}
exports.Channel = Channel;
;
