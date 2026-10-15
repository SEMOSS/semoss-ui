import { createViteLibConfig } from "@semoss/config";

export default createViteLibConfig({
	rootDir: import.meta.dirname,
	entry: {
		index: "src/index.ts",
	},
	external: [
		/@semoss\/sdk/,
		/@semoss\/ui/,
		"@semoss/shared",
		"mobx",
		"mobx-react-lite",
		"react",
		"react-dom",
		"react-router",
	],
});
