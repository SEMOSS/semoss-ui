import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Refresh } from '@mui/icons-material';
import { IconButton } from '@semoss/ui';

import { useWorkspace } from '@/hooks';

import { CodeRenderer } from '../CodeRenderer';
import { Panel } from '@/components/workspace';

export const RendererPanel = observer(() => {
    // App ID Needed for pixel calls
    const { workspace } = useWorkspace();

    // temporary fix for dead refresh button should be removed
    const [counter, setCounter] = useState(0);

    return (
        <Panel
            actions={
                <>
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
                </>
            }
        >
            <CodeRenderer appId={workspace.appId} key={counter} />
        </Panel>
    );
});
