import { createViteLibConfig } from "@semoss/config";

export default createViteLibConfig({
	rootDir: import.meta.dirname,
	entry: {
		index: "src/index.ts",
		"js-frameworks/react/index": "src/js-frameworks/react/index.ts",
	},
	external: ["react"],
});
