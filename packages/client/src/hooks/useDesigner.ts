import { useContext } from 'react';

import { DesignerContext, DesignerContextType } from '@/contexts';

/**
 * Access the current Engine Context
 * @returns the Engine Context
 */
export function useDesigner(): DesignerContextType {
    const context = useContext(DesignerContext);
    if (context === undefined) {
        return {
            designer: null,
        };
    }

    return context;
}
