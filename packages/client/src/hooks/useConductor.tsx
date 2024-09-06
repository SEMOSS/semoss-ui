import { ConductorContext } from '@/contexts/ConductorContext';
import { useContext } from 'react';

/**
 * Access our Conductor Store
 */
export const useConductor = () => {
    const context = useContext(ConductorContext);
    if (context === undefined) {
        throw new Error('useConductor must be used within Conductor Context');
    }

    return context;
};
