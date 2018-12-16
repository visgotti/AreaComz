import * as zmq from 'zeromq';

import { getAreaId } from './../helpers/getAreaId';

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
    constructor(URI, brokerURI, areaIndex, gameId) {
        this.dealerSocket = zmq.socket('dealer');

        this.areaIndex = areaIndex;

        this.areaId = getAreaId(areaIndex, gameId);

        this.dealerSocket.identity = this.areaId;

        this.dealerSocket.connect(brokerURI);

        this.registerMessageHandlers();

        this.pubSocket = zmq.socket('pub');
        this.pubSocket.bind(URI);
    }

    public onChannelMessage(message: any) {}

    public broadcast(data) {
        const encoded = JSON.stringify(data);
        this.pubSocket.send([this.areaId, encoded]);
    }

    public close() {
        this.dealerSocket.close();
        this.pubSocket.close();
    }

    private handleChannelMessage(message: any) {
        message = JSON.parse(message);
        this.onChannelMessage(message);
    }

    private registerMessageHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                this.handleChannelMessage(args[1]);
            }
        });
    }
};
