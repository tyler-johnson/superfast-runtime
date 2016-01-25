import PhoneHome from "phonehome";
import socketio from "socket.io";
import {pick} from "lodash";

export default function() {
	this.use(this.isServer ? socketServer : socketClient);
	this.use(phone);
	this.use(this.isServer ? helloServer : helloClient);
}

export function socketServer() {
	// create socket.io instance
	this.io = socketio(this.server);
}

export function socketClient() {
	let io = this.socket = socketio(location.origin);
	io.on("connect", this.wait());

	if (this.env === "development") {
		io.on("hotcodepush", function() {
			location.reload();
		});
	}
}

export function phone() {
	let request;
	let app = this;

	if (this.isClient) {
		request = function(name, args) {
			let tele = this;
			return new Promise(function(resolve, reject) {
				app.socket.emit("-sf-methods", name, args, function(data) {
					if (data && data.error) reject(tele.error(data));
					else resolve(data);
				});
			});
		};
	}

	let tele = this.phone = new PhoneHome({
		request: request
	});

	this.call = tele.call.bind(tele);
	this.apply = tele.apply.bind(tele);
	this.methods = tele.methods.bind(tele);

	if (this.isServer) {
		this.io.use(function(socket, next) {
			socket.on("-sf-methods", function(name, args, fn) {
				app.apply(name, args, {
					mixin: {
						app: app,
						socket: socket
					}
				}).then(fn, function(e) {
					if (e instanceof PhoneHome.Error) fn(e.toJSON());
					else {
						fn(tele.error(500, "Internal Server Error").toJSON());
						tele.emit("error", e);
					}
				});
			});

			next();
		});
	}
}

export function helloServer() {
	let app = this;
	this.methods("serverInfo", function() {
		return pick(app.options, "name", "version", "id");
	});
}

export function helloClient() {
	this.socket.on("connect", () => {
		this.call("serverInfo", this.wait((err, info) => {
			if (err) return this.error(err);

			if (info && info.id && info.id !== this.get("id")) {
				location.reload();
			}
		}));
	});
}
