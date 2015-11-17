import crypto from "crypto";

export default function() {
	if (typeof process.send !== "function") return;
	let check_parent = this.wait();

	// say hello to the parent process before setting up
	ping(() => {
		setupChannel(this);
		check_parent();
	});

	// give up after 5 seconds
	setTimeout(check_parent, 5000);
}

function setupChannel(app) {
	// receive messages from the parent runner
	// let received_seq = app.wait();
	process.on("message", function(msg) {
		if (typeof msg !== "object" || msg == null) return;

		switch(msg.type) {
			case "ping": {
				process.send({ type: "pong", value: msg.value });
				break;
			}

			case "client_update": {
				app.io.sockets.emit("hotcodepush");
				break;
			}
		}
	});

	// let parent process know that that app is running
	app.running(function() {
		process.send({
			type: "ready",
			address: app.server.address()
		});
	});
}

function ping(cb) {
	let onMessage;
	let val = crypto.randomBytes(8).toString("hex");
	process.on("message", onMessage = function(msg) {
		if (!msg || msg.type !== "pong" || msg.value !== val) return;
		process.removeListener("message", onMessage);
		if (typeof cb === "function") cb();
	});
	process.send({ type: "ping", value: val });
}
