import type { Config } from "./types.js";

export const DEFAULT_CONFIG: Config = {
	app: "",
	name: "",
	targets: [],
	ignore: ["**/node_modules/**", "*.local"],
	deploy: {
		batch: {},
	},
};
