export declare class Channel {
    private dealerSocket;
    private clients;
    private pendingStates;
    areaId: string;
    areaIndex: number;
    constructor(dealerSocket: any, areaIndex: number, gameId: number);
    onAreaMessage(message: any): void;
    addClient(client: any): void;
    removeClient(sessionId: any): void;
    updateClientStates(sessionId: any, data: any): void;
    relayClientState(sessionId: any, data: any): void;
    sendMessage(message: any): void;
    sendClientStates(): void;
}
