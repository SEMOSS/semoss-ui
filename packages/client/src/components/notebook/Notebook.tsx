import { useMemo } from 'react';
import { styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

import { useBlocks } from '@/hooks';
import { NotebookContext } from '@/contexts';
import { NotebookStore } from '@/stores';
import { Page } from '@/components/ui';

import { NotebookMenu } from './NotebookMenu';
import { NotebookSheet } from './NotebookSheet';
import { NotebookOverlay } from './NotebookOverlay';

const StyledNotebook = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledLeftPane = styled('div')(() => ({
    height: '100%',
    width: '300px',
    overflow: 'hidden',
}));

const StyledRightPane = styled('div')(() => ({
    height: '100%',
    flex: 1,
    overflow: 'hidden',
}));

export const Notebook = observer(() => {
    // get the state
    const { state } = useBlocks();

    // create a new notebook store
    const notebook = useMemo(() => {
        return new NotebookStore(state);
    }, []);

    return (
        <NotebookContext.Provider
            value={{
                notebook: notebook,
            }}
        >
            <NotebookOverlay />
            <StyledNotebook>
                <StyledLeftPane>
                    <NotebookMenu />
                </StyledLeftPane>
                <StyledRightPane>
                    <Page>
                        <NotebookSheet />
                    </Page>
                </StyledRightPane>
            </StyledNotebook>
        </NotebookContext.Provider>
    );
});
