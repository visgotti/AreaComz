"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ChannelClient_1 = require("./ChannelClient");
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
    onAreaMessage(message) { }
    addClient(sessionId) {
        const channelClient = new ChannelClient_1.ChannelClient(sessionId, this);
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
    removeClient(sessionId, reasonCode, data) {
        this.clients = this.clients.filter((_client) => {
            return _client.sessionId !== sessionId;
        });
        delete this.pendingStates[sessionId];
        if (reasonCode !== null && !(isNaN(reasonCode))) {
            console.log('the reason code was', reasonCode);
            if (!(index_1.LEAVE_AREA_CODE_LOOKUP[reasonCode])) {
                throw 'Invalid reason code provided to removeClient';
            }
            this._sendClientDisconnect(sessionId, reasonCode, data);
        }
    }
    // this overrides any past state for the session as newest.
    updateClientState(sessionId, data) {
        this.pendingStates[sessionId] = data;
    }
    // used to get current state of player in channel
    getCurrentState(sessionId) {
        return this.pendingStates[sessionId];
    }
    // use this if you dont want to wait to relay
    // states in batched intervals
    relayClientState(sessionId, data) {
        const serialized = JSON.stringify({ sessionId, data });
        this.dealerSocket.send([this.areaId, '', serialized]);
    }
    sendMessage(message) {
        const serialized = JSON.stringify(message);
        this.dealerSocket.send([this.areaId, '', serialized]);
    }
    // this is when you want the area server
    // to start processing client state.
    sendClientStates() {
        const serialized = JSON.stringify(this.pendingStates);
        this.dealerSocket.send([this.areaId, '', serialized]);
    }
    /**
     * @param sessionId - id of client to disconnect
     * @param reasonCode - reason the channel is telling the area client disconnected
     * @param data - optional data to send a long with the disconnect message
     * @private
     */
    _sendClientDisconnect(sessionId, reasonCode, data) {
        const msg = {
            type: index_1.MESSAGE_CODE_LOOKUP.DISCONNECT,
            reasonCode,
        };
        if (data) {
            msg.data = data;
        }
        ;
        this.sendMessage({
            type: index_1.MESSAGE_CODE_LOOKUP.DISCONNECT,
            sessionId,
            reasonCode,
        });
    }
}
exports.Channel = Channel;
;
