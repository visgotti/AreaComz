export declare class Broker {
    private routerSocket;
    /**
     * @param {string} routerURI - URI string for the brokers router
     * @param {int} gameId - Unique identifier of the game the router is used for.
     */
    constructor(routerURI: any, gameId: any);
    private registerRouterMessages;
    close(): void;
}
