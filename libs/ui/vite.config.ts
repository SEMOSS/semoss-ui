import { createViteLibConfig } from "@semoss/config";

export default createViteLibConfig({
	rootDir: import.meta.dirname,
	entry: {
		index: "src/index.ts",
		next: "src/next/index.ts",
	},
	external: ["react", "react-dom"],
	enableTailwind: true,
	cssFileName: "index",
});
