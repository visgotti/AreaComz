import * as zmq from 'zeromq';

import { Channel } from './Channel';

export class Connector {
    private dealerSocket: any = {};
    private subscriberSocket: any = {};
    private channelMap: Map<string, Channel>;
    private sessionIdMap: Map<string, any>;

    public channels: Array<Channel> = [];
    public gameId: number;

    constructor(brokerURI: string, areasData: Array<any>, gameId: number) {

        this.dealerSocket = zmq.socket('dealer');
        this.dealerSocket.connect(brokerURI);

        this.subscriberSocket = zmq.socket('sub');

        this.channels = [];
        this.channelMap = new Map();

        this.gameId = gameId;
        this.sessionIdMap = new Map();

        this.createChannels(areasData);
    }

    public onAreaMessage(areaId: string, message: any){}

    public getChannel(areaId) {
        return this.channelMap[areaId];
    }

    public close() {
        this.dealerSocket.close();
        this.subscriberSocket.close();
    }

    private handleReceivedMessage(areaId: string, message: any) {

        message = JSON.parse(message);
        areaId = areaId.toString();
        this.onAreaMessage(areaId, message);
        this.channelMap[areaId].onAreaMessage(message);
    }

    private createChannels(areasData: Array<any>) {
        for (let i = 0; i < areasData.length; i += 1) {
            const channel = new Channel(this.dealerSocket, i, this.gameId);
            this.channels.push(channel);
            this.channelMap[channel.areaId] = channel;
            // connect to the area server's publisher uri
            this.subscriberSocket.connect(areasData[i].URI);
            // subscribe to handle messages for area index.
            this.subscriberSocket.subscribe(channel.areaId);
        }

        this.subscriberSocket.on('message', (...args) => {
            const message = args[1];
            const areaId = args[0];
            this.handleReceivedMessage(areaId, message)
        });
    }

    private changeArea(sessionId, newAreaIndex) {
        if (sessionId in this.sessionIdMap && this.sessionIdMap[sessionId].areaIndex !== newAreaIndex) {
            this.sessionIdMap[sessionId].areaIndex = newAreaIndex;
            this.channels[this.sessionIdMap[sessionId].areaIndex].removeClient(sessionId);
            this.channels[newAreaIndex].addClient(this.sessionIdMap[sessionId].client);
        }
    }

    public addClient(client, areaIndex) {
        this.sessionIdMap[client.sessionId] = {
            client,
            areaIndex,
        };
        if (this.channels[areaIndex]) {
            this.channels[areaIndex].addClient(client);
        }
    }

    public sendChannelStates() {
        for (let i = 0; i < this.channels.length; i += 1) {
            this.channels[i].sendClientStates();
        }
    }
};
