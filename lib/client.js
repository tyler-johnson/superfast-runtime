/* globals $APPCONFIG */

import app from "./app";
import domready from "domready";
import log from "appcore-log";
import socketio from "socket.io-client";

if (typeof $APPCONFIG !== "undefined") {
	app.set($APPCONFIG);
}

app.use(log);
domready(app.wait());

let socket = app.socket = socketio(location.origin);

socket.on("connect", checkBuildId);

app.serverInfo = function(cb) {
	socket.emit("serverinfo", cb);
};

function checkBuildId() {
	app.serverInfo(function(info) {
		if (info && info.id && info.id !== app.get("id")) {
			location.reload();
		}
	});
}

if (app.env === "development") {
	socket.on("hotcodepush", function() {
		location.reload();
	});
}
