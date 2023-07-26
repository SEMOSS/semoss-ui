import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { Stack, Typography, Button } from '@semoss/ui';

import { Page } from '@/components/ui';
import { useRootStore } from '@/hooks';

/**
 * Library page that allows a user to see all the currently installed apps
 */
export const HomePage = observer((): JSX.Element => {
    const { workspaceStore } = useRootStore();

    // navigation
    const navigate = useNavigate();

    /**
     * Open an app
     */
    const openNewApp = async () => {
        // open the app
        const app = await workspaceStore.openNewApp();

        // navigate to it
        if (app) {
            navigate(`app`);
        }
    };

    /**
     * Select an app
     */
    const selectApp = (id: string) => {
        // open the app
        const app = workspaceStore.selectApp(id);

        // navigate to it
        if (app) {
            navigate(`app`);
        }
    };

    return (
        <Page
            header={
                <Stack
                    direction="row"
                    alignItems={'center'}
                    justifyContent={'space-between'}
                    spacing={4}
                >
                    <Typography variant={'h4'}>Home</Typography>
                </Stack>
            }
        >
            <Stack spacing={1}>
                <div>Loading {JSON.stringify(workspaceStore.isLoading)}</div>
                <Button onClick={() => openNewApp()}>New App</Button>
                {workspaceStore.appList.map((a) => {
                    return (
                        <Button
                            key={a.id}
                            onClick={() => {
                                // select it
                                selectApp(a.id);
                            }}
                        >
                            {a.options.name} Is Loading:
                            {JSON.stringify(a.isLoading)}
                        </Button>
                    );
                })}
            </Stack>
        </Page>
    );
});
