"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ChannelClient {
    constructor(uid) {
        this.uid = uid;
        this.state = {};
        this.channels = [];
    }
    onConfirmedConnection(areaIndex, data) { }
    ;
    onFailedConnection(areaIndex, data) { }
    ;
    updateState(state) {
        this.state = state;
        for (let i = 0; i < this.channels.length; i++) {
            this.channels[i].updateClientState(this.uid, state);
        }
    }
    isInArea(areaIndex) {
        for (let i = 0; i < this.channels.length; i++) {
            if (areaIndex === this.channels[i].areaIndex) {
                return true;
            }
        }
        return false;
    }
    getCurrentState() {
        return this.state;
    }
    getCurrentAreaIds() {
        return this.channels.map(channel => channel.areaId);
    }
    getCurrentAreaIndexes() {
        return this.channels.map(channel => channel.areaIndex);
    }
}
exports.ChannelClient = ChannelClient;
;
