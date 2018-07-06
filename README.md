# deda-service-manager
This is a service manager that provides a web interface to create, remove, start, stop, and restart child processes within itself. The service manager can also keep-alive/restart a process that crashes or stops (run forever).

# Alpha Release

This is the first beta release, it works and is stable but is missing some features.

# Usage

> npm install -g deda-service-manager

To run the service call

> deda-service-manager

Then, using your favorite browser log onto it using [http://localhost:6010](http://localhost:6010).

![](/docs/images/ScreenShot.png)

The Module interface looks like this

![](/docs/images/ProcessModal.png)


# TODO before Release 1.0.0

* Add mouse over descriptions of the buttons and other helpful stuff.
* Create a loop to refresh the list along with the logs list.

* MID - Add OS service support to run as a service/daemon 
* LOW - View log history for each process individually.
* LOW - Add stdout and stderr options to GUI dialog box.
* LOW - Support internationalization
* LOW - Add check of latest version feature: https://api.github.com/repos/DEDAjs/deda-service-manager/releases/latest
* LOW - Support login feature if not binding to 127.0.0.1.
* LOW - Support priority start and delay start for each process.

* DONE - View log history for the Service Manager.
* DONE - Add a version number on the page.
* DONE - Change default port for gui.
* DONE - Add about dialog box.
* DONE - Store logs as JSON instead of text.
* DONE - Error and message handling and reporting.
* DONE - Full form validation on client and server side.
* DONE - Move the add and refresh to a tool bar in the nav bar.