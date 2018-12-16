export declare class Connector {
    private dealerSocket;
    private subscriberSocket;
    private channels;
    private channelMap;
    private sessionIdMap;
    gameId: number;
    constructor(brokerURI: string, areasData: Array<any>, gameId: number);
    onAreaMessage(areaId: string, message: any): void;
    getChannel(areaId: any): any;
    close(): void;
    private handleReceivedMessage;
    private createChannels;
    private changeArea;
    addClient(client: any, areaIndex: any): void;
    sendChannelStates(): void;
}
