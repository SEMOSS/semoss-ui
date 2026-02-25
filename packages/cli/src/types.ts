// ============================================================================
// Legacy Config (smss.json) - For backward compatibility
// ============================================================================

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

// ============================================================================
// New Centralized Config System (~/.config/semoss/)
// ============================================================================

/** Configuration for a single app with deployment settings */
export interface AppConfig {
	/** Unique app ID from SEMOSS */
	appId: string;

	/** Human-readable app name */
	name: string;

	/** Absolute path to local directory containing app files */
	path: string;

	/** Target directories to deploy (e.g., ["java", "python"]) */
	targets?: string[];

	/** Custom ignore patterns (extends default ignore list) */
	ignore?: string[];

	/** Deployment hooks */
	hooks?: {
		/** Commands to run before deploy */
		preDeploy?: string[];
		/** Commands to run after deploy */
		postDeploy?: string[];
	};
}

/** Configuration for a single SEMOSS instance */
export interface InstanceConfig {
	/** Instance name (e.g., "production", "staging") */
	name: string;

	/** SEMOSS endpoint/module URL (e.g., "https://semoss.example.com") */
	endpoint: string;

	/** Module/endpoint URL - same as endpoint for backward compatibility */
	module: string;

	/** Access key for authentication */
	accessKey: string;

	/** Secret key for authentication */
	secretKey: string;

	/** Apps linked to this instance */
	apps: {
		[appId: string]: AppConfig;
	};
}

/** Credentials store - maps instance names to configurations */
export interface CredentialsStore {
	/** Currently active instance name */
	currentInstance?: string;

	/** All configured instances */
	instances: {
		[instanceName: string]: InstanceConfig;
	};
}

/** Global CLI configuration */
export interface GlobalConfig {
	/** Currently active instance name */
	currentInstance?: string;

	/** Currently active app ID */
	currentApp?: string;

	/** General settings */
	settings?: {
		/** Default deployment behavior */
		defaultTargets?: string[];
		/** Global ignore patterns */
		globalIgnore?: string[];
		/** Show deployment tips */
		showTips?: boolean;
	};
}
