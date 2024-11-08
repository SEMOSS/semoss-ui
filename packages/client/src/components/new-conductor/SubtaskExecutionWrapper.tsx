import React, { useEffect, useState } from 'react';
import { SubtaskExecution } from './SubtaskExecution';
import { useConductor } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { StateStore } from '@/stores';
import { Blocks } from '../blocks';
import { DefaultBlocks } from '../block-defaults';
import { DefaultCells } from '../cell-defaults';

interface SubtaskExecutionWrapperProps {
    /**
     * id of the subtask
     */
    id: string;
    threadedExecuteTrigger: number;
}

export const SubtaskExecutionWrapper = observer(
    (props: SubtaskExecutionWrapperProps) => {
        const { id } = props;
        const { threadedExecuteTrigger } = props;

        const { conductor } = useConductor();
        const subtask = conductor.getSubtask(id);

        const [stateStore, setStateStore] = useState<StateStore | null>(null);

        useEffect(() => {
            if (subtask.selectedApp && subtask.isReady) {
                const app = subtask.apps.find(
                    (app) => app.project_id === subtask.selectedApp,
                );

                if (app) {
                    // create a new state store
                    const store = new StateStore({
                        mode: 'interactive',
                        insightId: 'new',
                        state: app.state,
                        cellRegistry: DefaultCells,
                        initialParams: subtask.inputs,
                    });

                    setStateStore(store);
                }
            }
        }, []);

        if (!subtask) {
            return <>unable to locate subtask</>;
        }

        if (!stateStore) {
            return <>do not have state for Blocks context</>;
        }

        return (
            <Blocks state={stateStore} registry={DefaultBlocks}>
                <SubtaskExecution
                    id={id}
                    threadedExecuteTrigger={threadedExecuteTrigger}
                />
            </Blocks>
        );
    },
);
