import * as assert from 'assert';
import * as mocha from 'mocha'
import * as fs from 'fs';
import * as path from 'path';

import { Area } from '../src/core/Area';
import { Connector } from '../src/core/Connector';
import { Broker } from '../src/core/Broker';

import { ChannelClient } from '../src/core/ChannelClient';
import { Channel } from '../src/core/Channel';

describe('ChannelClient', function() {
    const gameId = 1;
    let Area: Area;
    let Connector: Connector;
    let config: any;
    let brokerURI: string;
    let areaURI: Array<string> = [];
    let broker: Broker;

    before('Initialize and start 1 area, 1 connector, and the broker.', (done) => {
        config = fs.readFileSync(path.resolve('test', 'testConfig.json'));
        config = JSON.parse(config);
        areaURI = config.areas[0].URI;
        brokerURI = config.broker.URI;
        Area = new Area(areaURI, brokerURI, 0, gameId);
        Connector = new Connector(brokerURI, [config.areas[0]], gameId);
        broker = new Broker(config.broker.URI, gameId);
        done();
    });

    it('Adds a channelClient object to client upon adding to Connector', function(done) {
        let mockClient = {};
        let mockSessionId = 123;
        Connector.addClient(mockClient, mockSessionId);
        assert.strictEqual(mockClient.hasOwnProperty("channelClient"), true);
    });

    it('Throws an error if no sessionId is passed into addClient', function(done) {
        let mockClient = {};
        let mockSessionId = 123;
        Connector.addClient(mockClient, mockSessionId);
        assert.strictEqual(mockClient.hasOwnProperty("channelClient"), true);
    });

});