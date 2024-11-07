import { ConductorContext } from '@/contexts';
import { ConductorStore } from '@/stores';
import { Conductor, TEST_LIST_OF_STEPS } from '@/components/new-conductor';
import { Stack } from '@semoss/ui';
import { runPixel } from '@/api';
import { useEffect, useState } from 'react';
import { LoadingScreen } from '@/components/ui';

export const ConductorPage = () => {
    const [conductor, setConductor] = useState<ConductorStore | null>(null);

    useEffect(() => {
        const getInsightId = async () => {
            const { insightId } = await runPixel('1+1', 'new');
            const cond = new ConductorStore({
                inputPool: {},
                steps: TEST_LIST_OF_STEPS,
                initPrompt: '',
                subTasks: [],
                /**
                 * TODO:
                 * 11/5/24
                 */
                insightId: insightId,
                subtasks: [],
            });

            setConductor(cond);
        };

        getInsightId();
    }, []);

    if (!conductor) {
        return <LoadingScreen.Trigger />;
    }

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
