
export default function(compile) {
	runtime.call(compile);
	compile.on("reset", runtime);
}

function runtime() {
	this.files.add({
		type: "script",
		path: "superfast-runtime",
		targets: [ "server", "client" ]
	});
}
