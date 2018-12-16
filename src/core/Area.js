const zmq = require('zeromq');

const getAreaId = require('./../helpers/getAreaId');

module.exports = class Area {
    /**
     * @param URI - URI string the area listens on
     * @param areaIndex
     * @param brokerURI
     * @param gameId - Unique identifier of the game the areaRouter is used for.
     */
    constructor(URI, brokerURI, areaIndex, gameId) {
        this.dealerSocket = zmq.socket("dealer");
        this.areaIndex = areaIndex;
        this.areaId = getAreaId(areaIndex, gameId);
        this.dealerSocket.identity = this.areaId;
        this.dealerSocket.connect(brokerURI);
        this.registerMessageHandlers();

        this.pubSocket = zmq.socket("pub");
        this.pubSocket.bind(URI);
    }

    broadcast(data) {
        var encoded = JSON.stringify(data);
        this.pubSocket.send([this.areaId, encoded])
    }

    registerMessageHandlers() {
        this.dealerSocket.on('message', (...args) => {
            if(args[1]) {
                console.log('received', args[1].toString(), 'in the area server.', this.areaId);

                // HERE IS WHERE YOU WOULD PROCESS THE CLIENT INPUT

            }
        })
    }

    close() {
        this.dealerSocket.close();
        this.pubSocket.close();
    }
};


function random(low, high) {
    return Math.random() * (high - low) + low
}