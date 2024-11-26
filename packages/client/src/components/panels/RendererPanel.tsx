import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Refresh } from '@mui/icons-material';
import { IconButton } from '@semoss/ui';

import { Panel } from './Panel';
import { AppRenderer } from '@/components/app';

interface RendererPanelProps {
    appId: string;
}

export const RendererPanel = observer((props: RendererPanelProps) => {
    // App ID Needed for pixel calls
    const { appId } = props;

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
            <AppRenderer appId={appId} />;
        </Panel>
    );
});
