"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
const Channel_1 = require("./Channel");
const index_1 = require("./../index");
class Connector {
    constructor(brokerURI, areasData, gameId) {
        this.dealerSocket = {};
        this.subscriberSocket = {};
        this.channels = [];
        this.dealerSocket = zmq.socket('dealer');
        this.dealerSocket.connect(brokerURI);
        this.subscriberSocket = zmq.socket('sub');
        this.channels = [];
        this.channelMap = new Map();
        this.gameId = gameId;
        this.sessionIdMap = new Map();
        this.createChannels(areasData);
    }
    onAreaMessage(areaId, message) { }
    getChannel(areaId) {
        return this.channelMap.get(areaId);
    }
    changeClientArea(sessionId, newAreaIndex) {
        let channelClient = this._getChannelClient(sessionId);
        if (channelClient) {
            const channel = channelClient.getCurrentChannel();
            if (channel.areaIndex === newAreaIndex)
                return null;
            channel.removeClient(sessionId);
            this._deleteChanelClient(sessionId);
            return this.initializeClientChannel(sessionId, newAreaIndex);
        }
        return null;
    }
    disconnectClient(sessionId) {
        const channelClient = this._getChannelClient(sessionId);
        if (channelClient) {
            const channel = channelClient.getCurrentChannel();
            channel.removeClient(sessionId, index_1.LEAVE_AREA_CODE_LOOKUP.CONNECTION_LOST);
        }
        this.sessionIdMap.delete(sessionId);
    }
    //TODO refactor to return a promise and maybe change the function name to connect
    initializeClientChannel(sessionId, areaIndex) {
        let channelClient;
        channelClient = this._getChannelClient(sessionId);
        if (channelClient !== null)
            throw new Error('Client is already initialized, use changeClientArea if you are trying to change areas.');
        if (this.channels[areaIndex]) {
            this._addSessionIdToMap(sessionId);
            channelClient = this.channels[areaIndex].addClient(sessionId);
            const session = this.sessionIdMap.get(sessionId);
            session.channelClient = channelClient;
            return channelClient;
        }
        else {
            console.log('throwing');
            throw new Error('The area index you passed in does not have a channel.');
        }
    }
    sendChannelStates() {
        for (let i = 0; i < this.channels.length; i += 1) {
            this.channels[i].sendClientStates();
        }
    }
    close() {
        this.dealerSocket.close();
        this.subscriberSocket.close();
    }
    handleReceivedMessage(areaId, message) {
        message = JSON.parse(message);
        areaId = areaId.toString();
        this.onAreaMessage(areaId, message);
        this.channelMap.get(areaId).onAreaMessage(message);
    }
    createChannels(areasData) {
        for (let i = 0; i < areasData.length; i += 1) {
            const channel = new Channel_1.Channel(this.dealerSocket, i, this.gameId);
            this.channels.push(channel);
            this.channelMap.set(channel.areaId, channel);
            // connect to the area server's publisher uri
            this.subscriberSocket.connect(areasData[i].URI);
            // subscribe to handle messages for area index.
            this.subscriberSocket.subscribe(channel.areaId);
        }
        this.subscriberSocket.on('message', (...args) => {
            const message = args[1];
            const areaId = args[0];
            this.handleReceivedMessage(areaId, message);
        });
    }
    _addSessionIdToMap(sessionId) {
        this.sessionIdMap.set(sessionId, {
            sessionId
        });
        return this.sessionIdMap.get(sessionId);
    }
    _deleteChanelClient(sessionId) {
        const session = this.sessionIdMap.get(sessionId);
        if (session) {
            delete session.channelClient;
        }
    }
    _getChannelClient(sessionId) {
        const session = this.sessionIdMap.get(sessionId);
        if (session) {
            const channelClient = session.channelClient;
            if (channelClient) {
                return channelClient;
            }
        }
        return null;
    }
}
exports.Connector = Connector;
;
