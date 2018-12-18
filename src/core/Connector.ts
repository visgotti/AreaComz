import * as zmq from 'zeromq';

import { Channel } from './Channel';
import {ChannelClient} from './ChannelClient';

import { LEAVE_AREA_CODE_LOOKUP } from './../index';

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
        return this.channelMap.get(areaId);
    }

    public changeClientArea(sessionId, newAreaIndex) : ChannelClient {
        let channelClient = this._getChannelClient(sessionId);
        if(channelClient) {
            const channel = channelClient.getCurrentChannel();

            if(channel.areaIndex === newAreaIndex) return null;

            channel.removeClient(sessionId);

            this._deleteChanelClient(sessionId);

            return this.initializeClientChannel(sessionId, newAreaIndex);
        }
        return null;
    }

    public disconnectClient(sessionId) {
        const channelClient = this._getChannelClient(sessionId);
        if(channelClient) {
            const channel = channelClient.getCurrentChannel();
            channel.removeClient(sessionId, LEAVE_AREA_CODE_LOOKUP.CONNECTION_LOST);
        }
        this.sessionIdMap.delete(sessionId);
    }

    //TODO refactor to return a promise and maybe change the function name to connect
    public initializeClientChannel(sessionId, areaIndex) : ChannelClient {
        let channelClient: ChannelClient;

        channelClient = this._getChannelClient(sessionId);

        if (channelClient !== null) throw new Error('Client is already initialized, use changeClientArea if you are trying to change areas.');

        if (this.channels[areaIndex]) {
            this._addSessionIdToMap(sessionId);
            channelClient = this.channels[areaIndex].addClient(sessionId);
            const session = this.sessionIdMap.get(sessionId);
            session.channelClient = channelClient;
            return channelClient;
        } else {
            console.log('throwing');
            throw new Error('The area index you passed in does not have a channel.');
        }
    }

    public sendChannelStates() {
        for (let i = 0; i < this.channels.length; i += 1) {
            this.channels[i].sendClientStates();
        }
    }

    public close() {
        this.dealerSocket.close();
        this.subscriberSocket.close();
    }

    private handleReceivedMessage(areaId: string, message: any) {
        message = JSON.parse(message);
        areaId = areaId.toString();
        this.onAreaMessage(areaId, message);
        this.channelMap.get(areaId).onAreaMessage(message);
    }

    private createChannels(areasData: Array<any>) {
        for (let i = 0; i < areasData.length; i += 1) {
            const channel = new Channel(this.dealerSocket, i, this.gameId);
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
            this.handleReceivedMessage(areaId, message)
        });
    }

    private _addSessionIdToMap(sessionId) : any {
        this.sessionIdMap.set(sessionId, {
            sessionId
        });

        return this.sessionIdMap.get(sessionId);
    }

    private _deleteChanelClient(sessionId) {
        const session = this.sessionIdMap.get(sessionId);
        if(session) {
            delete session.channelClient;
        }
    }

    private _getChannelClient(sessionId) : ChannelClient {
        const session = this.sessionIdMap.get(sessionId);
        if(session) {
            const channelClient = session.channelClient;
            if(channelClient) {
                return channelClient;
            }
        }
        return null;
    }
};
