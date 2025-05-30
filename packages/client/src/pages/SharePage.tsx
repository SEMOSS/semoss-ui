import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { styled, useNotification } from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { CodeRenderer } from '@/components/code-workspace';

import { AppType, AppMetadata } from '@/components/app';

import { Renderer } from '@semoss/renderer';
import { runPixelTwo } from '../runPixelTwo';

const StyledViewport = styled('div')(() => ({
    display: 'flex',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
}));

export const SharePage = observer(() => {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { monolithStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const [type, setType] = useState<AppType | null>(null);
    const [insightId, setInsightId] = useState('');

    /**
     * Load an app
     *
     * @param appId - id of app to load into the workspace
     */
    const loadApp = async (appId: string) => {
        try {
            // clear the type
            setType(null);

            // check the permission
            const getUserProjectPermission =
                await monolithStore.getUserProjectPermission(appId);

            // get the role and throw an error if it is missing
            const role = getUserProjectPermission.permission;
            if (!role) {
                throw new Error('Unauthorized');
            }

            const { insightId: iId } = await runPixelTwo(
                `SetContext("${appId}")`,
                'new',
            );
            setInsightId(iId);

            // get the metadata
            const getAppInfo = await monolithStore.runQuery<[AppMetadata]>(
                `ProjectInfo(project=["${appId}"]);`,
                iId,
            );

            // throw the errors if there are any
            if (getAppInfo.errors.length > 0) {
                throw new Error(getAppInfo.errors.join(''));
            }

            const metadata = {
                ...getAppInfo.pixelReturn[0].output,
            };

            let type: AppType = 'CODE';
            // set it as blocks
            if (metadata.project_type === 'BLOCKS') {
                type = 'BLOCKS';
            }

            setType(type);
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });

            navigate('/');
        }
    };

    // load the app
    useEffect(() => {
        loadApp(appId);
    }, [appId]);

    // hide the screen while it loads
    if (!type) {
        return <LoadingScreen.Trigger />;
    }

    return (
        <StyledViewport>
            {type === 'CODE' ? <CodeRenderer appId={appId} /> : null}
            {type === 'BLOCKS' ? (
                <Renderer appId={appId} insightId={insightId} />
            ) : null}
        </StyledViewport>
    );
});
