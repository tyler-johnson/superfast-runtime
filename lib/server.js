import app from "./app";
import log from "appcore-log";
import config from "appcore-config";
import {resolve} from "path";
import router from "./router";
import processChannel from "./process-channel";
import crypto from "crypto";

const SFDIR = resolve(process.cwd(), ".superfast");

app.set({
	id: crypto.randomBytes(8).toString("hex"),
	superfast: { dir: SFDIR },
	browserKeys: ["env","log","name","version","id"]
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
app.use(router);
app.use(processChannel);
