/**
 * This is the main Web page controller class the manages the UI, requests data from the server and send
 * information back to the server.
 * 
 * @class
 * @memberof @memberof DEDA-OS-Service
 * @author Charbel Choueiri <charbel.choueiri@gmail.com>
 */
class Controller
{
    /**
     * The controller constructor to initialize the class and it's components.
     */
    constructor()
    {
        // Create and initialize the Angular modular
        this.app = angular.module('ServiceManagerApp', [])
        this.app.controller('ServiceManagerControl', $scope=>{
            this.$scope = $scope;
            this.$scope.control = this;

            // TODO: fix this!!
            setTimeout(()=>$('[data-toggle="tooltip"]').tooltip(), 3000);
        });

        // Listen to when the page is loaded and refresh the list.
        $(()=>this.refresh());

        /**
         * Contains the controller options object. See getDefaultOptions();
         * @member {object}
         */
        this.options = this.constructor.getDefaultOptions();

        /**
         * This is the class the contains all the server config/options information used when refreshing the page.
         * @member {object}
         */
        this.info = {};
    }

    /**
     * Returns all the possible options for this controller along with their default values.
     */
    static getDefaultOptions()
    {
        return {
            serviceURL: '/service/'
        };
    }

    /**
     * Shows the about dialog box.
     */
    about() { $('#AboutModal').modal('show'); }

    /**
     * Shows the add dialog box with an empty process to be created.
     */
    create()
    {
        // Make a copy of it so it does not affect the table.
        this.$scope.process = JSON.parse(JSON.stringify(this.info.processDefaults));
        $('#AddEditModal').modal('show');
    }

    /**
     * Shows the edit dialog box for the process with the given name.
     * @param {string} name - The process name.
     */
    edit(name)
    {
        // Get the service and set it within the scope.
        let process = this.info.processes.find( process=>process.name === name);
        if (!process) return this.alert('info', `Unable to find process with the name ${name}. Try refreshing the page.`);

        // Store the current name of the process in case it is changed.
        process._name = process.name;

        // Make a copy of it so it does not affect the table.
        this.$scope.process = JSON.parse(JSON.stringify(process));
        $('#AddEditModal').modal('show');
    }



    /**
     * Refreshes the list of services along with the latest logs from the server.
     */
    async refresh()
    {
        // Request the service list from the server.
        const result = await this.fetch(`${this.options.serviceURL}getList`);
        if (result.error) return this.alert('error', result.error);

        // Update the local variable to the new config table.
        this.info = result;

        // Set the list within the scope.
        this.$scope.processes = JSON.parse(JSON.stringify(result.processes));
        this.$scope.$apply();

        // TODO: Move to it's own loop.
        this.updateLogs();
    }

    /**
     * Refresh the list of logs. This will only fetch the last longs since it was last updated.
     */
    async updateLogs()
    {
        const result = await this.fetch(`${this.options.serviceURL}getLogs`);
        if (result.error) return this.alert('error', result.error);

        // Update the local logs data.
        this.logs = result;

        // Set the logs list within the scope.
        this.$scope.logs = this.logs;
        this.$scope.$apply();
    }

    /**
     * Sends the request to the server to add a new process.
     * @param {object} process - The process details.
     */
    async add(process)
    {
        // Convert the arguments back to an array if it was modified.0
        if (typeof(process.args_) === 'string') process.args = process.args_.split('\n');

        // Send the data to the server to save it. If no errors then close the window and refresh the page.
        const result = await this.fetch(`${this.options.serviceURL}add`, process);
        if (result.error) return this.alert('error', result.error);

        // Otherwise show the error to the user.
        $('#AddEditModal').modal('hide');
        this.refresh();
    }

    /**
     * Sends the request to the server to update the given process.
     * @param {object} process - The process details.
     */
    async update(process)
    {
        // Convert the arguments back to an array if it was modified.
        if (typeof(process.args_) === 'string') process.args = process.args_.split('\n');

        // Send the data to the server to save it. If no errors then close the window and refresh the page.
        const result = await this.fetch(`${this.options.serviceURL}update`, process);
        if (result.error) return this.alert(result.error);

        // Otherwise show the error to the user.
        $('#AddEditModal').modal('hide');
        this.refresh();
    }

    /**
     * Removes the process with the given name after confirming with the user.
     * @param {string} name - The name of the process to remove.
     */
    async remove(name)
    {
        // Confirm with the user before removing the process.
        const confirmed = confirm(`Are you sure you want to delete the process: ${name}`);
        if (!confirmed) return;

        // Send the request to the server.
        const result = await this.fetch(`${this.options.serviceURL}remove?name=${name}`);
        if (result.error) this.alert('error', result.error);

        // Refresh the page content.
        this.refresh();
    }

    /**
     * Sends the start signal to the server for the given process name.
     * @param {string} name - The name of the process.
     */
    start(name) { this.send('start', name); }

    /**
     * Sends the stop signal to the server for the given process name.
     * @param {string} name - The name of the process.
     */
    stop(name) { this.send('stop', name); }

    /**
     * Sends the restart signal to the server for the given process name.
     * @param {string} name - The name of the process.
     */
    restart(name) { this.send('restart', name); }

    /**
     * Sends the start signal to the server for the given process name.
     */
    startAll() { this.send('startAll'); }

    /**
     * Sends the stop signal to the server for the given process name.
     */
    stopAll() { this.send('stopAll'); }

    /**
     * Sends the restart signal to the server for the given process name.
     */
    restartAll() { this.send('restartAll'); }

    /**
     * This is a signal or a message to the server to perform an action. This is used
     * by start, restart, stop, etc to trigger methods remotely.
     * @param {string} type - The message type.
     * @param {string} [name] - The name of the referenced service 
     */
    async send(type, name)
    {
        // Send the request to the service to stop it.
        const result = await this.fetch(`${this.options.serviceURL}${type}?name=${name}`);
        if (result.error) this.alert('error', result.error);

        // Refresh the page content.
        this.refresh();
    }



    /**
     * Fetches the content from the given. If a body is provided then sends the request as a POST otherwise it is a get request.
     * @param {string} url - The URL to fetch data from.
     * @param {object} body - The JSON to send to the server within a post.
     */
    async fetch(url, body)
    {
        // Request the service list from the server.
        const response = (body ? await fetch(url, {method: 'POST', headers: {'Accept': 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) : await fetch(url));
        return await response.json();
    }

    /**
     * Show a message to the user as a popup window. Similar to alert().
     */
    alert(type, message)
    {
        alert(message);
    }

    /**
     * Formats the number elapsed of milliseconds to a string of the following format: hh:mm:ss
     * @param {number} dateTime - The number of elapsed milliseconds.
     * @returns {string} Returns a formatted elapsed string of hh:mm:ss
     */
    formatElapsedTime(dateTime)
    {
        const time = Math.round((Date.now() - dateTime)/1000);
        return `${ (~~(time/3600)).toString().padStart(2, '0')}:${ (~~((time % 3600) / 60)).toString().padStart(2, '0')}:${ (time % 60).toString().padStart(2, '0')}`;
    }

    /**
     * Formats the given timestamp to a string of the following format: YYYY-MM-DD hh:mm:ss
     * @param {number} timestamp - The timestamp to format.
     * @returns {string} Returns a formatted string of the date and time.
     */
    formatDateTime(timestamp)
    {
        const date = new Date(timestamp);
        return `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
    }
}


var controller = new Controller();