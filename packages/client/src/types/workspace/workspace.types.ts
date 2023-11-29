/**
 * Views that can be loaded into the workspace
 */
export type WorkspaceView = 'design' | 'data' | 'settings';

/**
 * Workspace Definition
 */
export interface WorkspaceDef<W extends string = string> {
    /** Type of the workspace */
    type: W;

    /** Options to load */
    options: Record<string, unknown>;
}
