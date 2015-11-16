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

let seq = app.get("superfast.seq");
let socket = app.socket = socketio(location.origin);

socket.on("connect", checkUpdate);
socket.on("source_update", checkUpdate);
socket.on("seq", attemptReload);

function checkUpdate() {
	socket.emit("seq", attemptReload);
}

function attemptReload(s) {
	if (s !== seq) location.reload();
}
