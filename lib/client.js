/* globals $APPCONFIG */

import app from "./app";
import domready from "domready";
import log from "appcore-log";

if (typeof $APPCONFIG !== "undefined") {
	app.set($APPCONFIG);
}

app.use(log);
domready(app.wait());
