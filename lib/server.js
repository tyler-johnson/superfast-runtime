import {join} from "path";
import assign from "lodash/object/assign";
import app from "./app";
import express from "express";
import htmlSrc from "./html.jst";
import template from "lodash/string/template";
import compress from "compression";
import http from "http";
import log from "appcore-log";
import config from "appcore-config";
import {resolve} from "path";
import socketio from "socket.io";
var morgan = require("morgan");

const SFDIR = resolve(process.cwd(), ".superfast");

app.set({
	superfast: { dir: SFDIR, seq: 0 },
	browserKeys: ["env","log","name","version","superfast.seq"]
});

app.use(config({
	filesKey: "config",
	files: [ "package.json", "config.json" ],
	cli: {
		string: [ "config" ],
		alias: {
			c: "config",
			p: "port"
		}
	},
	env: {
		PORT: "port"
	}
}));

app.use(log);

let htmlTpl = template(htmlSrc, { variable: "$" });

let options = assign({
	log: false,
	logLevel: "debug",
	compress: app.env === "production",
	"x-powered-by": false
}, app.get("router"));

let router = app.router = express();

// in case other things what to create static routes
router.static = express.static;

// creates a new express router object
router.create = function(opts) {
	return new express.Router(opts);
};

// base configuration
router.set("env", app.env);
assign(router.settings, app.get("express"));

// create a fresh server instance
let server = app.server = http.createServer(router);
server.on('error', app.error.bind(app));

// create socket.io instance
let io = app.io = socketio(server);
io.on("connection", function(socket) {
	socket.on("seq", function(fn) { fn(app.get("superfast.seq")); });
});

// receive messages from the parent runner
process.on("message", app.wait(function(msg) {
	if (msg.match(/^SEQ/)) {
		let seq = parseInt(msg.substr(3).trim(), 10);
		if (!isNaN(seq) && app.get("superfast.seq") !== seq) {
			app.set("superfast.seq", seq);
			io.sockets.emit("seq", seq);
		}
	}
}));

// immediately ask for sequence information
if (typeof process.send === "function") {
	process.send("SEQ");
}

// setup router logger
if (options.log) router.use(morgan(app.env === "development" ? "dev" : "short", {
	stream: { write: function(l) { ((app.log && app.log[options.logLevel]) || console.log)(l.trim()); } }
}));

// gzip in production
if (options.compress) router.use(compress());

// phonehome router
router.use("/-methods", app.phone.http());

app.ready(function() {
	router.get(/^\/_app\.(js|css)$/, function(req, res) {
		res.sendFile(join(SFDIR, "client." + req.params[0]));
	});

	router.use(express.static("public"));

	router.use(function(req, res, next) {
		if (req.method !== "GET") return next();
		res.type("html");
		res.send(htmlTpl({
			config: app.getBrowserOptions(),
			scripts: [ "/_app.js" ],
			styles: [ "/_app.css" ]
		}));
	});

	let port = app.get("port") || 3000;
	server.listen(port, "0.0.0.0", app.wait());
});

// let parent process know that that app is running
app.running(function() {
	if (typeof process.send === "function") {
		process.send("READY " + JSON.stringify(server.address()));
	}
});
