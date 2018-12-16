export declare class Broker {
    private routerSocket;
    /**
     * @param {string} RouterURI - URI string for the router to listen on
     * @param {int} gameId - Unique identifier of the game the router is used for.
     */
    constructor(RouterURI: any, gameId: any);
    private registerRouterMessages;
    close(): void;
}
