import { ConductorContext } from '@/contexts';
import { ConductorStore } from '@/stores';
import { Conductor, TEST_LIST_OF_STEPS } from '@/components/new-conductor';
import { Stack } from '@semoss/ui';

export const NewConductorPage = () => {
    const conductor = new ConductorStore({
        inputPool: {},
        steps: TEST_LIST_OF_STEPS,
        initPrompt: '',
        subTasks: [],
    });

    return (
        <Stack sx={{ height: '100%', overflow: 'scroll', padding: '25px' }}>
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
