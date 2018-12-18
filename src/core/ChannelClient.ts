import { Channel } from './Channel';

export class ChannelClient {
    private channel: Channel;
    private sessionId: number;

    constructor(sessionId, channel) {
        this.sessionId = sessionId;
        this.channel = channel;
    }

    public updateState(state) {
        this.channel.updateClientState(this.sessionId, state);
    }

    public getCurrentState() {
        return this.channel.getCurrentState(this.sessionId);
    }

    public getCurrentAreaId() {
        return this.channel.areaId
    }

    public getCurrentAreaIndex() {
        return this.channel.areaIndex
    }

    public getCurrentChannel() {
        return this.channel;
    }
};
