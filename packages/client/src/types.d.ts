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
