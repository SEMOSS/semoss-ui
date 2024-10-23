import { styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

import { NotebookSheet } from './NotebookSheet';
import { useEffect, useState } from 'react';
import { NotebookSheetsMenu } from './NotebookSheetsMenu';

import { usePixel } from '@/hooks';

import { LLMContext } from '@/contexts';

const StyledNotebook = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

export const Notebook = observer(() => {
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
            <LLMContext.Provider
                value={{
                    modelId: modelId,
                    modelOptions: models,
                    setModel: (id) => {
                        setModelId(id);
                    },
                }}
            >
                <NotebookSheetsMenu />
                <NotebookSheet />
            </LLMContext.Provider>
        </StyledNotebook>
    );
});
