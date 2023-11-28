import { useContext } from 'react';

import { NotebookContext, NotebookContextType } from '@/contexts';

/**
 * Access the current Engine Context
 * @returns the Engine Context
 */
export function useNotebook(): NotebookContextType {
    const context = useContext(NotebookContext);
    if (context === undefined) {
        throw new Error('useDesigner must be used within DesignerProvider');
    }

    return context;
}
