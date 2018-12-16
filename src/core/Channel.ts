
import { getAreaId } from './../helpers/getAreaId';

export class Channel {
    private dealerSocket: any;
    private clients: Array<any>;
    private pendingStates: Map<string, any>;
    public areaId: string;
    public areaIndex: number;

    constructor(dealerSocket: any, areaIndex: number, gameId: number) {
        this.dealerSocket = dealerSocket;
        this.areaId = getAreaId(areaIndex, gameId);
        this.areaIndex = areaIndex;
        this.clients = [];
        this.pendingStates = new Map();
    }

    public onAreaMessage(message) {}

    public addClient(client) {
        this.clients.push(client);
    }

    // TODO clean area change vs. unnatural removal/disconnection and must notify area serve
    public removeClient(sessionId) {
        this.clients = this.clients.filter((_client) => {
            return _client.sessionId !== sessionId
        });
        if(this.pendingStates.hasOwnProperty(sessionId)) {
            delete this.pendingStates[sessionId];
        }
    }

    // this overrides any past state for the session as newest.
    public updateClientStates(sessionId, data) {
        if(!(sessionId in this.pendingStates)) {
            this.pendingStates[sessionId] = [];
        }
        this.pendingStates[sessionId] = data;
    }

    // use this if you dont want to wait to relay
    // states in batched intervals
    public relayClientState(sessionId, data) {
        const serialized = JSON.stringify({ sessionId, data });
        this.dealerSocket.send([ this.areaId, '', serialized])
    }

    public sendMessage(message) {
        const serialized = JSON.stringify(message);
        this.dealerSocket.send([ this.areaId, '', serialized]);
    }

    // this is when you want the area server
    // to start processing client state.
    public sendClientStates() {
        const serialized = JSON.stringify(this.pendingStates);
        this.dealerSocket.send([this.areaId, '', serialized])
    }
};