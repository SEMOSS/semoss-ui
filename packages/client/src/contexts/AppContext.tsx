import { createContext } from 'react';

/**
 * Value
 */
export type AppContextType = {
    /**
     * ID of App
     */
    appId: string;

    /**
     * Users Permission with App
     */
    permission: string;

    /**
     * Needed to display panels in view and in navigation
     */
    editorMode: boolean;

    /**
     * Editor View (code-editor, settings, permissions)
     */
    editorView: 'code-editor' | 'settings' | 'permissions' | '';

    /**
     * Is Console Open or not
     */
    openConsole: boolean;

    /**
     * Show Loading or not
     */
    isLoading: boolean;

    /**
     * Turns Editor Mode on/off
     */
    setEditorMode: (boolean) => void;

    /**
     * Changes Layout based on selected editor panel
     */
    setEditorView: (
        value: 'code-editor' | 'settings' | 'permissions' | '',
    ) => void;

    /**
     * Open and close console
     */
    setOpenConsole: () => void;

    /**
     * Sets Loading screen
     */
    setIsLoading: (val: boolean) => void;

    /**
     * Callback to refresh Application View
     */
    refreshApp: () => void;
};

/**
 * Context
 */
export const AppContext = createContext<AppContextType>(undefined);
