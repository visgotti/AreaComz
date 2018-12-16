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
        //   this.messageHandlers["message"] = (() => {});
        this.registerMessageHandlers();
        this.pubSocket = zmq.socket('pub');
        this.pubSocket.bind(URI);
        console.log("Area ", this.areaId, 'pub socket is listening on..', URI);
    }
    /*
    public removeMessageHandler(type) {
        if(this.messageHandlers[type]) {
            delete this.messageHandlers[type];
        }
    }
    */
    /*
    public on(type: string, callback: (data: any, err?) => void) {
        if(type !== "message") throw 'Only available message type is "message"';
        this.messageHandlers[type] = callback;
    }*/
    onChannelMessage(message) { }
    broadcast(data) {
        console.log('the pubsocket was', this.pubSocket);
        const encoded = JSON.stringify(data);
        this.pubSocket.send([this.areaId, encoded]);
    }
    close() {
        this.dealerSocket.close();
        this.pubSocket.close();
    }
    handleChannelMessage(message) {
        message = JSON.parse(message);
        this.onChannelMessage(message);
    }
    registerMessageHandlers() {
        console.log("Area ", this.areaId, 'dealer socket is listening...');
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                this.handleChannelMessage(args[1]);
            }
        });
    }
}
exports.Area = Area;
;
