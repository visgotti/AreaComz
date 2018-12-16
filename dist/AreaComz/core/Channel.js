"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getAreaId_1 = require("./../helpers/getAreaId");
class Channel {
    constructor(dealerSocket, areaIndex, gameId) {
        this.dealerSocket = dealerSocket;
        this.areaId = getAreaId_1.getAreaId(areaIndex, gameId);
        this.areaIndex = areaIndex;
        this.clients = [];
        this.pendingStates = new Map();
    }
    onAreaMessage(message) { }
    addClient(client) {
        this.clients.push(client);
    }
    // TODO clean area change vs. unnatural removal/disconnection and must notify area serve
    removeClient(sessionId) {
        this.clients = this.clients.filter((_client) => {
            return _client.sessionId !== sessionId;
        });
        if (this.pendingStates.hasOwnProperty(sessionId)) {
            delete this.pendingStates[sessionId];
        }
    }
    // this overrides any past state for the session as newest.
    updateClientStates(sessionId, data) {
        if (!(sessionId in this.pendingStates)) {
            this.pendingStates[sessionId] = [];
        }
        this.pendingStates[sessionId] = data;
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
}
exports.Channel = Channel;
;
