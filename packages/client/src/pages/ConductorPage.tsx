import { useEffect, useState } from 'react';
import { ConductorContext } from '@/contexts';
import { ConductorStore } from '@/stores';
import { Conductor, TEST_LIST_OF_STEPS } from '@/components/conductor';
import { Stack } from '@semoss/ui';

/**
 * TODO: Need to go get the apps as steps from the BE
 * Once we get those apps as steps, parse them into our Store
 */
export const ConductorPage = () => {
    // useEffect(() => {

    // }, [TEST_LIST_OF_STEPS.length])

    const conductor = new ConductorStore({
        inputPool: {},
        steps: TEST_LIST_OF_STEPS,
    });

    return (
        <Stack sx={{ height: '100%', overflow: 'scroll', padding: '72px' }}>
            <ConductorContext.Provider
                value={{
                    conductor: conductor,
                }}
            >
                <Conductor />
            </ConductorContext.Provider>
        </Stack>
    );
};