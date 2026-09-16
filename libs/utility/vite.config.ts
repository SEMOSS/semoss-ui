import { createViteLibConfig } from "@semoss/config";

export default createViteLibConfig({
	rootDir: import.meta.dirname,
	entry: {
		index: "src/index.ts",
		"clipboard/index": "src/clipboard/index.ts",
		"date/index": "src/date/index.ts",
		"file/index": "src/file/index.ts",
		"file/image": "src/file/image.ts",
		"json/index": "src/json/index.ts",
		"string/index": "src/string/index.ts",
		"string/markdown": "src/string/markdown.ts",
	},
	external: [],
});
