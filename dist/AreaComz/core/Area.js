"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
const getAreaId_1 = require("./../helpers/getAreaId");
class Area {
    /**
     * @param URI - URI string the area listens on
     * @param areaIndex
     * @param brokerURI
     * @param gameId - Unique identifier of the game the areaRouter is used for.
     */
    constructor(URI, brokerURI, areaIndex, gameId) {
        this.dealerSocket = {};
        this.pubSocket = {};
        this.dealerSocket = zmq.socket('dealer');
        this.areaIndex = areaIndex;
        this.areaId = getAreaId_1.getAreaId(areaIndex, gameId);
        this.dealerSocket.identity = this.areaId;
        this.dealerSocket.connect(brokerURI);
        this.registerMessageHandlers();
        this.pubSocket = zmq.socket('pub');
        this.pubSocket.bind(URI);
    }
    onChannelMessage(message) { }
    broadcast(data) {
        const encoded = JSON.stringify(data);
        this.pubSocket.send([this.areaId, encoded]);
    }
    handleChannelMessage(message) {
        message = JSON.parse(message);
        this.onChannelMessage(message);
    }
    registerMessageHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                this.handleChannelMessage(args[1]);
            }
        });
    }
    close() {
        this.dealerSocket.close();
        this.pubSocket.close();
    }
}
exports.Area = Area;
;
