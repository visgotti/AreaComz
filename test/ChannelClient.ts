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

    it('channelConnector.onConfirmedConnection succesfully gets called after initialization with no data from Area response.', function(done) {
        let mockUid = 'foo';
        let clientChannel: ChannelClient;
        clientChannel = connector.initializeChannelClient(mockUid);

        connector.connectClientToArea(mockUid, area0.areaIndex);

        clientChannel.onConfirmedConnection = ((areaIndex, data) => {
            assert.strictEqual(areaIndex, area0.areaIndex);
            assert.strictEqual(data, undefined);
            done();
        });
    });

    it('channelConnector.onConfirmedConnection succesfully gets called after initialization with data from Area response.', function(done) {
        let mockUid = 'foo1';

        let expectedResponse = 'bar';

        let clientChannel: ChannelClient;
        clientChannel = connector.initializeChannelClient(mockUid);

        connector.connectClientToArea(mockUid, area0.areaIndex);

        area0.onClientConnect = (uid, data) => {
            return expectedResponse
        };

        clientChannel.onConfirmedConnection = ((areaIndex, data) => {
            assert.strictEqual(areaIndex, area0.areaIndex);
            assert.strictEqual(data, expectedResponse);
            done();
        });
    });

    it('channelConnector.onConfirmedConnection succesfully gets called when changing areas', function(done) {
        let mockUid = 'foo2';

        let areaCalls = 0;
        let channelConnectorCalls = 0;

        let clientChannel: ChannelClient;
        clientChannel = connector.initializeChannelClient(mockUid);
        connector.connectClientToArea(mockUid, area0.areaIndex);

        area0.onClientConnect = (uid, data) => {
            areaCalls++;
            return area0.areaId;
        };

        area1.onClientConnect = (uid, data) => {
            areaCalls++;
            return area1.areaId;
        };

        clientChannel.onConfirmedConnection = ((areaIndex, data) => {
            channelConnectorCalls++;
            if(channelConnectorCalls === 1) {
                assert.strictEqual(areaIndex, area0.areaIndex);
                assert.strictEqual(data, area0.areaId);
                // connect to other area after first
                connector.connectClientToArea(mockUid, area1.areaIndex);
            }
            if(channelConnectorCalls === 2) {
                assert.strictEqual(areaIndex, area1.areaIndex);
                assert.strictEqual(data, area1.areaId);
                assert.strictEqual(areaCalls, 2);
                done();
            }
        });
    });
});