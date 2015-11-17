/* globals $APPCONFIG */

import app from "./app";
import domready from "domready";
import log from "appcore-log";
import browserChannel from "./browser-channel";

if (typeof $APPCONFIG !== "undefined") {
	app.set($APPCONFIG);
}

app.use(log);
app.use(browserChannel);
domready(app.wait());
