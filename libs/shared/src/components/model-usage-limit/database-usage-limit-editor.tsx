import {
	EngineUsageLimitEditor,
	type EngineUsageLimitEditorProps,
} from "./engine-usage-limit-editor";
import type { ModelUsageLimitSource } from "./model-usage-limit-format";

/** Database wording/profile for the shared editor. Metrics come from server capabilities. */
export interface DatabaseUsageLimitEditorProps
	extends Omit<
		EngineUsageLimitEditorProps,
		| "metrics"
		| "isCostAvailable"
		| "metricLabels"
		| "computeHint"
		| "unlimitedHint"
	> {
	metrics: NonNullable<EngineUsageLimitEditorProps["metrics"]>;
}
const NOT_DEFINED_HINTS: Record<ModelUsageLimitSource, string> = {
	DIRECT: "Uses an eligible team limit, then public use, the person's database default, or the platform default. Database and team ceilings still apply.",
	TEAM: "No limit on this team grant. Public use or defaults can apply; team-wide ceilings still apply.",
	PUBLIC: "Uses the person's database default or the platform default. The database total still applies.",
	MODEL_TOTAL:
		"No database-wide ceiling. Access-source limits and defaults still apply.",
	ALL_MODELS: "No personal database default. The platform default can apply.",
	PLATFORM:
		"No platform database default. Grant policies and database/team totals still apply.",
	TEAM_TOTAL: "No cumulative database ceiling for this team.",
};

/** Reuses model controls, windows, draft handling, validation, focus and modes unchanged. */
export const DatabaseUsageLimitEditor = (
	props: DatabaseUsageLimitEditorProps,
) => (
	<EngineUsageLimitEditor
		{...props}
		isCostAvailable={false}
		timeMeasure="elapsed read time"
		metricLabels={{
			QUERIES: "Queries",
			ROWS: "Rows",
			COMPUTE_TIME: "Elapsed Read Time",
		}}
		notDefinedHint={props.notDefinedHint ?? NOT_DEFINED_HINTS[props.source]}
		unlimitedHint="No cap from this source. Database and team ceilings still apply."
		computeHint="Cumulative elapsed read time in milliseconds, not CPU time or a query timeout. Active reads may finish after the budget is used."
	/>
);
