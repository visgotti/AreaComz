export declare class Area {
    private dealerSocket;
    private pubSocket;
    areaId: string;
    areaIndex: number;
    private messageHandlers;
    /**
     * @param URI - URI string the area listens on
     * @param areaIndex
     * @param brokerURI
     * @param gameId - Unique identifier of the game the areaRouter is used for.
     */
    constructor(URI: any, routerBrokerURI: any, areaIndex: any, gameId: any);
    onChannelMessage(data: any): void;
    /**
     * Called when a request to connect is made,
     * whatever it returns will be sent as data
     * to the connector who made the request.
     * @param uid - Unique identifier of the client connecting.
     * @param data - any data that the connector passed along with the connect request.
     * @returns {any} Return value will be sent back as the data param to the connector's connectionSuccess
     */
    onClientConnect(uid: string, data?: any): any;
    broadcast(data: any): void;
    private registerRequestHandlers;
    private sendConnectionSuccess;
    private sendResponse;
    close(): void;
}
