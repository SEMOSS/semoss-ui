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

export interface MasterdatabaseReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/AddMetaDescriptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddMetaDescription: ReactorContract<
		SourceParameters<"concept" | "database" | "description", "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/AddMetaTagsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddMetaTags: ReactorContract<
		SourceParameters<"concept" | "database" | "values", "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/AllConceptualNamesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AllConceptualNames: ReactorContract<
		SourceParameters<never, "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/CLPModelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CLPModel: ReactorContract<
		SourceParameters<"conceptualNames", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/DeleteMetaTagsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteMetaTags: ReactorContract<
		SourceParameters<"concept" | "database" | "values", "named">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetConceptPropertiesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetConceptProperties: ReactorContract<
		SourceParameters<"concepts" | "database", "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseConceptsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseConcepts: ReactorContract<
		SourceParameters<"database", "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseConnectionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseConnections: ReactorContract<
		SourceParameters<"columns" | "database", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseListReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseList: ReactorContract<
		SourceParameters<"limit" | "offset", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseMetamodelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseMetamodel: ReactorContract<
		SourceParameters<"database" | "options", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseSelectorsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseSelectors: ReactorContract<
		SourceParameters<"database", "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetDatabaseTableStructureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseTableStructure: ReactorContract<
		SourceParameters<"database", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetFrameDatabaseJoinsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetFrameDatabaseJoins: ReactorContract<
		SourceParameters<"database" | "frame", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetMetaDescriptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetMetaDescription: ReactorContract<
		SourceParameters<"concept" | "database", "named">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetMetaTagsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetMetaTags: ReactorContract<
		SourceParameters<"concept" | "database", "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetPhysicalToLogicalMappingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPhysicalToLogicalMapping: ReactorContract<
		SourceParameters<never, "named">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetPhysicalToPhysicalMappingReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetPhysicalToPhysicalMapping: ReactorContract<
		SourceParameters<never, "named">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetSpecificConceptPropertiesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetSpecificConceptProperties: ReactorContract<
		SourceParameters<"concept" | "database", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/GetTraversalOptionsReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetTraversalOptions: ReactorContract<
		SourceParameters<"logical" | "values", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/QueryTranslatorReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	QueryTranslator: ReactorContract<
		SourceParameters<"query" | "sourceDB" | "targetDB", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/masterdatabase/SyncDatabaseWithLocalMasterReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SyncDatabaseWithLocalMaster: ReactorContract<
		SourceParameters<"database" | "engine", "both">,
		boolean,
		false
	>;
}
