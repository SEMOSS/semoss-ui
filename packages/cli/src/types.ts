export type Config = {
	/** Id of the app */
	app: string;

	/** Name of the app */
	name: string;

	targets: string[];

	/** glob pattern(s) to ignore files */
	ignore: string[];

	/** Deploy options */
	deploy: {
		/** Batch deployment configurations */
		batch?: Record<string, unknown>;
	};
};
