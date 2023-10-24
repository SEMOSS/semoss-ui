export type Role =
    | 'OWNER'
    | 'EDIT'
    | 'VIEWER'
    | 'READ_ONLY'
    | 'DISCOVERABLE'
    | 'EDITOR';

export interface PixelCommand {
    type: string;
    components: any[];
    terminal?: boolean;
    meta?: boolean;
}

/**
 * All types used in the app
 */
export type ALL_TYPES = 'APP' | ENGINE_TYPES;

/**
 * Engine types used in the app
 */
export type ENGINE_TYPES =
    | 'DATABASE'
    | 'STORAGE'
    | 'MODEL'
    | 'VECTOR'
    | 'FUNCTION';
