import * as zmq from 'zeromq';

import { Channel } from './Channel';
import { ChannelClient } from './ChannelClient';

import {LEAVE_AREA_CODE_LOOKUP, AREA_RESPONSE_CODES} from './../index';

export class Connector {
    private dealerSocket: any = {};
    private subscriberSocket: any = {};
    private channelMap: Map<string, Channel>;
    private uidChannelClientMap: Map<string, ChannelClient>;
    private awaitingConnectionCallbacks: Map<string, Function>;

    public channels: Array<Channel> = [];
    public gameId: number;

    constructor(brokerRouterURI: string, areasData: Array<any>, connectorIndex: number, gameId: number) {

        this.dealerSocket = zmq.socket('dealer');
        this.dealerSocket.identity = "connector-" + connectorIndex + '-' + gameId;
        this.dealerSocket.connect(brokerRouterURI);

        this.subscriberSocket = zmq.socket('sub');

        this.channels = [];
        this.channelMap = new Map();

        this.gameId = gameId;
        this.uidChannelClientMap = new Map();

        this.awaitingConnectionCallbacks = new Map();

        this.createChannels(areasData);
        this.registerResponseHandlers();
    }

    public onAreaMessage(areaIndex: string, message: any){}

    public getChannel(areaId) {
        return this.channelMap.get(areaId);
    }

    public disconnectClient(uid) {
        const channelClient = this._getChannelClient(uid);
        if(channelClient) {
            for(let i = 0; i < channelClient.channels.length; i++) {
                channelClient.channels[i].removeClient(uid, LEAVE_AREA_CODE_LOOKUP.CONNECTION_LOST)
            }
        }
        this.uidChannelClientMap.delete(uid);
    }

    /**
     * Creates channel client
     * @param uid
     * @returns {ChannelClient}
     */
    public initializeChannelClient(uid) : ChannelClient {
        let channelClient: ChannelClient;
        channelClient = this._getChannelClient(uid);
        console.log('the channel client was', channelClient);
        if(channelClient !== null)  throw new Error('Client is already initialized.');
        channelClient = new ChannelClient(uid);
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
    public connectClientToArea(uid, areaIndex, data?: any) {
        const channel = this.channels[areaIndex];

        if(!(channel)) throw new Error('Area index passed into connectClientToArea does not exist.');

        const channelClient = this._getChannelClient(uid);
        if(channelClient === null) throw new Error('Initialize channelClient for uid before trying to connect');

        if(channelClient.isInArea(areaIndex)) throw new Error('Client is already in this area');

        channel.addClient(channelClient, data);

        // if we uid is still in awaiting connections after 5 seconds throw error
        //todo make timeout configurable
        setTimeout(() => {
            if(this.awaitingConnectionCallbacks.has(uid)) {
                this.awaitingConnectionCallbacks.delete(uid);
                channelClient.onFailedConnection(0);
            }
        }, 5000);

        // set the callback for uid, this will then get called
        // from the response handler.
        this.awaitingConnectionCallbacks.set(uid, (areaIndex, data) => {
            channelClient.onConfirmedConnection(areaIndex, data)
        });
    }

    public removeClientFromArea(uid, areaIndex, data?: any) {
        const channel = this.channels[areaIndex];

        if(!(channel)) throw new Error('Area index passed into connectClientToArea does not exist.');

        const channelClient = this._getChannelClient(uid);

        channelClient.channels = channelClient.channels.filter(channel => {
            if(channel.areaIndex === areaIndex) {
                channel.removeClient(uid);
                return false;
            }
            return true;
        });
        channel.removeClient(uid);
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

    private handleReceivedMessage(message: any) {
        message = JSON.parse(message);
        const areaIndex = message.areaIndex;
        const data = message.data;
        this.onAreaMessage(areaIndex, data);
        this.channels[areaIndex].onAreaMessage(areaIndex, data);
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
            this.handleReceivedMessage(message);
        });
    }

    private registerResponseHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if (args[1]) {
                const message = JSON.parse(args[1]);
                switch(message.type) {
                    case AREA_RESPONSE_CODES.CONNECT_SUCCESS:
                        //running clientChannel's onConfirmedConnection
                        const callback = this.awaitingConnectionCallbacks.get(message.uid);
                        if(callback) callback(message.areaIndex, message.data);
                        break;
                    default:
                        throw new Error('Invalid message type was sent to area server.')
                }
            }
        });
    }

    private _addUidToMap(uid, channelClient: ChannelClient) : any {
        this.uidChannelClientMap.set(uid, channelClient);
        return this.uidChannelClientMap.get(uid);
    }

    private _deleteChanelClient(uid) {
        if(this.uidChannelClientMap.has(uid)) {
            this.uidChannelClientMap.delete(uid);
        }
    }

    private _getChannelClient(uid) : ChannelClient {
        if(this.uidChannelClientMap.has(uid)) {
            return this.uidChannelClientMap.get(uid);
        }
        return null;
    }
};
