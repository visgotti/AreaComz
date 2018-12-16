const cluster = require('cluster');
const fs = require('fs');
const path = require('path');
const { Area } = require('./dist/AreaComz/core/Area');
const { Connector } = require('./dist/AreaComz/core/Connector');
const { Broker } = require('./dist/AreaComz/core/Broker');

const config = JSON.parse(fs.readFileSync(path.resolve('areaConfig.json')));

const currentGameId = 1;

if (cluster.isMaster) {
    // create 2 areas
    for (let i = 0; i < config.areas.length; i += 1) {
        cluster.fork({
            TYPE: 'AREA',
            AREA_INDEX: i,
            BROKER_URI: config.broker.URI,
            URI: config.areas[i].URI,
            GAME_ID: currentGameId,
        });
    }

    // create 3 rooms
    for (let i = 0; i < config.connectors.length; i += 1) {
        cluster.fork({
            TYPE: 'CONNECTOR',
            AREAS_DATA: JSON.stringify(config.areas),
            BROKER_URI: config.broker.URI,
            GAME_ID: currentGameId,
        });
    }
    // create the broker
    Broker(config.broker.URI, currentGameId);
} else {
    if (process.env.TYPE === 'AREA') {
        const { URI, BROKER_URI } = process.env;
        const AREA_INDEX = parseInt(process.env.AREA_INDEX);
        const GAME_ID = parseInt(process.env.GAME_ID);
        console.log('creating an area with params...', URI, BROKER_URI, AREA_INDEX, GAME_ID);
        const area = new Area(URI, BROKER_URI, AREA_INDEX, GAME_ID);

        process.on('SIGINT', () => {
            area.close();
        });
    } else if (process.env.TYPE === 'CONNECTOR') {
        // const URI = process.env.URI;
        const { BROKER_URI } = process.env;
        const AREAS_DATA = JSON.parse(process.env.AREAS_DATA);
        const GAME_ID = parseInt(process.env.GAME_ID);
        console.log('creating connector with params...', BROKER_URI, AREAS_DATA, GAME_ID);

        const connector = new Connector(BROKER_URI, AREAS_DATA, GAME_ID);

        process.on('SIGINT', () => {
            connector.close();
        });
    }
}
