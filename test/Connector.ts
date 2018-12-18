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
        brokerURI = config.broker.URI;
        area0 = new Area( config.areas[0].URI, brokerURI, 0, gameId);
        area1 = new Area( config.areas[1].URI, brokerURI, 1, gameId);
        connector = new Connector(brokerURI, [config.areas[0], config.areas[1]], gameId);
       // console.log('initialized area and connector...', area, connector);
        broker = new Broker(config.broker.URI, gameId);
        done();
    });

    it('connector.initializeClientChannel succesfully creates a channelClient', function(done) {
        let mockSessionId = "foo";
        let clientChannel: ChannelClient;
        clientChannel = connector.initializeClientChannel(mockSessionId, area0.areaIndex);
        assert.strictEqual((clientChannel !== null), true);
        done();
    });
    it('connector.initializeClientChannel throws an error if invalid areaIndex is passed in', function(done) {
        let mockSessionId = "foo1";
        assert.throws(function() { connector.initializeClientChannel(mockSessionId, area0.areaIndex + 999); }, Error);
        done();
    });
    it('connector.initializeClientChannel throws an error if we try and initialize the same client twice', function(done) {
        let mockSessionId = "foo2";
        assert.doesNotThrow(function() { connector.initializeClientChannel(mockSessionId, area0.areaIndex) });
        assert.throws(function() { connector.initializeClientChannel(mockSessionId, area0.areaIndex); }, Error);
        done();
    });
    it('connector.changeClientArea succesfully changes the channel of a session', function(done) {
        let mockSessionId = "foo3";
        let clientChannel: ChannelClient;
        clientChannel = connector.initializeClientChannel(mockSessionId, area0.areaIndex);
        let old_id = clientChannel.getCurrentAreaId();
        assert.strictEqual(old_id, area0.areaId);
        clientChannel = connector.changeClientArea(mockSessionId, area1.areaIndex);
        let new_id = clientChannel.getCurrentAreaId();
        assert.notStrictEqual(new_id, old_id);
        assert.strictEqual(new_id, area1.areaId);
        done();
    })
});