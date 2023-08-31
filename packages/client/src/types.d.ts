export type Role = 'OWNER' | 'EDITOR' | 'VIEWER' | 'READ_ONLY' | 'DISCOVERABLE';

export interface PixelCommand {
    type: string;
    components: any[];
    terminal?: boolean;
    meta?: boolean;
}
