import { AppMetadata } from '@/components/app';
import { Role } from '@/types';
import { IJsonModel } from 'flexlayout-react';

export interface WorkspaceOptions {
    version: string;
    drawer: {
        isOpen: boolean;
    };
    layout: {
        selected: string;
        available: Record<string, WorkspaceLayout>;
    };
}

export interface WorkspaceLayout {
    /** id of the layout */
    id: string;

    /** name of the layout */
    name: string;

    /** Data associated with the layout */
    data: IJsonModel;
}

export interface WorkspaceApp {
    /**
     * Get the ID of the connected app
     */
    appId: string;

    /**
     * User's role relative to the app
     */
    role: Role;

    /**
     * Type of the app
     */
    type: 'BLOCKS' | 'CODE';

    /**
     * Metadata associated with the loaded app
     */
    metadata: AppMetadata;
}
