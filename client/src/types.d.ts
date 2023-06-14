export type Role = 'OWNER' | 'EDITOR' | 'VIEWER' | 'READ_ONLY';

export interface PixelCommand {
    type: string;
    components: any[];
    terminal?: boolean;
    meta?: boolean;
}
