import { Channel } from './Channel';


export class ChannelClient {
    private state: any;
    public channels: Array<Channel>;
    public uid: string;

    constructor(uid) {
        this.uid = uid;
        this.state = {};
        this.channels = [];
    }

    public onConfirmedConnection(areaIndex: number, data?: any) {};

    public onFailedConnection(areaIndex: number, data?: any) {};

    public updateState(state) {
        this.state = state;
        for(let i = 0; i < this.channels.length; i++) {
            this.channels[i].updateClientState(this.uid, state);
        }
    }

    public isInArea(areaIndex) {
        for(let i = 0; i < this.channels.length; i++) {
            if(areaIndex === this.channels[i].areaIndex) {
                return true;
            }
        }
        return false;
    }

    public getCurrentState() {
        return this.state;
    }

    public getCurrentAreaIds() {
        return this.channels.map(channel => channel.areaId);
    }

    public getCurrentAreaIndexes() {
        return this.channels.map(channel => channel.areaIndex);
    }
};
