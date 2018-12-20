"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
const getAreaId_1 = require("./../helpers/getAreaId");
const index_1 = require("./../index");
class Area {
    /**
     * @param URI - URI string the area listens on
     * @param areaIndex
     * @param brokerURI
     * @param gameId - Unique identifier of the game the areaRouter is used for.
     */
    constructor(URI, routerBrokerURI, areaIndex, gameId) {
        this.dealerSocket = {};
        this.pubSocket = {};
        this.dealerSocket = zmq.socket('dealer');
        this.areaIndex = areaIndex;
        this.areaId = getAreaId_1.getAreaId(areaIndex, gameId);
        this.dealerSocket.identity = this.areaId;
        this.dealerSocket.connect(routerBrokerURI);
        console.log('connecting dealer in area with area id of', this.areaId);
        this.registerRequestHandlers();
        this.pubSocket = zmq.socket('pub');
        this.pubSocket.bind(URI);
    }
    // todo: all these functions meant to be overridden should probably be events
    onChannelMessage(data) { }
    /**
     * Called when a request to connect is made,
     * whatever it returns will be sent as data
     * to the connector who made the request.
     * @param uid - Unique identifier of the client connecting.
     * @param data - any data that the connector passed along with the connect request.
     * @returns {any} Return value will be sent back as the data param to the connector's connectionSuccess
     */
    onClientConnect(uid, data) { }
    broadcast(data) {
        const encoded = JSON.stringify(data);
        this.pubSocket.send([this.areaId, encoded]);
    }
    registerRequestHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const message = JSON.parse(args[1]);
                switch (message.type) {
                    case index_1.CONNECTOR_REQUEST_CODES.CLIENT_CONNECT:
                        const data = this.onClientConnect(message.uid, message.data);
                        this.sendConnectionSuccess(message.from, message.uid, data);
                        break;
                    case index_1.CONNECTOR_REQUEST_CODES.CLIENT_DISCONNECT:
                        break;
                    case index_1.CONNECTOR_REQUEST_CODES.DATA:
                        this.onChannelMessage(message.data);
                        break;
                    default:
                        throw new Error('Invalid message type was sent to area server.');
                }
            }
        });
    }
    sendConnectionSuccess(connectorId, uid, data) {
        const message = {
            uid,
            type: index_1.AREA_RESPONSE_CODES.CONNECT_SUCCESS,
            areaIndex: this.areaIndex,
        };
        if (data) {
            message.data = data;
        }
        this.sendResponse(connectorId, message);
    }
    sendResponse(connectorId, message) {
        message = JSON.stringify(message);
        this.dealerSocket.send([connectorId, '', message]);
    }
    close() {
        this.dealerSocket.close();
        this.pubSocket.close();
    }
}
exports.Area = Area;
;
