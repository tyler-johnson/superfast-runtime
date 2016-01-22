import {join} from "path";
import {assign,template} from "lodash";
import express from "express";
import htmlSrc from "./html.jst";
import compress from "compression";
import http from "http";

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

	// gzip in production
	if (options.compress) router.use(compress());

	app.ready(function() {
		router.get(/^\/_app\.(js|css)$/, function(req, res) {
			res.sendFile(join(app.cwd, "client." + req.params[0]));
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
