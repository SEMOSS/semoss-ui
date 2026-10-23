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

export interface VectorReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/vector/CreateEmbeddingsFromDocumentsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateEmbeddingsFromDocuments: ReactorContract<
		SourceParameters<
			"engine" | "filePaths" | "paramValues" | "space",
			"both",
			["engine", "filePaths"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/CreateEmbeddingsFromVectorCSVFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateEmbeddingsFromVectorCSVFile: ReactorContract<
		SourceParameters<
			"engine" | "filePaths" | "paramValues" | "space",
			"both",
			["engine", "filePaths"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/upload/CreateVectorDatabaseEngineReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateVectorDatabaseEngine: ReactorContract<
		SourceParameters<
			"conDetails" | "database" | "global",
			"both",
			["database", "conDetails"],
			2
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/GetModelMaxTokenLength.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetModelMaxTokenLength: ReactorContract<
		SourceParameters<"engine", "both", ["engine"], 1>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/ListAllRecordsInVectorDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListAllRecordsInVectorDatabase: ReactorContract<
		SourceParameters<"engine" | "paramValues", "both", ["engine"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/ListDocumentsInVectorDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ListDocumentsInVectorDatabase: ReactorContract<
		SourceParameters<"engine" | "paramValues", "both", ["engine"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/RemoveDocumentFromVectorDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveDocumentFromVectorDatabase: ReactorContract<
		SourceParameters<
			"engine" | "fileNames" | "paramValues",
			"both",
			["engine", "fileNames"],
			2
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/RerankReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Rerank: ReactorContract<
		SourceParameters<
			"function" | "limit" | "vectorDb",
			"both",
			["function"],
			1
		>,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/VectorAttachFileToSourceReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	VectorAttachFileToSource: ReactorContract<
		SourceParameters<
			"engine" | "filePath" | "source" | "space",
			"both",
			["engine", "filePath"],
			2
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/VectorDatabaseQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	VectorDatabaseQuery: ReactorContract<
		SourceParameters<
			| "command"
			| "engine"
			| "filters"
			| "limit"
			| "metaFilters"
			| "paramValues",
			"named"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/vector/VectorFileDownloadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	VectorFileDownload: ReactorContract<
		SourceParameters<
			"engine" | "fileNames",
			"both",
			["engine", "fileNames"],
			2
		>,
		string | null,
		false
	>;
}
