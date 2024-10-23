import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Refresh } from '@mui/icons-material';
import { styled, IconButton } from '@semoss/ui';

import { useWorkspace } from '@/hooks';

import { CodeRenderer } from '../CodeRenderer';

const StyledRendererContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
    width: '100%',
}));

const StyledRendererActions = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: theme.palette.secondary.light,
}));

export const EditorPanel = observer(() => {
    // App ID Needed for pixel calls
    const { workspace } = useWorkspace();

    // temporary fix for dead refresh button should be removed
    const [counter, setCounter] = useState(0);

    return (
        <StyledRendererContainer>
            <StyledRendererActions>
                <IconButton
                    size={'small'}
                    color={'default'}
                    title={'Refresh'}
                    onClick={() => {
                        // refreshApp();
                        setCounter(counter + 1);
                    }}
                >
                    <Refresh fontSize="inherit" />
                </IconButton>
            </StyledRendererActions>
            <CodeRenderer appId={workspace.appId} key={counter} />
        </StyledRendererContainer>
    );
});
