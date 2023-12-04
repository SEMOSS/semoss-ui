import { styled } from '@semoss/ui';
import { observer } from 'mobx-react-lite';

import { Page } from '@/components/ui';

import { NotebookMenu } from './NotebookMenu';
import { NotebookSheet } from './NotebookSheet';

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
    return (
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
    );
});
