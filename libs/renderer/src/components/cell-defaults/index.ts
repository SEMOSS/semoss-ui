import type { CellRegistry } from "../../store";
import { CodeCellConfig, type CodeCellDef } from "./code-cell";
import {
	CollapseTransformationCellConfig,
	type CollapseTransformationCellDef,
} from "./collapse-transformation-cell";
import {
	ColumnTypeTransformationCellConfig,
	type ColumnTypeTransformationCellDef,
} from "./column-type-transformation-cell";
import {
	CumulativeSumTransformationCellConfig,
	type CumulativeSumTransformationCellDef,
} from "./cumulative-sum-transformation-cell";
import {
	DataImportCellConfig,
	type DataImportCellDef,
} from "./data-import-cell";
import {
	DateDifferenceTransformationCellConfig,
	type DateDifferenceTransformationCellDef,
} from "./date-difference-transformation-cell";
import {
	EncodeColumnTransformationCellConfig,
	type EncodeColumnTransformationCellDef,
} from "./encode-column-transformation-cell";
import {
	FilterDataCellConfig,
	type FilterDataCellDef,
} from "./filter-data-cell";
import {
	JoinTransformationCellConfig,
	type JoinTransformationCellDef,
} from "./join-transformation-cell";
import { LLMCellConfig, type LLMCellDef } from "./llm-cell";
import { MCPToolCellConfig, type MCPToolCellDef } from "./mcp-tool-cell";
import {
	QueryImportCellConfig,
	type QueryImportCellDef,
} from "./query-import-cell";
import { SendEmailCellConfig, type SendEmailCellDef } from "./send-email-cell";
import type { TransformationCellDef } from "./shared";
import { TextToSqlCellConfig, type TextToSqlCellDef } from "./text-to-sql-cell";
import {
	TimestampTransformationCellConfig,
	type TimestampTransformationCellDef,
} from "./timestamp-transformation-cell";
import {
	UnFilterDataCellConfig,
	type UnFilterDataCellDef,
} from "./unfilter-data-cell";
import {
	UpdateRowTransformationCellConfig,
	type UpdateRowTransformationCellDef,
} from "./update-row-transformation-cell";
import {
	UppercaseTransformationCellConfig,
	type UppercaseTransformationCellDef,
} from "./uppercase-transformation-cell";

export type DefaultCellDefinitions =
	| CodeCellDef
	| CollapseTransformationCellDef
	| ColumnTypeTransformationCellDef
	| CumulativeSumTransformationCellDef
	| EncodeColumnTransformationCellDef
	| DataImportCellDef
	| DateDifferenceTransformationCellDef
	| FilterDataCellDef
	| JoinTransformationCellDef
	| LLMCellDef
	| MCPToolCellDef
	| QueryImportCellDef
	| SendEmailCellDef
	| TextToSqlCellDef
	| TransformationCellDef
	| TimestampTransformationCellDef
	| UnFilterDataCellDef
	| UppercaseTransformationCellDef
	| UpdateRowTransformationCellDef;

export const DefaultCells: CellRegistry<DefaultCellDefinitions> = {
	[CodeCellConfig.widget]: CodeCellConfig,
	[QueryImportCellConfig.widget]: QueryImportCellConfig,
	[FilterDataCellConfig.widget]: FilterDataCellConfig,
	[UnFilterDataCellConfig.widget]: UnFilterDataCellConfig,
	[DataImportCellConfig.widget]: DataImportCellConfig,
	[MCPToolCellConfig.widget]: MCPToolCellConfig,
	[UppercaseTransformationCellConfig.widget]:
		UppercaseTransformationCellConfig,
	[UpdateRowTransformationCellConfig.widget]:
		UpdateRowTransformationCellConfig,
	[ColumnTypeTransformationCellConfig.widget]:
		ColumnTypeTransformationCellConfig,
	[DateDifferenceTransformationCellConfig.widget]:
		DateDifferenceTransformationCellConfig,
	[TextToSqlCellConfig.widget]: TextToSqlCellConfig,
	[TimestampTransformationCellConfig.widget]:
		TimestampTransformationCellConfig,
	[JoinTransformationCellConfig.widget]: JoinTransformationCellConfig,
	[CumulativeSumTransformationCellConfig.widget]:
		CumulativeSumTransformationCellConfig,
	[EncodeColumnTransformationCellConfig.widget]:
		EncodeColumnTransformationCellConfig,
	[CollapseTransformationCellConfig.widget]: CollapseTransformationCellConfig,
	[LLMCellConfig.widget]: LLMCellConfig,
	[SendEmailCellConfig.widget]: SendEmailCellConfig,
} as const;

const filteredTransformations: Partial<CellRegistry<DefaultCellDefinitions>> =
	{};

const filteredOtherCells: Partial<CellRegistry<DefaultCellDefinitions>> = {};
// Iterate through the data object and filter out the cell types that have 'transformation' key
Object.entries(DefaultCells).forEach(([key, value]) => {
	const val = value;

	if (val.parameters && val.parameters.transformation) {
		filteredTransformations[key] = value;
	}
});

Object.entries(DefaultCells).forEach(([key, value]) => {
	const val = value;

	if (val.parameters && val.parameters.others) {
		filteredTransformations[key] = value;
	}
});

export const TransformationCells = filteredTransformations;

export const OtherCells = filteredOtherCells;
