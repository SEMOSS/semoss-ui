/** What GetRouterLearningStatus returns; pixel output omits null values. */
export interface RouterLearningStatus {
	mode?: string | null;
	enabled: boolean;
	paused: boolean;
	current_version?: string | null;
	optimizer_model?: string | null;
	/** New runs of the router that start a learning check. */
	min_new_tasks?: number;
	new_tasks_since_last_attempt?: number;
	/** off, hourly, daily, weekly or custom: how often learning also runs on a clock. */
	frequency?: string;
	versions?: {
		version: string;
		committed_at?: string;
		/** Plain-English lines: what this version changed against the one before. */
		changes?: string[];
	}[];
	/** Only with the slow cost read (see routerLearningStatusQuery). */
	cost_by_version?: {
		config_version: string;
		avg_cost_micros_per_priced_step?: number | null;
	}[];
}

/** The live router config, as far as the card reads it. */
export interface RouterConfig {
	routes?: { engine_id: string; name: string }[];
	subtasks?: { id: string; definition?: string; route: string }[];
	strong_route?: string;
}

/** What SetRouterLearning takes; the quality the router may trade is an advanced setting of its config. */
export interface SetRouterLearningInput {
	engineId: string;
	enabled: boolean;
	optimizerModelId?: string;
	/** A whole number, 0 or more. */
	minNewTasks?: number;
	/** off, hourly, daily or weekly. */
	frequency?: string;
}

const text = (value: string) => `[${JSON.stringify(value)}]`;

/** Without costs the call answers at once; with them it scans the run history (about 15 s). */
export const routerLearningStatusQuery = (
	engineId: string,
	withCosts: boolean,
): string =>
	`GetRouterLearningStatus(engine=${text(engineId)}, withCosts=[${withCosts}]);`;

export const routerConfigQuery = (engineId: string): string =>
	`GetModelRouterConfig(engine=${text(engineId)});`;

export const setRouterLearningPixel = (i: SetRouterLearningInput): string => {
	const args = [`engine=${text(i.engineId)}`, `enabled=[${i.enabled}]`];
	if (i.optimizerModelId) {
		args.push(`optimizerModelId=${text(i.optimizerModelId)}`);
	}
	if (i.minNewTasks !== undefined) {
		args.push(`minNewTasks=[${i.minNewTasks}]`);
	}
	if (i.frequency) {
		args.push(`frequency=${text(i.frequency)}`);
	}
	return `SetRouterLearning(${args.join(", ")});`;
};

/** Restores a committed version as a new commit and pauses learning. */
export const rollbackRouterConfigPixel = (
	engineId: string,
	version: string,
): string =>
	`RollbackRouterConfig(engine=${text(engineId)}, version=${text(version)});`;
