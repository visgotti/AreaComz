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
    constructor(URI: any, brokerURI: any, areaIndex: any, gameId: any);
    onChannelMessage(message: any): void;
    broadcast(data: any): void;
    close(): void;
    private handleChannelMessage;
    private registerMessageHandlers;
}
