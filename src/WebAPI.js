{
"use strict";

const url = require('url');
const Express = require('express');

// Used for validation.
const Joi = require('joi');
const Process = require('./Process');

/**
 * This class is responsible for providing an HTTP API for accessing the Service Manager
 * using a web browser. This is essentially the GUI service interface.
 * 
 * @class
 * @memberof DEDA-OS-Service
 * @author Charbel Choueiri <charbel.choueiri@gmail.com>
 */
class WebAPI
{
    /**
     * Creates a new instance of the WebAPI with the given parameters.
     * @param {object} options - The options for this class.
     * @param {DEDA-OS-Service.Manager} manager - The instance of the manager to expose the API for.
     */
    constructor(options, manager)
    {
        /**
         * A pointer the service manager class to expose the APIs for. This is also used for logging.
         * @member {DEDA-OS-Service.Manager}
         */
        this.manager = manager;

        /**
         * This is the processes options object with the default values used to send to the client to be used 
         * in creating new processes.
         * @member {DEDA-OS-Service.Process.Options}
         */
        this.processDefaults = Process.optionValidation(null, {getDefaults: true}).value;

        /**
         * The class options as defined by [optionValidation()]{@link DEDA-OS-Service.WebAPI.Options}
         * On initialization the constructor options parameters are merged with the default options.
         * @member {DEDA-OS-Service.WebAPI.Options}
         */
        this.options = this.constructor.optionValidation(options, {throwOnError: true}).value;
    }


    /**
     * @typedef {Object} Options
     * @property {string} [serviceURL=/service/] - The root URL fo the service api calls.
     * @memberof DEDA-OS-Service.WebAPI
     */

    /**
     * Returns the default options, returns the Jio validation schema or validates the given options and returns the result.
     * The point of this method is to provide a single function that will satisfy all the validation requirements.
     */
    static optionValidation(object, options)
    {
        // Set the default values for the given options. No need to to valid the options for the options :).
        options = Object.assign({getSchema: false, getDefaults: false, throwOnError: false}, options);

        // Create the schema for the validation.
        const schema = Joi.object().keys({
            serviceURL: Joi.string().default('/service/')
        }).options({ stripUnknown: true });

        // If we are to return the schema then return it as is. Otherwise if get default value then update the given options.
        if (options.getSchema) return schema;
        else if (options.getDefaults) object = {};

        // Finally validate the options and return the results.
        const result = Joi.validate(object, schema);
        if (result.error && options.throwOnError) throw result.error;
        else return result;
    }


    /**
     * Returns an Express.js Router of all the service routs for this class/application.
     * This can be added directly to express to expose the API to HTTP for application to query.
     */
    getRouters()
    {
        let router = Express.Router();
        router.get(`${this.options.serviceURL}getList`, (...args)=>this.getList(...args));
        router.get(`${this.options.serviceURL}getLogs`, (...args)=>this.getLogs(...args));

        router.get(`${this.options.serviceURL}stop`, (...args)=>this.stop(...args));
        router.get(`${this.options.serviceURL}start`, (...args)=>this.start(...args));
        router.get(`${this.options.serviceURL}restart`, (...args)=>this.restart(...args));

        router.get(`${this.options.serviceURL}stopAll`, (...args)=>this.stopAll(...args));
        router.get(`${this.options.serviceURL}startAll`, (...args)=>this.startAll(...args));
        router.get(`${this.options.serviceURL}restartAll`, (...args)=>this.restartAll(...args));

        router.post(`${this.options.serviceURL}add`, (...args)=>this.add(...args));
        router.get(`${this.options.serviceURL}remove`, (...args)=>this.remove(...args));
        router.post(`${this.options.serviceURL}update`, (...args)=>this.update(...args));
        return router;
    }

    /**
     * Sends the given JSON back to the client. This service API will only send and receive JSON.
     * @param {HTTP.Response} response - The HTTP response object to send the JSON from.
     * @param {object | string} json - The JSON to send back to the caller.
     */
    send(response, json)
    {
        // Return the JSON back to the client.
        response.setHeader('Content-Type', 'application/json');
        response.send(typeof(json) === 'string' ? json : JSON.stringify(json));
    }


/////////////////////////////////////////
// The service API
/////////////////////////////////////////


    /**
     * Returns the entire options and list of processes for the running service manager.
     * This can be used to display the processes, view and update them and also view and update the 
     * service manager own options and configurations.
     */
    getList(request, response)
    {
        // Get the list of services and return them.
        let result = JSON.parse(JSON.stringify(this.manager.options));

        // Traverse the list and add the current status of the service.
        result.processes = [];
        this.manager.processes.forEach( process=>{
            let options = Object.assign({}, process.options);
            options.isRunning = process.isRunning();
            options.startedAt = process.lastStartedDateTime;
            result.processes.push(options);
        });

        // Add the version of the package to the list.
        result.version = this.manager.version;

        // Add the process default values used for creating new options.
        result.processDefaults = this.processDefaults;

        // Return the JSON back to the client.
        this.send(response, result);
    }

    /**
     * Returns the manager log cache back to the client.
     */
    getLogs(request, response)
    {
        // Returns the log cache back to the caller.
        this.send(response, this.manager.logCache);
    }



    /**
     * Starts the process with the given name. The name must be in the query string (?name=<string>).
     */
    start(request, response)
    {
        // Parse the query string to get the name. Request the restart from the manager.
        const query = url.parse(request.url, true).query;
        this.send(response, this.manager.start(query.name));
    }

    /**
     * Stops the process with the given name. The name must be in the query string (?name=<string>).
     */
    stop(request, response)
    {
        // Parse the query string to get the name. Request the restart from the manager.
        const query = url.parse(request.url, true).query;
        this.send(response, this.manager.stop(query.name));
    }

    /**
     * Restarts the process with the given name. The name must be in the query string (?name=<string>).
     */
    restart(request, response)
    {
        // Parse the query string to get the name. Request the restart from the manager.
        const query = url.parse(request.url, true).query;
        this.send(response, this.manager.restart(query.name));
    }



    /**
     * Stops all the currently running processes within the service manager.
     */
    startAll(request, response)
    {
        this.send(response, this.manager.startAll());
    }

    /**
     * Stops all the currently running processes within the service manager.
     */
    stopAll(request, response)
    {
        this.send(response, this.manager.stopAll());
    }

    /**
     * Restarts all the processes within the service manager.
     */
    restartAll(request, response)
    {
        this.send(response, this.manager.restartAll());
    }


    /**
     * Adds the given process config object to the service manager. The config JSON object must be within the post body.
     */
    add(request, response)
    {
        // Get the request JSON body and add it to the manager. We are relying on the validation of the manager.
        this.send(response, this.manager.add(request.body));
    }

    /**
     * Removes the given process name from the service manager. The name must be in the query string (?name=<string).
     */
    remove(request, response)
    {
        // Parse the query string to get the name.
        const query = url.parse(request.url, true).query;
        this.send(response, this.manager.remove(query.name));
    }

    /**
     * Updates the process config object with the given object within the service manager. The config JSON object must be within the post body.
     */
    update(request, response)
    {
        // Get the request JSON body and send it to the manager to update the process. We are relying on the validation of the manager.
        this.send(response, this.manager.update(request.body));
    }
}

// Export the class
WebAPI.namespace = 'DEDA.OS.Service.WebAPI';
module.exports = WebAPI;
}