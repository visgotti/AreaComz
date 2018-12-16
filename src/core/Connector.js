const zmq = require('zeromq');
const Channel = require('./Channel');
module.exports = class Connector {
    constructor(brokerURI, areasData, gameId) {

        this.dealerSocket = zmq.socket("dealer");
        this.dealerSocket.connect(brokerURI);

        this.subscriberSocket = zmq.socket("sub");

        this.channels = [];
        this.channelMap = {};

        this.gameId = gameId;
        this.sessionIdMap = {};

        this.createChannels(areasData);

        console.log("Created channel on pid...", process.pid);
    }

    createChannels(areasData) {
        for(let i = 0; i < areasData.length; i++) {

            const channel = new Channel(this.dealerSocket, i, this.gameId);
            this.channels.push(channel);
            this.channelMap[channel.areaId] = channel;
            // connect to the area server's publisher uri
            this.subscriberSocket.connect(areasData[i].URI);

            // subscribe to handle messages for area index.
            this.subscriberSocket.subscribe(channel.areaId);
        }

        this.subscriberSocket.on('message', (...args) => {
            const areaId = args[0];
            console.log('Received state update from area server:', areaId);
            const data = JSON.parse(args[1]);
            this.channelMap[areaId].onStateUpdate(data);
        })
    }

    changeArea(sessionId, newAreaIndex) {
        if(sessionId in this.sessionIdMap && this.sessionIdMap[sessionId].areaIndex !== newAreaIndex) {
            this.sessionIdMap[sessionId].areaIndex = newAreaIndex;
            this.channels[newAreaIndex].removeClient(sessionId);
            this.channels[newAreaIndex].addClient(this.sessionIdMap[sessionId].client);
        }
    }

    addClient(client, areaIndex) {
        this.sessionIdMap[client.sessionId] = {
            client,
            areaIndex: areaIndex,
        };
        if(this.channels[areaIndex]) {
            this.channels[areaIndex].addClient(client);
        }
    }

    sendChannelData() {
        for(let i = 0; i < this.channels.length; i++) {
            this.channels[i].sendClientData();
        }
    }

    close() {
        this.dealerSocket.close();
        this.subscriberSocket.close();
    }
};


function random(low, high) {
    return Math.random() * (high - low) + low
}