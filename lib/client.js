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

let seq = app.get("superfast.build.seq");
let socket = app.socket = socketio(location.origin);

socket.on("connect", checkUpdate);
socket.on("source_update", checkUpdate);

function checkUpdate() {
	socket.emit("build", function(build) {
		if (build !== seq) location.reload();
	});
}
