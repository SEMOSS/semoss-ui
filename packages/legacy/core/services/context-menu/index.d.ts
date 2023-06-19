export interface ContextMenuUIOptions {
    event: MouseEvent;
    visualizationType: string;
    widgetId: string;
}

export interface ContextMenuService {
    initialize(): void;
}

export interface ContextMenuState {
    widgetId: string;
    visualizationType: string;
    eventType?: string;
    header?: {
        name: string;
    };
    open: boolean;
    selected?: boolean;
    value?: string;
}
