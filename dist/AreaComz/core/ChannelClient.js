"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ChannelClient {
    constructor(sessionId, channel) {
        this.sessionId = sessionId;
        this.channel = channel;
    }
    updateState(state) {
        this.channel.updateClientState(this.sessionId, state);
    }
    getCurrentState() {
        return this.channel.getCurrentState(this.sessionId);
    }
    getCurrentAreaId() {
        return this.channel.areaId;
    }
    getCurrentAreaIndex() {
        return this.channel.areaIndex;
    }
    getCurrentChannel() {
        return this.channel;
    }
}
exports.ChannelClient = ChannelClient;
;
