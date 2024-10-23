import { Tooltip, styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';
import { Code } from '@mui/icons-material';

import { Sidebar, SidebarItem, SidebarText } from '@/components/common';

import { NotebookVariablesMenu } from './NotebookVariablesMenu';
import { NotebookSheet } from './NotebookSheet';
import { useEffect, useState } from 'react';
import { NotebookSheetsMenu } from './NotebookSheetsMenu';

import { useBlocks, usePixel } from '@/hooks';

import { LLMContext } from '@/contexts';

const StyledNotebook = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
    // width: '50%',
    overflow: 'hidden',
    // border: 'solid red',
}));

const StyledRightPanel = styled('div')(() => ({
    height: '100%',
    flex: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
}));

export const Notebook = observer(
    (props: { collapseComponent?: JSX.Element }) => {
        const { state } = useBlocks();

        // view
        const [view, setView] = useState<
            'variables' | 'sources' | 'blocks' | 'transform' | 'variants' | ''
        >('variables');

        /**
         * Set the view. If it is the same, close it
         * @param v
         */
        const updateView = (v: typeof view) => {
            // close if not passed in or the same
            if (!v || v === view) {
                setView('');
                return;
            }

            // set the view
            setView(v);
        };

        const [modelId, setModelId] = useState<string>('');
        const [models, setModels] = useState<
            { app_id: string; app_name: string }[]
        >([]);

        const myModels = usePixel<{ app_id: string; app_name: string }[]>(`
    MyEngines(engineTypes=['MODEL']);
    `);

        useEffect(() => {
            if (myModels.status !== 'SUCCESS') {
                return;
            }

            setModels(
                myModels.data.map((d) => ({
                    app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
                    app_id: d.app_id,
                })),
            );

            setModelId(myModels.data.length ? myModels.data[0].app_id : '');
        }, [myModels.status, myModels.data]);

        return (
            <StyledNotebook>
                <StyledRightPanel>
                    <LLMContext.Provider
                        value={{
                            modelId: modelId,
                            modelOptions: models,
                            setModel: (id) => {
                                setModelId(id);
                            },
                        }}
                    >
                        <>
                            {props.collapseComponent}
                            <NotebookSheetsMenu />
                            <NotebookSheet />
                        </>
                    </LLMContext.Provider>
                </StyledRightPanel>
            </StyledNotebook>
        );
    },
);
