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

export interface DatabaseReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/relationships/AddBulkOwlRelationshipsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddBulkOwlRelationships: ReactorContract<
		SourceParameters<
			"database" | "frame" | "propagation" | "store",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/modifications/AddDatabaseIndexReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddDatabaseIndex: ReactorContract<
		SourceParameters<
			"column" | "concept" | "createIndex" | "database" | "force",
			"both",
			["database", "concept", "column"],
			3
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/modifications/AddDatabasePropertyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddDatabaseProperty: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "column"
			| "concept"
			| "dataType"
			| "database"
			| "description"
			| "logicalNames",
			"both",
			["database", "concept", "column", "dataType"],
			4
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/physicaleditor/AddDatabaseStructureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddDatabaseStructure: ReactorContract<
		SourceParameters<"database" | "metamodelAdd", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/concepts/AddOwlConceptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddOwlConcept: ReactorContract<
		SourceParameters<
			| "additionalDataType"
			| "column"
			| "concept"
			| "conceptual"
			| "dataType"
			| "database"
			| "description"
			| "logicalNames",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/meta/AddOwlDescriptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddOwlDescription: ReactorContract<
		SourceParameters<
			"column" | "concept" | "database" | "description",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/meta/AddOwlLogicalNamesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddOwlLogicalNames: ReactorContract<
		SourceParameters<
			"column" | "concept" | "database" | "logicalNames",
			"named"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/properties/AddOwlPropertyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddOwlProperty: ReactorContract<
		SourceParameters<
			| "additionalDataType"
			| "column"
			| "concept"
			| "conceptual"
			| "dataType"
			| "database"
			| "description"
			| "logicalNames",
			"both",
			["database", "concept", "column", "dataType"],
			4
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/relationships/AddOwlRelationshipReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AddOwlRelationship: ReactorContract<
		SourceParameters<
			"database" | "endC" | "endT" | "startC" | "startT" | "store",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/CheckHeadersReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CheckHeaders: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/ClearDatabaseMetadataCacheReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ClearDatabaseMetadataCache: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/CommandReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Command: ReactorContract<
		SourceParameters<"command", "both", ["command"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/physicaleditor/CopyDatabaseTableSchemaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CopyDatabaseTableSchema: ReactorContract<
		SourceParameters<
			| "fuzzyConversions"
			| "ignoreOWL"
			| "nameConversions"
			| "override"
			| "sourceDatabase"
			| "sourceTable"
			| "targetDatabase"
			| "targetTable"
			| "typeConversions",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/internal/CreateEmptyRdbmsDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateEmptyRdbmsDatabase: ReactorContract<
		SourceParameters<
			"database" | "password" | "rdbmsType" | "username",
			"both",
			["database"],
			1
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/CreateExternalDSEGraphDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateExternalDSEGraphDatabase: ReactorContract<
		SourceParameters<
			| "database"
			| "graphMetamodel"
			| "graphName"
			| "graphNameId"
			| "graphTypeId"
			| "host"
			| "password"
			| "port"
			| "useLabel"
			| "username",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/CreateExternalGraphDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateExternalGraphDatabase: ReactorContract<
		SourceParameters<
			| "database"
			| "filePath"
			| "graphMetamodel"
			| "graphNameId"
			| "graphTypeId"
			| "space"
			| "useLabel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/neo4j/CreateExternalNeo4jDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateExternalNeo4jDatabase: ReactorContract<
		SourceParameters<
			| "connectionString"
			| "database"
			| "graphMetamodel"
			| "graphNameId"
			| "graphTypeId"
			| "password"
			| "useLabel"
			| "username",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/CreateJanusGraphDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateJanusGraphDatabase: ReactorContract<
		SourceParameters<
			| "database"
			| "filePath"
			| "graphMetamodel"
			| "graphNameId"
			| "graphTypeId"
			| "useLabel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/external/CreateNewRdbmsExternalDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateNewRdbmsExternalDatabase: ReactorContract<
		SourceParameters<"conDetails" | "database" | "metamodelAdd", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/internal/CreateNewRdbmsInternalDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CreateNewRdbmsInternalDatabase: ReactorContract<
		SourceParameters<"conDetails" | "database" | "metamodelAdd", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/DatabaseColumnUniqueReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseColumnUnique: ReactorContract<
		SourceParameters<"columns" | "database", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/modifications/DatabaseRenameColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseRenameColumn: ReactorContract<
		SourceParameters<
			"column" | "concept" | "database" | "newValue",
			"both",
			["database", "concept", "column", "newValue"],
			4
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/modifications/DatabaseRenameTableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DatabaseRenameTable: ReactorContract<
		SourceParameters<
			"concept" | "database" | "newValue",
			"both",
			["database", "concept", "newValue"],
			3
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/physicaleditor/DeleteDatabaseStructureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DeleteDatabaseStructure: ReactorContract<
		SourceParameters<"database" | "metamodelDelete", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/relationships/DownloadOwlRelationshipsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DownloadOwlRelationships: ReactorContract<
		SourceParameters<"database" | "password", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/modifications/EditDatabasePropertyDataTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditDatabasePropertyDataType: ReactorContract<
		SourceParameters<
			"column" | "concept" | "dataType" | "database",
			"both",
			["database", "concept", "column", "dataType"],
			4
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/concepts/EditOwlConceptConceptualNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditOwlConceptConceptualName: ReactorContract<
		SourceParameters<"concept" | "conceptual" | "database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/concepts/EditOwlConceptDataTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditOwlConceptDataType: ReactorContract<
		SourceParameters<
			"additionalDataType" | "concept" | "dataType" | "database",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/meta/EditOwlDescriptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditOwlDescription: ReactorContract<
		SourceParameters<
			"column" | "concept" | "database" | "description",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/meta/EditOwlLogicalNamesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditOwlLogicalNames: ReactorContract<
		SourceParameters<
			"column" | "concept" | "database" | "logicalNames",
			"named"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/properties/EditOwlPropertyConceptualNameReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditOwlPropertyConceptualName: ReactorContract<
		SourceParameters<
			"column" | "concept" | "conceptual" | "database",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/properties/EditOwlPropertyDataTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EditOwlPropertyDataType: ReactorContract<
		SourceParameters<
			| "additionalDataType"
			| "column"
			| "concept"
			| "dataType"
			| "database",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/external/ExternalJdbcSchemaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExternalJdbcSchema: ReactorContract<
		SourceParameters<"conDetails" | "filters", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/external/ExternalJdbcTablesAndViewsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExternalJdbcTablesAndViews: ReactorContract<
		SourceParameters<"conDetails", "named">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/external/ExternalUpdateJdbcSchemaReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExternalUpdateJdbcSchema: ReactorContract<
		SourceParameters<"database" | "filters", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/external/ExternalUpdateJdbcTablesAndViewsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExternalUpdateJdbcTablesAndViews: ReactorContract<
		SourceParameters<"database", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/routines/FindDirectOwlRelationshipsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FindDirectOwlRelationships: ReactorContract<
		SourceParameters<"database" | "tables", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/routines/FindIndirectOwlRelationshipsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FindIndirectOwlRelationships: ReactorContract<
		SourceParameters<"database" | "tables", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/routines/FindSemanticColumnOwlRelationshipsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FindSemanticColumnOwlRelationships: ReactorContract<
		SourceParameters<"database" | "store" | "tables", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/routines/FindSemanticInstanceOwlRelationshipsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FindSemanticInstanceOwlRelationships: ReactorContract<
		SourceParameters<"database" | "store" | "tables", "both">,
		{ type: string; name?: string; queryName?: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/GenerateIdColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GenerateIdColumn: ReactorContract<
		SourceParameters<
			"columns" | "dataType" | "database" | "newCol" | "table",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/GetDSEGraphMetaModelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDSEGraphMetaModel: ReactorContract<
		SourceParameters<
			| "graphName"
			| "graphTypeId"
			| "host"
			| "password"
			| "port"
			| "useLabel"
			| "username",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/GetDSEGraphPropertiesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDSEGraphProperties: ReactorContract<
		SourceParameters<
			"graphName" | "host" | "password" | "port" | "username",
			"both"
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/physicaleditor/GetDatabaseTablePhysicalStructureReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseTablePhysicalStructure: ReactorContract<
		SourceParameters<"database" | "table", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/GetDatabaseUserAccessRequestReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetDatabaseUserAccessRequest: ReactorContract<
		SourceParameters<"database", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/GetGraphMetaModelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetGraphMetaModel: ReactorContract<
		SourceParameters<
			"filePath" | "graphTypeId" | "space" | "useLabel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/GetGraphPropertiesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetGraphProperties: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/GetJanusGraphMetaModelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetJanusGraphMetaModel: ReactorContract<
		SourceParameters<"filePath" | "graphTypeId" | "useLabel", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/external/GetJanusGraphPropertiesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetJanusGraphProperties: ReactorContract<
		SourceParameters<"filePath", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/GetOwlDescriptionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetOwlDescriptions: ReactorContract<
		SourceParameters<"column" | "concept" | "database", "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/GetOwlDictionaryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetOwlDictionary: ReactorContract<
		SourceParameters<"database", "both">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/GetOwlLogicalNamesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetOwlLogicalNames: ReactorContract<
		SourceParameters<"column" | "concept" | "database", "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/GetOwlMetamodelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetOwlMetamodel: ReactorContract<
		SourceParameters<"database", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/GetUDF.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GetUDF: ReactorContract<
		SourceParameters<"database", "both", ["database"], 1>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/ParseMetamodelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ParseMetamodel: ReactorContract<
		SourceParameters<
			"delimiter" | "filePath" | "propFile" | "rowCount" | "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/PredictDataTypesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PredictDataTypes: ReactorContract<
		SourceParameters<
			"delimiter" | "filePath" | "rowCount" | "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/PredictExcelDataTypesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PredictExcelDataTypes: ReactorContract<
		SourceParameters<"filePath" | "password" | "space", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/PredictExcelRangeMetadataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PredictExcelRangeMetadata: ReactorContract<
		SourceParameters<
			"filePath" | "password" | "sheetName" | "sheetRange" | "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/PredictMetamodelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PredictMetamodel: ReactorContract<
		SourceParameters<
			"delimiter" | "filePath" | "rowCount" | "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/routines/PredictOwlDescriptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PredictOwlDescription: ReactorContract<
		SourceParameters<"column" | "concept" | "database", "named">,
		unknown[],
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/routines/PredictOwlLogicalNamesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PredictOwlLogicalNames: ReactorContract<
		SourceParameters<"column" | "concept" | "database", "named">,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/PredictParquetDataTypesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PredictParquetDataTypes: ReactorContract<
		SourceParameters<"filePath" | "space", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/r/RCsvUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RCsvUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "dataTypeMap"
			| "database"
			| "delimiter"
			| "filePath"
			| "newHeaders",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/r/RReplaceDatabaseCsvUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RReplaceDatabaseCsvUpload: ReactorContract<
		SourceParameters<"database" | "filePath" | "space", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/csv/RdbmsCsvUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsCsvUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "createIndex"
			| "dataTypeMap"
			| "database"
			| "delimiter"
			| "endRow"
			| "existing"
			| "filePath"
			| "metamodel"
			| "newHeaders"
			| "propFile"
			| "startRow",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/external/RdbmsExternalUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsExternalUpload: ReactorContract<
		SourceParameters<
			"conDetails" | "database" | "existing" | "metamodel",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/excel/RdbmsLoaderSheetUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsLoaderSheetUpload: ReactorContract<
		SourceParameters<"database" | "filePath", "both">,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/RdbmsReconnectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsReconnect: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/csv/RdbmsReplaceDatabaseCsvUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsReplaceDatabaseCsvUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "createIndex"
			| "dataTypeMap"
			| "database"
			| "delimiter"
			| "endRow"
			| "existing"
			| "filePath"
			| "metamodel"
			| "newHeaders"
			| "propFile"
			| "space"
			| "startRow",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/excel/RdbmsReplaceDatabaseExcelUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsReplaceDatabaseExcelUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "clean"
			| "dataTypeMap"
			| "database"
			| "deduplicate"
			| "descriptionMap"
			| "existing"
			| "filePath"
			| "logicalNamesMap"
			| "newHeaders"
			| "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/excel/RdbmsReplaceDatabaseLoaderSheetUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsReplaceDatabaseLoaderSheetUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "clean"
			| "dataTypeMap"
			| "database"
			| "deduplicate"
			| "existing"
			| "filePath"
			| "newHeaders"
			| "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/csv/RdbmsReplaceDatabaseUploadTableReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsReplaceDatabaseUploadTable: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "clean"
			| "dataTypeMap"
			| "database"
			| "deduplicate"
			| "delimiter"
			| "existing"
			| "filePath"
			| "newHeaders"
			| "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/excel/RdbmsUploadExcelDataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsUploadExcelData: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "clean"
			| "dataTypeMap"
			| "database"
			| "deduplicate"
			| "descriptionMap"
			| "existing"
			| "filePath"
			| "logicalNamesMap"
			| "newHeaders"
			| "replace"
			| "tables"
			| "uniqueColumn",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdbms/csv/RdbmsUploadTableDataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdbmsUploadTableData: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "clean"
			| "dataTypeMap"
			| "database"
			| "deduplicate"
			| "delimiter"
			| "existing"
			| "filePath"
			| "newHeaders"
			| "replace",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdf/RdfConvertLiteralTypeReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdfConvertLiteralType: ReactorContract<
		SourceParameters<
			"column" | "concept" | "dataType" | "database",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdf/RdfCsvUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdfCsvUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "customBaseURI"
			| "dataTypeMap"
			| "database"
			| "delimiter"
			| "endRow"
			| "existing"
			| "filePath"
			| "metamodel"
			| "newHeaders"
			| "propFile"
			| "startRow",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdf/RdfLoaderSheetUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdfLoaderSheetUpload: ReactorContract<
		SourceParameters<
			"customBaseURI" | "database" | "existing" | "filePath",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdf/RdfReplaceDatabaseCsvUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdfReplaceDatabaseCsvUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "customBaseURI"
			| "dataTypeMap"
			| "database"
			| "delimiter"
			| "endRow"
			| "filePath"
			| "metamodel"
			| "newHeaders"
			| "propFile"
			| "space"
			| "startRow",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/rdf/RdfReplaceDatabaseLoaderSheetUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RdfReplaceDatabaseLoaderSheetUpload: ReactorContract<
		SourceParameters<
			"customBaseURI" | "database" | "filePath" | "space",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/ReloadDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReloadDatabase: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/ReloadDatabaseOwlReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ReloadDatabaseOwl: ReactorContract<
		SourceParameters<"database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/modifications/RemoveDatabaseColumnReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveDatabaseColumn: ReactorContract<
		SourceParameters<
			"column" | "concept" | "dataType" | "database",
			"both",
			["database", "concept", "column", "dataType"],
			4
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/concepts/RemoveOwlConceptReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveOwlConcept: ReactorContract<
		SourceParameters<"concept" | "database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/meta/RemoveOwlDescriptionReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveOwlDescription: ReactorContract<
		SourceParameters<
			"column" | "concept" | "database" | "description",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/meta/RemoveOwlLogicalNamesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveOwlLogicalNames: ReactorContract<
		SourceParameters<
			"column" | "concept" | "database" | "logicalNames",
			"named"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/properties/RemoveOwlPropertyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveOwlProperty: ReactorContract<
		SourceParameters<"column" | "concept" | "database", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/relationships/RemoveOwlRelationshipReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	RemoveOwlRelationship: ReactorContract<
		SourceParameters<
			"database" | "endC" | "endT" | "startC" | "startT" | "store",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/SaveOwlPositionsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SaveOwlPositions: ReactorContract<
		SourceParameters<"database" | "positionMap", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/SimilarCatalogReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SimilarCatalog: ReactorContract<
		SourceParameters<"database", "both">,
		string | unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/TextToSQLReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TextToSQL: ReactorContract<
		SourceParameters<
			"command" | "database" | "error" | "model" | "paramValues" | "sql",
			"both",
			["database", "model", "command"],
			3
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/file/TinkerCsvUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TinkerCsvUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "dataTypeMap"
			| "database"
			| "delimiter"
			| "endRow"
			| "existing"
			| "filePath"
			| "metamodel"
			| "newHeaders"
			| "propFile"
			| "startRow"
			| "tinkerDriver",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/upload/gremlin/file/TinkerReplaceDatabaseCsvUploadReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TinkerReplaceDatabaseCsvUpload: ReactorContract<
		SourceParameters<
			| "additionalDataTypes"
			| "dataTypeMap"
			| "database"
			| "delimiter"
			| "endRow"
			| "existing"
			| "filePath"
			| "metamodel"
			| "newHeaders"
			| "propFile"
			| "space"
			| "startRow"
			| "tinkerDriver",
			"both"
		>,
		Record<string, unknown> | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/metaeditor/relationships/UploadBulkOwlRelationshipsReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UploadBulkOwlRelationships: ReactorContract<
		SourceParameters<"database" | "filePath" | "space" | "sync", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/database/UploadDatabaseReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	UploadDatabase: ReactorContract<
		SourceParameters<"filePath" | "global" | "space", "both">,
		Record<string, unknown> | null,
		false
	>;
}
