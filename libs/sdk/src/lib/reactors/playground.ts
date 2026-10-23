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

export interface PlaygroundReactorCatalog {
	/**
	 * @source Semoss/src/prerna/playground/reactors/AddPlaygroundToolExecutionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddPlaygroundToolExecution: ReactorContract<
		SourceParameters<
			| "engine"
			| "hiddenMessage"
			| "mcpToolStatus"
			| "paramValues"
			| "parentMessageId"
			| "responseParts"
			| "roomId"
			| "toolExecutionResponse"
			| "toolId"
			| "toolName"
			| "toolParameterValues"
			| "tool_execution_response",
			"both",
			["engine", "roomId", "toolId", "toolName"],
			4
		>,
		Record<string, unknown> | string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/playground/reactors/AskPlaygroundReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AskPlayground: ReactorContract<
		SourceParameters<
			| "command"
			| "engine"
			| "hiddenMessage"
			| "media"
			| "paramValues"
			| "parentMessageId"
			| "responseParts"
			| "roomId"
			| "url",
			"both",
			["engine", "command"],
			4
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/playground/reactors/CreatePlaygroundRoomReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreatePlaygroundRoom: ReactorContract<
		SourceParameters<
			| "context"
			| "function"
			| "mode"
			| "name"
			| "project"
			| "vectorDb"
			| "workspaceId",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/playground/reactors/GetPlaygroundMessagesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPlaygroundMessages: ReactorContract<
		SourceParameters<
			"limit" | "offset" | "roomId" | "sort",
			"both",
			["roomId"],
			1
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/playground/reactors/GetPlaygroundRoomsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPlaygroundRooms: ReactorContract<
		SourceParameters<
			| "includeChildRooms"
			| "includeUnnamedRooms"
			| "limit"
			| "mode"
			| "offset"
			| "pinned"
			| "project"
			| "roomOptionsSearch"
			| "search"
			| "sort",
			"both"
		>,
		unknown[],
		false
	>;
}
