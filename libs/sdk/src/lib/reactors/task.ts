/**
 * Built-in reactor inventory at Semoss 12781b2478eb97e2a27a911e9bdbc94b6f34ee88.
 * Named keys include inherited constructors and reachable execution/helper reads.
 * Required inputs are included where reachable organizeKeys/checkOptional enforces
 * them. Output shapes follow source values and PixelStreamUtility. Remaining value,
 * validation, and nested-shape gaps are explicit in contract-gaps.json; audited
 * contracts override these base contracts in catalog.ts.
 */
import type { SourceParameters } from "./source-parameters";
import type { ReactorContract } from "./value-types";

export interface TaskReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/task/lambda/map/function/ApplyFormattingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ApplyFormatting: ReactorContract<
		SourceParameters<"FORMATTED_DATA_SET" | "qs" | "task", "both">,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/AutoTaskOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AutoTaskOptions: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "ignoreFilters"
			| "layout"
			| "panel"
			| "qs"
			| "task",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/modifiers/CodeLambdaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CodeLambda: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "imports" | "qs" | "task",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/CollectMetaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectMeta: ReactorContract<
		SourceParameters<"task", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/modifiers/FilterLambdaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FilterLambda: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "imports" | "qs" | "task",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/modifiers/FlatMapLambdaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FlatMapLambda: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "columns"
			| "lambda"
			| "params"
			| "qs"
			| "task",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/FormatReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Format: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "options" | "qs" | "task" | "type",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/GetTaskHeadersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetTaskHeaders: ReactorContract<
		SourceParameters<never, "positional">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/modifiers/MapLambdaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	MapLambda: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "columns"
			| "lambda"
			| "params"
			| "qs"
			| "task",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/RefreshAllPanelTasksReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RefreshAllPanelTasks: ReactorContract<
		SourceParameters<"limit", "named">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/RefreshPanelTaskReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RefreshPanelTask: ReactorContract<
		SourceParameters<"limit" | "panel", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/RemoveLayerReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveLayer: ReactorContract<
		SourceParameters<"layer" | "panel", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/RemoveTaskReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveTask: ReactorContract<
		SourceParameters<never, "positional">,
		Record<string, unknown> | { taskId: string } | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/RefreshPanelTaskReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResetAll: ReactorContract<
		SourceParameters<"limit" | "panel", "both">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/ResetTaskReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ResetTask: ReactorContract<
		SourceParameters<"task", "both">,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/TaskReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Task: ReactorContract<
		SourceParameters<never, "positional">,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/TaskOptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TaskOptions: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "ignoreFilters" | "options" | "qs" | "task",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/modifiers/ToNumericTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToNumericType: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "columns" | "qs" | "task",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/modifiers/ToUrlTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToUrlType: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "columns" | "qs" | "task",
			"both"
		>,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/task/modifiers/TransposeRowsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TransposeRows: ReactorContract<
		SourceParameters<"FORMATTED_DATA_SET" | "qs" | "task", "both">,
		{ taskId: string },
		false
	>;
}
