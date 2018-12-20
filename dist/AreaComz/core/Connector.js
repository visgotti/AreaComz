"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
const Channel_1 = require("./Channel");
const ChannelClient_1 = require("./ChannelClient");
const index_1 = require("./../index");
class Connector {
    constructor(brokerRouterURI, areasData, connectorIndex, gameId) {
        this.dealerSocket = {};
        this.subscriberSocket = {};
        this.channels = [];
        this.dealerSocket = zmq.socket('dealer');
        this.dealerSocket.identity = "connector-" + connectorIndex + '-' + gameId;
        this.dealerSocket.connect(brokerRouterURI);
        console.log('connector connected... to', brokerRouterURI);
        this.subscriberSocket = zmq.socket('sub');
        this.channels = [];
        this.channelMap = new Map();
        this.gameId = gameId;
        this.uidMap = new Map();
        this.awaitingConnectionCallbacks = new Map();
        this.createChannels(areasData);
        this.registerResponseHandlers();
    }
    onAreaMessage(areaId, message) { }
    getChannel(areaId) {
        return this.channelMap.get(areaId);
    }
    disconnectClient(uid) {
        const channelClient = this._getChannelClient(uid);
        if (channelClient) {
            for (let i = 0; i < channelClient.channels.length; i++) {
                channelClient.channels[i].removeClient(uid, index_1.LEAVE_AREA_CODE_LOOKUP.CONNECTION_LOST);
            }
        }
        this.uidMap.delete(uid);
    }
    /**
     * Creates channel client
     * @param uid
     * @returns {ChannelClient}
     */
    initializeChannelClient(uid) {
        let channelClient;
        channelClient = this._getChannelClient(uid);
        console.log('the channel client was', channelClient);
        if (channelClient !== null)
            throw new Error('Client is already initialized.');
        channelClient = new ChannelClient_1.ChannelClient(uid);
        this._addUidToMap(uid, channelClient);
        return channelClient;
    }
    /**
     * Connects a channel client to the area, it isnt asynchronous so it allows
     * you to start sending data right away, but the channelClient.onConfirmedConnection
     * or onFailedConnection will be fired asynchronously if you do want to wait.
     * @param uid
     * @param areaIndex
     * @param data
     */
    connectClientToArea(uid, areaIndex, data) {
        const channel = this.channels[areaIndex];
        if (!(channel))
            throw new Error('Area index passed into connectClientToArea does not exist.');
        const channelClient = this._getChannelClient(uid);
        if (channelClient === null)
            throw new Error('Initialize channelClient for uid before trying to connect');
        if (channelClient.isInArea(areaIndex))
            throw new Error('Client is already in this area');
        channel.addClient(channelClient, data);
        // if we uid is still in awaiting connections after 5 seconds throw error
        //todo make timeout configurable
        setTimeout(() => {
            if (this.awaitingConnectionCallbacks.has(uid)) {
                this.awaitingConnectionCallbacks.delete(uid);
                channelClient.onFailedConnection(0);
            }
        }, 5000);
        // set the callback for uid, this will then get called
        // from the response handler.
        this.awaitingConnectionCallbacks.set(uid, (areaIndex, data) => {
            channelClient.onConfirmedConnection(areaIndex, data);
        });
    }
    removeClientFromArea(uid, areaIndex, data) {
        const channel = this.channels[areaIndex];
        if (!(channel))
            throw new Error('Area index passed into connectClientToArea does not exist.');
        const channelClient = this._getChannelClient(uid);
        channelClient.channels = channelClient.channels.filter(channel => {
            if (channel.areaIndex === areaIndex) {
                channel.removeClient(uid);
                return false;
            }
            return true;
        });
        channel.removeClient(uid);
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
    registerResponseHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const message = JSON.parse(args[1]);
                switch (message.type) {
                    case index_1.AREA_RESPONSE_CODES.CONNECT_SUCCESS:
                        //running clientChannel's onConfirmedConnection
                        const callback = this.awaitingConnectionCallbacks.get(message.uid);
                        if (callback)
                            callback(message.areaIndex, message.data);
                        break;
                    default:
                        throw new Error('Invalid message type was sent to area server.');
                }
            }
        });
    }
    _addUidToMap(uid, channelClient) {
        this.uidMap.set(uid, {
            uid,
            channelClient,
        });
        return this.uidMap.get(uid);
    }
    _deleteChanelClient(uid) {
        const session = this.uidMap.get(uid);
        if (session) {
            delete session.channelClient;
        }
    }
    _getChannelClient(uid) {
        const session = this.uidMap.get(uid);
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
