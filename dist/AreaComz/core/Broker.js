"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zmq = require("zeromq");
/*
    Router Socket which routes messages
    from a channel to an area
 */
class Broker {
    /**
     * @param {string} routerURI - URI string for the brokers router
     * @param {int} gameId - Unique identifier of the game the router is used for.
     */
    constructor(routerURI, gameId) {
        this.routerSocket = {};
        this.routerSocket = zmq.socket('router');
        this.routerSocket.identity = `areaRouter ${gameId} `;
        this.routerSocket.bindSync(routerURI);
        this.registerRouterMessages();
    }
    registerRouterMessages() {
        // handle message from connector server
        this.routerSocket.on('message', (...args) => {
            this.routerSocket.send([args[1], '', args[3]]);
        });
    }
    close() {
        this.routerSocket.close();
    }
}
exports.Broker = Broker;
;
