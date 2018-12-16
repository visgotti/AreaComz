import * as assert from 'assert';
import * as mocha from 'mocha'
import * as fs from 'fs';
import * as path from 'path';

import { Area } from '../src/core/Area';
import { Connector } from '../src/core/Connector';
import { Broker } from '../src/core/Broker';

describe('Channel <--> Area Communication', function() {
    const gameId = 1;
    let Areas: Array<Area> = [];
    let Connectors: Array<Connector> = [];
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
            Areas.push(new Area(areaURIs[i], brokerURI, i, gameId));
         }

         for(let i = 0; i < config.connectors.length; i++) {
            Connectors.push(new Connector(brokerURI, config.areas, gameId));
         }

         broker = new Broker(config.broker.URI, gameId);

         done();
    });

    it('Area correctly receives the message from channel', function(done) {
        let Area0 = Areas[0];
        let receivedMessage = null;
        let sentMessage = "foo";
        Area0.onChannelMessage = ((message) => {
            receivedMessage = message;
        });

        let Channel0 = Connectors[0].getChannel(Area0.areaId);

        Channel0.sendMessage(sentMessage);
        setTimeout(() => {
            assert.strictEqual(receivedMessage, sentMessage);
            done();
        }, 500);
    });

    it('Area correctly receives a message from each channel in each connector', function(done) {
        let receivedAreaCounts = {};

        for(let i = 0; i < Areas.length; i++) {
            receivedAreaCounts[Areas[i].areaId] = 0;
            Areas[i].onChannelMessage = ((message) => {
                receivedAreaCounts[message]++;
            })
        }

        for(let i = 0; i < Connectors.length; i++) {
            for(let j = 0; j < Connectors[i].channels.length; j++) {
                let channel = Connectors[i].channels[j];
                channel.sendMessage(channel.areaId);
            }
        }
        setTimeout(() => {
            let total = 0;
            Object.keys(receivedAreaCounts).forEach(key => {
                assert.strictEqual(receivedAreaCounts[key], Connectors.length);
                total += receivedAreaCounts[key];
            });
            // total should be based on how many connectors we have and how many areas we have
            assert.strictEqual(total, Areas.length * Connectors.length);
            done();
        }, 500);
    });

    it('Correct channels receive message broadcasted from an area', function(done) {
        let Area0 = Areas[0];
        let Area1 = Areas[1];

        let messagesReceived = 0;

        let Channel0s = Connectors.map(connector => {
            return connector.getChannel(Area0.areaId);
        });

        let Channel1s = Connectors.map(connector => {
            return connector.getChannel(Area1.areaId);
        });

        // channel 0s onAreaMessage WILL be fired
        Channel0s.forEach(channel => {
            channel.onAreaMessage = ((message) => {
                messagesReceived++;
                assert.strictEqual(message, Area0.areaId);
            });
        });

        // channel1s onAreaMessage will NOT be fired
        Channel1s.forEach(channel => {
            channel.onAreaMessage = ((message) => {
                messagesReceived++;
            });
        });

        Area0.broadcast(Area0.areaId);

        setTimeout(() => {
            // should only have received the message once for a channel in each connector
            assert.strictEqual(messagesReceived, Connectors.length);
            done();
        }, 500);
    })
});