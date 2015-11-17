import {join} from "path";
import assign from "lodash/object/assign";
import express from "express";
import htmlSrc from "./html.jst";
import template from "lodash/string/template";
import compress from "compression";
import http from "http";
import socketio from "socket.io";
import pick from "lodash/object/pick";

let htmlTpl = template(htmlSrc, { variable: "$" });

export default function() {
	let app = this;

	let options = assign({
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
		socket.on("serverinfo", function(fn) {
			fn(pick(app.options, "name", "version", "id"));
		});
	});

	// gzip in production
	if (options.compress) router.use(compress());

	// phonehome router
	router.use("/-methods", app.phone.http());

	app.ready(function() {
		router.get(/^\/_app\.(js|css)$/, function(req, res) {
			res.sendFile(join(app.get("superfast.dir"), "client." + req.params[0]));
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

		server.listen(app.get("port") || 3000, "0.0.0.0", app.wait());
	});
}
