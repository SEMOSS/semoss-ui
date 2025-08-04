/**
 * V2 Renderer with Tailwind CSS
 * This version replaces Material UI with Tailwind CSS styling
 */

/**
 * PRE-CANNED MODULE THAT HANDLES APP INTERACTION (END-USER)
 */
export { RendererV2 } from "./RendererV2";
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

// V2 Block Types
export type { ButtonBlockDefV2 } from "./components/block-defaults/button-block/ButtonBlockV2";
export type { TextBlockDefV2 } from "./components/block-defaults/text-block/TextBlockV2";
export type { InputBlockDefV2 } from "./components/block-defaults/input-block/InputBlockV2";
export type { CardBlockDefV2 } from "./components/block-defaults/card-block/CardBlockV2";

// Existing Block Types
export type { GridBlockColumn } from "./components/block-defaults/grid-block/grid-block.types";
export type { RadioBlockDef } from "./components/block-defaults/radio-block";
export type { PDFViewerBlockDef } from "./components/block-defaults/pdfViewer-block";
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
export { DefaultBlocksV2 } from "./components/block-defaults/DefaultBlocksV2";

export {
    BLOCK_TYPE_INPUT,
    BLOCK_TYPE_COMPARE,
} from "./components/block-defaults/block-defaults.constants";

// V2 Block Components
export * from "./components/block-defaults/index-v2";
export * from "./components/cell-defaults";

export { QueryImportCellConfig } from "./components/cell-defaults/query-import-cell";
export { FilterDataCellConfig } from "./components/cell-defaults/filter-data-cell";
export { UnFilterDataCellConfig } from "./components/cell-defaults/unfilter-data-cell";
export { CodeCellConfig } from "./components/cell-defaults/code-cell";
export { DataImportCellConfig } from "./components/cell-defaults/data-import-cell";

export { DataImportFormModal } from "./components/shared/DataImportFormModal";

// HOOKS
export {
    useBlocks,
    useBlocksPixel,
    useBlock,
    useFrame,
    useFrameHeaders,
} from "./hooks";

// UTILITIES
export { cn, getColorClasses, getSizeClasses } from "./utils/tailwind"; 