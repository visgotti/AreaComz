import * as assert from 'assert';
import * as mocha from 'mocha'
import * as fs from 'fs';
import * as path from 'path';

import { Area } from '../src/core/Area';
import { Connector } from '../src/core/Connector';
import { Broker } from '../src/core/Broker';

describe('Channel <--> Area Communication', function() {
    const gameId = 1;
    let areas: Array<Area> = [];
    let connectors: Array<Connector> = [];
    let config: any;
    let brokerURI: string;
    let areaURIs: Array<string> = [];
    let broker: Broker;

    before('Channel > Area', (done) => {
         config = fs.readFileSync(path.resolve('test', 'testConfig.json'));
         config = JSON.parse(config);
         for(let i = 0; i < config.areas.length; i++) {
            areaURIs.push(config.areas[i].URI);
         }
         brokerURI = config.broker.URI;

         for(let i = 0; i < areaURIs.length; i++) {
             areas.push(new Area(areaURIs[i], brokerURI, i, gameId));
         }

         for(let i = 0; i < config.connectors.length; i++) {
             connectors.push(new Connector(brokerURI, config.areas, gameId));
         }

         broker = new Broker(config.broker.URI, gameId);

         done();
    });

    after((done) => {
        for(let i = 0; i < areas.length; i++) {
            areas[i].close();
        }
        for(let i = 0; i < connectors.length; i++) {
            connectors[i].close();
        }
        broker.close();
        done();
    });

    it('Area correctly receives the message from channel', function(done) {
        let area0 = areas[0];
        let receivedMessage = null;
        let sentMessage = "foo";
        area0.onChannelMessage = ((message) => {
            receivedMessage = message;
        });

        let Channel0 = connectors[0].getChannel(area0.areaId);

        Channel0.sendMessage(sentMessage);
        setTimeout(() => {
            assert.strictEqual(receivedMessage, sentMessage);
            done();
        }, 500);
    });

    it('Area correctly receives a message from each channel in each connector', function(done) {
        let receivedAreaCounts = {};

        for(let i = 0; i < areas.length; i++) {
            receivedAreaCounts[areas[i].areaId] = 0;
            areas[i].onChannelMessage = ((message) => {
                receivedAreaCounts[message]++;
            })
        }

        for(let i = 0; i < connectors.length; i++) {
            for(let j = 0; j < connectors[i].channels.length; j++) {
                let channel = connectors[i].channels[j];
                channel.sendMessage(channel.areaId);
            }
        }
        setTimeout(() => {
            let total = 0;
            Object.keys(receivedAreaCounts).forEach(key => {
                assert.strictEqual(receivedAreaCounts[key], connectors.length);
                total += receivedAreaCounts[key];
            });
            // total should be based on how many connectors we have and how many areas we have
            assert.strictEqual(total, areas.length * connectors.length);
            done();
        }, 500);
    });

    it('Correct channels receive message broadcasted from an area', function(done) {
        let area0 = areas[0];
        let area1 = areas[1];

        let messagesReceived = 0;

        let channel0s = connectors.map(connector => {
            return connector.getChannel(area0.areaId);
        });

        let channel1s = connectors.map(connector => {
            return connector.getChannel(area1.areaId);
        });

        // channel 0s onAreaMessage WILL be fired
        channel0s.forEach(channel => {
            channel.onAreaMessage = ((message) => {
                messagesReceived++;
                assert.strictEqual(message, area0.areaId);
            });
        });

        // channel1s onAreaMessage will NOT be fired
        channel1s.forEach(channel => {
            channel.onAreaMessage = ((message) => {
                messagesReceived++;
            });
        });

        area0.broadcast(area0.areaId);

        setTimeout(() => {
            // should only have received the message once for a channel in each connector
            assert.strictEqual(messagesReceived, connectors.length);
            done();
        }, 500);
    })
});