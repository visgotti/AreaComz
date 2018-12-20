import * as zmq from 'zeromq';

/*
    Router Socket which routes messages
    from a channel to an area
 */
export class Broker {
    private routerSocket: any = {};
    /**
     * @param {string} routerURI - URI string for the brokers router
     * @param {int} gameId - Unique identifier of the game the router is used for.
     */
    constructor(routerURI, gameId) {
        console.log('RECONSTRUCTING...');
        this.routerSocket = zmq.socket('router');
        this.routerSocket.identity = `areaRouter ${gameId} `;
        this.routerSocket.bindSync(routerURI);
        this.registerRouterMessages();
    }

    private registerRouterMessages() {
        // handle message from connector server
        this.routerSocket.on('message', (...args) => {
            console.log('forward message', args[3].toString());
            console.log('to ', args[1].toString());
            this.routerSocket.send([args[1], '', args[3]]);
        });
    }

    public close() {
        this.routerSocket.close();
    }
};
