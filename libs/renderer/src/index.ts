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
} from "./store";

export type {
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
    QueryStateConfig
} from "./store";

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
export { CodeCellConfig } from "./components/cell-defaults/code-cell";
export { DataImportCellConfig } from "./components/cell-defaults/data-import-cell";

export { DataImportFormModal } from "./components/shared/DataImportFormModal";

// HOOKS
export { useBlocks, useBlocksPixel } from "./hooks";
