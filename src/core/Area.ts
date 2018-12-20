import * as zmq from 'zeromq';

import { getAreaId } from './../helpers/getAreaId';
import { CONNECTOR_REQUEST_CODES, LEAVE_AREA_CODE_LOOKUP, AREA_RESPONSE_CODES } from './../index';

export class Area {
    private dealerSocket: any = {};
    private pubSocket: any = {};
    public areaId: string;
    public areaIndex: number;
    private messageHandlers: Map<string, (data: any) => void>;

    /**
     * @param URI - URI string the area listens on
     * @param areaIndex
     * @param brokerURI
     * @param gameId - Unique identifier of the game the areaRouter is used for.
     */
    constructor(URI, routerBrokerURI, areaIndex, gameId) {
        this.dealerSocket = zmq.socket('dealer');

        this.areaIndex = areaIndex;

        this.areaId = getAreaId(areaIndex, gameId);

        this.dealerSocket.identity = this.areaId;

        this.dealerSocket.connect(routerBrokerURI);
        console.log('connecting dealer in area with area id of', this.areaId);

        this.registerRequestHandlers();

        this.pubSocket = zmq.socket('pub');
        this.pubSocket.bind(URI);
    }

    // todo: all these functions meant to be overridden should probably be events
    public onChannelMessage(data: any) {}

    /**
     * Called when a request to connect is made,
     * whatever it returns will be sent as data
     * to the connector who made the request.
     * @param uid - Unique identifier of the client connecting.
     * @param data - any data that the connector passed along with the connect request.
     * @returns {any} Return value will be sent back as the data param to the connector's connectionSuccess
     */
    public onClientConnect(uid: string, data?: any) : any {}

    public broadcast(data) {
        const encoded = JSON.stringify(data);
        this.pubSocket.send([this.areaId, encoded]);
    }

    private registerRequestHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const message = JSON.parse(args[1]);
                switch(message.type) {
                    case CONNECTOR_REQUEST_CODES.CLIENT_CONNECT:
                        const data = this.onClientConnect(message.uid, message.data);
                        this.sendConnectionSuccess(message.from, message.uid, data);
                        break;
                    case CONNECTOR_REQUEST_CODES.CLIENT_DISCONNECT:
                        break;
                    case CONNECTOR_REQUEST_CODES.DATA:
                        this.onChannelMessage(message.data);
                        break;
                    default:
                        throw new Error('Invalid message type was sent to area server.')
                }
            }
        });
    }

    private sendConnectionSuccess(connectorId, uid, data?: any) {
        const message : any = {
            uid,
            type: AREA_RESPONSE_CODES.CONNECT_SUCCESS,
            areaIndex: this.areaIndex,
        };

        if(data) {
            message.data = data;
        }

        this.sendResponse(connectorId, message);
    }

    private sendResponse(connectorId, message) {
        message = JSON.stringify(message);
        this.dealerSocket.send([ connectorId, '', message])
    }

    public close() {
        this.dealerSocket.close();
        this.pubSocket.close();
    }
};
