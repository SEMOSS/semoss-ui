import { useContext } from 'react';

import { MetamodelContext, MetamodelContextType } from '@/contexts';

/**
 * Access the current Metamodel Context
 * @returns the Metamodel Context
 */
export function useMetamodel(): MetamodelContextType {
    const context = useContext(MetamodelContext);
    if (context === undefined) {
        throw new Error('useMetamodel must be used within MetamodelProvider');
    }

    return context;
}
