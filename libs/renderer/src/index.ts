/**
 * ------------------------------------------------
 * MODULES THAT COME WITH OUR RENDERER PACKAGE
 * BE MINDFUL OF WHAT WE EXPORT
 *
 * TODO: clean up what gets exported
 * ------------------------------------------------
 */

/**
 * PRE-CANNED MODULE THAT HANDLES APP INTERACTION (END-USER)
 */
export * from "./Renderer";
export { RendererEngine } from "./components/blocks";

/**
 * ------------------------------------------------
 * MODULES THAT ALLOW YOU TO MODIFY JSON
 * ------------------------------------------------
 */

// Wrapper that gives context to hooks that interact with configs stored on JSON
export { Blocks } from "./components/blocks/Blocks";

export {
    StateStore,
    ActionMessages,
    VARIABLE_TYPES,
    INPUT_BLOCK_TYPES,
    MigrationManager,
    STATE_VERSION,
    ACTIONS_DISPLAY,
} from "./store";

export type {
    BlockComponent,
    SerializedState,
    Variable,
    BlockJSON,
    CellStateConfig,
    QueryState,
    VariableType,
    VariableWithId,
    CellState,
    NewCellAction,
    Block,
    QueryStateConfig,
    BlockDef,
    ListenerActions,
    Variant,
} from "./store";

export type { GridBlockColumn } from "./components/block-defaults/grid-block/grid-block.types";
export type { RadioBlockDef } from "./components/block-defaults/radio-block";
export type { PDFViewerBlockDef } from "./components/block-defaults/pdfViewer-block";
export type { EchartVisualizationBlockDef } from "./components/block-defaults/echart-visualization-block";
export type { GridDynamicFrameBlockDef } from "./components/block-defaults/grid-dynamic-frame-block";
export type { GridBlockDef } from "./components/block-defaults/grid-block";
export type { LLMComparisonBlockDef } from "./components/block-defaults/llm-comparison-block";
export type {
    CellBackgroundSettings,
    ChartTitleSettings,
    ColorRule,
    HeaderBackgroundSettings,
    WrapTextSettings,
} from "./components/block-defaults/grid-block/GridBlock";

export type {
    Paths,
    PathValue,
    TypeLlmComparisonForm,
    TypeLlmConfig,
    TypeVariants,
    TypeVariant,
} from "./types";

export { getValueByPath, copy } from "./utility";

// REGISTRY AND MENUS
export { DefaultCells } from "./components/cell-defaults";
export { DefaultBlocks } from "./components/block-defaults";

export {
    BLOCK_TYPE_INPUT,
    BLOCK_TYPE_COMPARE,
} from "./components/block-defaults/block-defaults.constants";

export * from "./components/block-defaults";
export * from "./components/cell-defaults";

export { QueryImportCellConfig } from "./components/cell-defaults/query-import-cell";
export { FilterDataCellConfig } from "./components/cell-defaults/filter-data-cell";
export { UnFilterDataCellConfig } from "./components/cell-defaults/unfilter-data-cell";
export { CodeCellConfig } from "./components/cell-defaults/code-cell";
export { DataImportCellConfig } from "./components/cell-defaults/data-import-cell";
export { TextToSqlCellConfig } from "./components/cell-defaults/text-to-sql-cell";

export { DataImportFormModal } from "./components/shared/DataImportFormModal";

// HOOKS
export {
    useBlocks,
    useBlocksPixel,
    useBlock,
    useFrame,
    useFrameHeaders,
} from "./hooks";
