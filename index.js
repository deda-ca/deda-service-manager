
const Express = require('express');
const ServiceManager = require('./src/Manager');
const ServiceWebAPI = require('./src/WebAPI');

// TODO: Get the version from package.json file.

// Create the manager.
let manager = new ServiceManager('./options.json');
let service = new ServiceWebAPI({}, manager);

// Create and initialize the express app.
const app = Express();
app.use(Express.json());
app.use(service.getRouters());
app.use(Express.static('./src/gui'));
app.listen(manager.options.port, ()=>console.log(`Listening on port ${manager.options.port}!`));