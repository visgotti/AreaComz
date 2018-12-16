const cluster = require('cluster');
const fs = require('fs');
const path = require('path');
const Area = require('./src/core/Area');
const Connector = require('./src/core/Connector');
const Broker = require('./src/core/Broker');

const config = JSON.parse(fs.readFileSync(path.resolve('areaConfig.json')));

const GAME_ID = 1;

if(cluster.isMaster) {

    // create 2 areas
    for(let i = 0; i < config.areas.length; i++) {
        cluster.fork({
            "TYPE": "AREA",
            "AREA_INDEX": i,
            "BROKER_URI": config.broker.URI,
            "URI": config.areas[i].URI,
            "GAME_ID": GAME_ID,
        })
    }

    // create 3 rooms
    for(let i = 0; i < config.connectors.length; i++) {
        cluster.fork({
            "TYPE": "CONNECTOR",
            "AREAS_DATA": JSON.stringify(config.areas),
            "BROKER_URI": config.broker.URI,
            "GAME_ID": GAME_ID,
        })
    }
    // create the broker
    const broker = new Broker(config.broker.URI, GAME_ID);

} else {
    if (process.env.TYPE === 'AREA') {
        const URI = process.env.URI;
        const BROKER_URI = process.env.BROKER_URI;
        const AREA_INDEX = parseInt(process.env.AREA_INDEX);
        const GAME_ID = parseInt(process.env.GAME_ID);
        console.log('creating an area with params...', URI, BROKER_URI, AREA_INDEX, GAME_ID)
        const area = new Area(URI, BROKER_URI, AREA_INDEX, GAME_ID);

        process.on('SIGINT', function() {
            area.close();
        });


    } else {
       // const URI = process.env.URI;
        const BROKER_URI = process.env.BROKER_URI;
        const AREAS_DATA = JSON.parse(process.env.AREAS_DATA);
        const GAME_ID = parseInt(process.env.GAME_ID);
        console.log('creating connector with params...', BROKER_URI, AREAS_DATA, GAME_ID)

        const connector = new Connector(BROKER_URI, AREAS_DATA, GAME_ID);

        process.on('SIGINT', function() {
            connector.close();
        });

    }
}


