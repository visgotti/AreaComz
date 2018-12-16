const zmq = require('zeromq');

/*
    Router Socket which routes messages
    from a channel to an area
 */
module.exports = class Broker {
    /**
     * @param {string} RouterURI - URI string for the router to listen on
     * @param {int} gameId - Unique identifier of the game the router is used for.
     */
    constructor(RouterURI, gameId) {
        this.routerSocket = zmq.socket("router");
        this.routerSocket.identity = "areaRouter" + gameId;
        this.routerSocket.bindSync(RouterURI);
        this.registerRouterMessages();

    }

    registerRouterMessages() {
        this.routerSocket.on('message', (...args) => {
            this.routerSocket.send([args[1], '', args[3]]);
        })
    }

    close() {
        this.routerSocket.close();
    }
};