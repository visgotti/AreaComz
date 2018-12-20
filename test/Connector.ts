import * as assert from 'assert';
import * as mocha from 'mocha'
import * as fs from 'fs';
import * as path from 'path';

import { ChannelClient } from '../src/core/ChannelClient';
import { Area } from '../src/core/Area';
import { Connector } from '../src/core/Connector';
import { Broker } from '../src/core/Broker';

describe('Connector', function() {
    const gameId = 1;
    let area0: Area;
    let area1: Area;
    let connector: Connector;
    let config: any;
    let brokerURI: string;
    let areaURI: string;
    let broker: Broker;

    before('Initialize and start 1 area, 1 connector, and the broker.', (done) => {
        config = fs.readFileSync(path.resolve('test', 'testConfig.json'));
        config = JSON.parse(config);
        brokerURI = config.broker.ROUTER_URI;

        console.log('router Broker URI was', brokerURI);
        console.log('the area 0 uri was',  config.areas[0].URI);
        console.log('the area 1 uri was', config.areas[1].URI);

        area0 = new Area( config.areas[0].URI, brokerURI, 0, gameId);
        area1 = new Area( config.areas[1].URI, brokerURI, 1, gameId);
        connector = new Connector(brokerURI, [config.areas[0], config.areas[1]], 0, gameId);
       // console.log('initialized area and connector...', area, connector);
        broker = new Broker(brokerURI, gameId);
        setTimeout(() => {
            done();
        }, 500)
    });

    after((done) => {
        area0.close();
        area1.close();
        connector.close();
        broker.close();
        done();
    });

    it('connector.initializeClientChannel succesfully creates a channelClient right away', function(done) {
        let mockSessionId = "foo";
        let clientChannel: ChannelClient;
        clientChannel = connector.initializeChannelClient(mockSessionId);
        assert.strictEqual((clientChannel !== null && clientChannel !== undefined), true);
        done();
    });

    it('connector.initializeClientChannel throws an error if we try and initialize the same client twice', function(done) {
        let mockSessionId = "foo2";
        assert.doesNotThrow(function() { connector.initializeChannelClient(mockSessionId) });
        assert.throws(function() { connector.initializeChannelClient(mockSessionId); }, Error);
        done();
    });
    it('connector.connectClientToArea succesfully adds channel to channelClient and channelClient to channel', function(done) {
        let mockSessionId = "foo3";
        let clientChannel: ChannelClient;
        clientChannel = connector.initializeChannelClient(mockSessionId);
        let ids = clientChannel.getCurrentAreaIds();
        assert.strictEqual(ids.length, 0);
        connector.connectClientToArea(mockSessionId, area0.areaIndex);

        const channel = clientChannel.channels[0];
        assert.strictEqual(channel.hasClient(mockSessionId), true);

        ids =  clientChannel.getCurrentAreaIds();
        assert.strictEqual(ids.length, 1);
        assert.strictEqual(ids[0], area0.areaId);
        done();
    });
    it('connector.connectClientToArea throws an error if you add to channel twice', function(done) {
        let mockSessionId = "foo4";
        let clientChannel: ChannelClient;
        clientChannel = connector.initializeChannelClient(mockSessionId);
        let ids = clientChannel.getCurrentAreaIds();
        assert.doesNotThrow(function() { connector.connectClientToArea(mockSessionId, area0.areaIndex); });
        assert.throws(function() { connector.connectClientToArea(mockSessionId, area0.areaIndex); });
        done();
    });
    it('connector.connectClientToArea succesfully removes channel from channelClient and channelClient from channel', function(done) {
        let mockSessionId = "foo5";
        let clientChannel: ChannelClient;
        clientChannel = connector.initializeChannelClient(mockSessionId);
        connector.connectClientToArea(mockSessionId, area0.areaIndex);
        const channel = clientChannel.channels[0];
        connector.removeClientFromArea(mockSessionId, area0.areaIndex);

        assert.strictEqual(channel.hasClient(mockSessionId), false);

        let ids =  clientChannel.getCurrentAreaIds();
        assert.strictEqual(ids.length, 0);
        done();
    });
    it('connector.connectClientToArea succesfully adds two channels to channelClient', function(done) {
        let mockSessionId = "foo7";
        let clientChannel: ChannelClient;
        clientChannel = connector.initializeChannelClient(mockSessionId);
        connector.connectClientToArea(mockSessionId, area0.areaIndex);
        connector.connectClientToArea(mockSessionId, area1.areaIndex);

        let ids =  clientChannel.getCurrentAreaIds();
        assert.strictEqual(ids.length, 2);
        assert.strictEqual(ids[0], area0.areaId);
        assert.strictEqual(ids[1], area1.areaId);

        done();
    });
});