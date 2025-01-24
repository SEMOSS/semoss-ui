/**
 * ------------------------------------------------
 * MODULES THAT COME WITH OUR RENDERER PACKAGE
 * BE MINDFUL OF WHAT WE EXPORT
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
} from "./store";

// REGISTRY AND MENUS
export { DefaultCells } from "./components/cell-defaults";
export {
    DefaultBlocks,
    VISUALIZATION_MENU,
    DEFAULT_MENU,
} from "./components/block-defaults";
export type { DesignerMenuItem } from "./components/block-defaults/menu-types";

export {
    BLOCK_TYPE_INPUT,
    BLOCK_TYPE_COMPARE,
} from "./components/block-defaults/block-defaults.constants";

export * from "./components/block-defaults";
export * from "./components/cell-defaults";

export { QueryImportCellConfig } from "./components/cell-defaults/query-import-cell";
export { CodeCellConfig } from "./components/cell-defaults/code-cell";

// HOOKS
export { useBlocks } from "./hooks";
