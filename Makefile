BIN = ./node_modules/.bin
LIB = $(wildcard lib/* lib/*/*)
OUT = superfast.js client.js server.js
SRC = $(OUT:%.js=lib/%.js)

define ROLLUP
require("rollup").rollup({
	entry: "$<",
	plugins: [
		require("rollup-plugin-string")({
			extensions: [".jst"]
		}),
		require("rollup-plugin-babel")({
			exclude: 'node_modules/**'
		})
	]
}).then(function(bundle) {
	var result = bundle.generate({
		format: "cjs"
	});
	process.stdout.write(result.code);
}).catch(function(e) {
	process.nextTick(function() {
		throw e;
	});
});
endef

export ROLLUP

build: $(OUT)

%.js: lib/%.js $(LIB)
	# $< -> $@
	@node -e "$$ROLLUP" > $@

clean:
	rm $(OUT)

.PHONY: build
