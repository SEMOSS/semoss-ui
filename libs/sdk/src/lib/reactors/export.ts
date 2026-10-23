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

export interface ExportReactorCatalog {
	/**
	 * @source Semoss/src/prerna/reactor/export/AsTaskReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	AsTask: ReactorContract<SourceParameters<"value", "both">, unknown, false>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Collect: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "limit" | "qs" | "task",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectAllReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectAll: ReactorContract<
		SourceParameters<"FORMATTED_DATA_SET" | "qs" | "task", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectGGPlotReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectGGPlot: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "format" | "ggplot" | "qs" | "task",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectGraphReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectGraph: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "frame" | "qs" | "task",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectPivotReactor.java
	 * @source Semoss/src/prerna/reactor/frame/py/CollectPivotReactor.java
	 * @source Semoss/src/prerna/reactor/frame/r/CollectPivotReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectPivot: ReactorContract<
		| SourceParameters<
				"columns" | "frameType" | "rowGroups" | "values",
				"named"
		  >
		| SourceParameters<
				| "FORMATTED_DATA_SET"
				| "columns"
				| "json"
				| "optional"
				| "qs"
				| "rowGroups"
				| "sections"
				| "task"
				| "values",
				"both"
		  >
		| SourceParameters<
				| "FORMATTED_DATA_SET"
				| "columns"
				| "qs"
				| "rowGroups"
				| "task"
				| "values",
				"both"
		  >,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectSeabornReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectSeaborn: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "format" | "qs" | "splot" | "task",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/CollectVizNetworkReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	CollectVizNetwork: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "qs" | "task" | "vizNetwork",
			"both"
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ConvertToQueryReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ConvertToQuery: ReactorContract<
		SourceParameters<"ignoreState" | "qs" | "task", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/DropBoxUploaderReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	DropBoxUploader: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "filename" | "qs" | "task",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/EmptyDataReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EmptyData: ReactorContract<
		SourceParameters<"value", "both">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/EncryptPdfReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	EncryptPdf: ReactorContract<
		SourceParameters<
			| "allowAssemble"
			| "allowCopy"
			| "allowModify"
			| "allowPrint"
			| "filePath"
			| "password"
			| "readOnly"
			| "space",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ExportImageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportImage: ReactorContract<
		SourceParameters<
			"baseUrl" | "fileName" | "filePath" | "imageWaitTime" | "url",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ExportRunPixelTaskDataToFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportRunPixelTaskDataToFile: ReactorContract<
		SourceParameters<
			"deleteAfterInsightClose" | "fileName" | "index" | "value",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ExportToExcelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportToExcel: ReactorContract<
		SourceParameters<
			| "column_gutter"
			| "exportAudit"
			| "export_template"
			| "fileName"
			| "filePath"
			| "headers"
			| "height"
			| "html"
			| "limit"
			| "merge"
			| "panelOrderIds"
			| "password"
			| "placeHolderData"
			| "project"
			| "rowgutter"
			| "sheet"
			| "tfooter"
			| "theader"
			| "width",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ExportToExcelNNReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportToExcelNN: ReactorContract<
		SourceParameters<
			| "exportAudit"
			| "export_template"
			| "fileName"
			| "filePath"
			| "password"
			| "usePanel",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ExportToPPTReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportToPPT: ReactorContract<
		SourceParameters<"fileName" | "filePath" | "task", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ExportToPPTNNReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ExportToPPTNN: ReactorContract<
		SourceParameters<
			| "export_template"
			| "fileName"
			| "filePath"
			| "height"
			| "shapeIndex"
			| "slideLayout"
			| "usePanel"
			| "width",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/FrameCacheReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	FrameCache: ReactorContract<
		SourceParameters<never, "positional">,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/GoogleUploaderReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GoogleUploader: ReactorContract<
		SourceParameters<
			"FORMATTED_DATA_SET" | "filename" | "qs" | "task",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/GrabScalarElementReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	GrabScalarElement: ReactorContract<
		SourceParameters<"cleanUp" | "task", "both">,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/InspectPptxReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	InspectPptx: ReactorContract<
		SourceParameters<
			| "checkConsistency"
			| "context"
			| "engine"
			| "filePath"
			| "instructions"
			| "slides"
			| "space",
			"both",
			["filePath", "instructions"],
			2
		>,
		unknown,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/IterateReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	Iterate: ReactorContract<
		SourceParameters<"qs" | "store" | "useFrameFilters", "named">,
		{ taskId: string },
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/PdfToImageReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PdfToImage: ReactorContract<
		SourceParameters<"filePath" | "space", "both", ["filePath"], 1>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/postgres/PostgresCopyReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	PostgresCopy: ReactorContract<
		SourceParameters<
			| "database"
			| "delimiter"
			| "filePath"
			| "format"
			| "nullValue"
			| "space"
			| "table",
			"both"
		>,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/QueryRowCountReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	QueryRowCount: ReactorContract<
		SourceParameters<"qs", "both">,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/snowflake/SnowflakeCopyIntoReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SnowflakeCopyInto: ReactorContract<
		SourceParameters<
			| "database"
			| "dateFormat"
			| "fieldOptionallyEnclosedBy"
			| "fileCompression"
			| "fileType"
			| "files"
			| "force"
			| "formatName"
			| "matchByColumnName"
			| "namedStage"
			| "parseHeader"
			| "pattern"
			| "table"
			| "tableStage"
			| "timeFormat"
			| "timestampFormat"
			| "userStage",
			"both",
			["database", "table"],
			2
		>,
		string,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/snowflake/SnowflakeListFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SnowflakeListFiles: ReactorContract<
		SourceParameters<
			"database" | "namedStage" | "tableStage" | "userStage",
			"both",
			["database"],
			1
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/snowflake/SnowflakePutReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SnowflakePut: ReactorContract<
		SourceParameters<
			| "autoCompress"
			| "database"
			| "filePath"
			| "namedStage"
			| "overwrite"
			| "parallel"
			| "sourceCompression"
			| "space"
			| "tableStage"
			| "userStage",
			"both",
			["database", "filePath"],
			2
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/snowflake/SnowflakeRemoveFilesReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	SnowflakeRemoveFiles: ReactorContract<
		SourceParameters<
			"database" | "namedStage" | "tableStage" | "userStage",
			"both",
			["database"],
			1
		>,
		unknown[] | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/TableToXLSXReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	TableToXLSX: ReactorContract<
		SourceParameters<
			| "column_gutter"
			| "export_template"
			| "fileName"
			| "headers"
			| "html"
			| "merge"
			| "project"
			| "rowgutter"
			| "sheet"
			| "tfooter"
			| "theader",
			"both",
			["sheet", "html"],
			2
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToCsvReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToCsv: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "appendTimestamp"
			| "fileName"
			| "filePath"
			| "qs"
			| "task",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToDatabaseReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToDatabase: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "batchSize"
			| "ignoreOWL"
			| "insertId"
			| "override"
			| "qs"
			| "targetDatabase"
			| "targetTable"
			| "task",
			"both"
		>,
		boolean,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToDocxReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToDocx: ReactorContract<
		SourceParameters<
			| "fileName"
			| "filePath"
			| "html"
			| "imageWaitTime"
			| "markdown"
			| "mustache"
			| "mustacheVars"
			| "outputFilePath"
			| "url",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToExcelReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToExcel: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "fileName"
			| "filePath"
			| "panel"
			| "password"
			| "qs"
			| "task",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToLoaderSheetReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToLoaderSheet: ReactorContract<
		SourceParameters<"database", "both">,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToPPTReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToPPT: ReactorContract<
		SourceParameters<
			"baseUrl" | "fileName" | "filePath" | "imageWaitTime" | "url",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToPdfReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToPdf: ReactorContract<
		SourceParameters<
			| "fileName"
			| "filePath"
			| "html"
			| "imageWaitTime"
			| "markdown"
			| "mustache"
			| "mustacheVars"
			| "outputFilePath"
			| "pdfPageNumbers"
			| "pdfPageNumbersIgnoreFirst"
			| "pdfSignatureBlock"
			| "pdfSignatureLabel"
			| "pdfStartPageNumbers"
			| "space"
			| "url",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/postgres/ToPostgresCopyReactor.java
	 * @deprecated Backend reactor class is deprecated.
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToPostgresCopy: ReactorContract<
		SourceParameters<
			| "database"
			| "delimiter"
			| "filePath"
			| "format"
			| "nullValue"
			| "space"
			| "table",
			"both"
		>,
		number,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToTsvReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToTsv: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "appendTimestamp"
			| "fileName"
			| "filePath"
			| "qs"
			| "task",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToTxtReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToTxt: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "appendTimestamp"
			| "delimiter"
			| "fileName"
			| "filePath"
			| "qs"
			| "task",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/ToXmlReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	ToXml: ReactorContract<
		SourceParameters<
			| "FORMATTED_DATA_SET"
			| "appendTimestamp"
			| "fileName"
			| "filePath"
			| "qs"
			| "task",
			"both"
		>,
		string | null,
		false
	>;
	/**
	 * @source Semoss/src/prerna/reactor/export/WriteObjectToFileReactor.java
	 * @remarks Source-derived base contract; remaining semantic gaps are tracked in contract-gaps.json.
	 */
	WriteObjectToFile: ReactorContract<
		SourceParameters<"value", "both">,
		unknown,
		false
	>;
}
