"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
const Channel_1 = require("./Channel");
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
        return this.channelMap[areaId];
    }
    close() {
        this.dealerSocket.close();
        this.subscriberSocket.close();
    }
    handleReceivedMessage(areaId, message) {
        message = JSON.parse(message);
        this.onAreaMessage(areaId, message);
        this.channelMap[areaId].onAreaMessage(message);
    }
    createChannels(areasData) {
        console.log('Creating channels in connector on PID', process.pid);
        for (let i = 0; i < areasData.length; i += 1) {
            const channel = new Channel_1.Channel(this.dealerSocket, i, this.gameId);
            this.channels.push(channel);
            this.channelMap[channel.areaId] = channel;
            // connect to the area server's publisher uri
            this.subscriberSocket.connect(areasData[i].URI);
            console.log('connected subscriber socket to', areasData[i].URI);
            // subscribe to handle messages for area index.
            this.subscriberSocket.subscribe(channel.areaId);
            console.log('subscribed subscriber socket for area id', channel.areaId);
        }
        this.subscriberSocket.on('message', (...args) => {
            const areaId = args[0];
            const message = JSON.parse(args[1]);
            this.handleReceivedMessage(areaId, message);
        });
    }
    changeArea(sessionId, newAreaIndex) {
        if (sessionId in this.sessionIdMap && this.sessionIdMap[sessionId].areaIndex !== newAreaIndex) {
            this.sessionIdMap[sessionId].areaIndex = newAreaIndex;
            this.channels[this.sessionIdMap[sessionId].areaIndex].removeClient(sessionId);
            this.channels[newAreaIndex].addClient(this.sessionIdMap[sessionId].client);
        }
    }
    addClient(client, areaIndex) {
        this.sessionIdMap[client.sessionId] = {
            client,
            areaIndex,
        };
        if (this.channels[areaIndex]) {
            this.channels[areaIndex].addClient(client);
        }
    }
    sendChannelStates() {
        for (let i = 0; i < this.channels.length; i += 1) {
            this.channels[i].sendClientStates();
        }
    }
}
exports.Connector = Connector;
;
