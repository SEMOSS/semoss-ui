/**
 * ------------------------------------------------
 * MODULES THAT COME WITH OUR RENDERER PACKAGE
 * BE MINDFUL OF WHAT WE EXPORT
 *
 * TODO: clean up what gets exported
 * ------------------------------------------------
 */

export { RendererEngine } from "./components/blocks";
/**
 * PRE-CANNED MODULE THAT HANDLES APP INTERACTION (END-USER)
 */
export * from "./renderer";

/**
 * ------------------------------------------------
 * MODULES THAT ALLOW YOU TO MODIFY JSON
 * ------------------------------------------------
 */

export * from "./components/block-defaults";
export { DefaultBlocks } from "./components/block-defaults";
export { BLOCK_TYPE_INPUT } from "./components/block-defaults/block-defaults.constants";
export type { EchartVisualizationBlockDef } from "./components/block-defaults/echart-visualization-block";
export type { GridBlockDef } from "./components/block-defaults/grid-block";
export type {
	CellBackgroundSettings,
	ChartTitleSettings,
	ColorRule,
	HeaderBackgroundSettings,
	WrapTextSettings,
} from "./components/block-defaults/grid-block/grid-block";
export type { GridBlockColumn } from "./components/block-defaults/grid-block/grid-block.types";
export type { GridDynamicFrameBlockDef } from "./components/block-defaults/grid-dynamic-frame-block";
export type { PDFViewerBlockDef } from "./components/block-defaults/pdfViewer-block";
export type { RadioBlockDef } from "./components/block-defaults/radio-block";
// Wrapper that gives context to hooks that interact with configs stored on JSON
export { Blocks } from "./components/blocks/Blocks";
export * from "./components/cell-defaults";
// REGISTRY AND MENUS
export { DefaultCells } from "./components/cell-defaults";
export { CodeCellConfig } from "./components/cell-defaults/code-cell";
export { DataImportCellConfig } from "./components/cell-defaults/data-import-cell";
export { FilterDataCellConfig } from "./components/cell-defaults/filter-data-cell";
export { NotebookImportCellConfig } from "./components/cell-defaults/notebook-import-cell";
export { UnFilterDataCellConfig } from "./components/cell-defaults/unfilter-data-cell";
export { DataImportFormModal } from "./components/shared/data-import-form-modal";
// HOOKS
export {
	useBlock,
	useBlocks,
	useBlocksPixel,
	useFrame,
	useFrameHeaders,
} from "./hooks";
export type {
	Block,
	BlockComponent,
	BlockDef,
	BlockJSON,
	CellState,
	CellStateConfig,
	ListenerActions,
	NewCellAction,
	NotebookState,
	NotebookStateConfig,
	SerializedState,
	Variable,
	VariableType,
	VariableWithId,
	Variant,
} from "./store";
export {
	ACTIONS_DISPLAY,
	ActionMessages,
	INPUT_BLOCK_TYPES,
	MigrationManager,
	STATE_VERSION,
	StateStore,
	VARIABLE_TYPES,
} from "./store";
export type {
	Paths,
	PathValue,
} from "./types";
export { copy, getValueByPath } from "./utility";
