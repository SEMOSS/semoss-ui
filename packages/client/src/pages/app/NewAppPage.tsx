import { useState } from 'react';
import { Stack, Typography, Container } from '@semoss/ui';
import { Navigate, useNavigate } from 'react-router-dom';
import { STATE_VERSION } from '@semoss/renderer';

import { useRootStore } from '@/hooks';
import {
    NewAppStep,
    AddAppModal,
    AppTemplates,
    NewAppModal,
} from '@/components/app';
import { BASE_PAGE_BLOCKS } from './app.constants';
import NavSection from './NavSection';

export const NewAppPage = () => {
    const navigate = useNavigate();

    const { configStore } = useRootStore();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [newAppOptions, setNewAppOptions] = useState<
        React.ComponentProps<typeof NewAppModal>['options'] | null
    >(null);

    const isNameOpen = !!newAppOptions;

    /**
     * Navigate to the app and open it
     *
     * appId - appId of the app
     */
    const navigateApp = (appId: string) => {
        if (!appId) {
            return;
        }

        navigate(`/workspace/${appId}`);
    };

    const isRestricted = !configStore.isEngineOperationAvailable('APP', 'add');
    if (isRestricted) {
        return <Navigate to="/" replace />;
    }

    const setupApp = (type: 'blocks' | 'code' | 'agent') => {
        if (type === 'blocks') {
            setNewAppOptions({
                type: 'blocks',
                state: {
                    version: STATE_VERSION,
                    variables: {},
                    queries: {},
                    blocks: BASE_PAGE_BLOCKS,
                    executionOrder: [],
                },
            });
        } else if (type === 'code') {
            setNewAppOptions({
                type: 'code',
            });
        } else if (type === 'agent') {
            navigate('/app/new/prompt');
        }
    };

    return (
        <NewAppStep
            title={'Create New App'}
            previous={{ title: 'App Library', onClick: () => navigate('/') }}
        >
            {isUploadOpen ? (
                <AddAppModal
                    open={isUploadOpen}
                    handleClose={(appId) => {
                        console.log('ok');
                        // if there is an appId navigate to it
                        if (appId) {
                            navigateApp(appId);
                        }

                        // close it
                        setIsUploadOpen(false);
                    }}
                />
            ) : null}

            {isNameOpen ? (
                <NewAppModal
                    open={isNameOpen}
                    options={newAppOptions}
                    onClose={(appId) => {
                        if (appId) {
                            navigateApp(appId);
                        } else {
                            // close the modal
                            setNewAppOptions(null);
                        }
                    }}
                />
            ) : null}
            <Container disableGutters={true} sx={{ display: 'flex' }}>
                <NavSection
                    setupApp={setupApp}
                    uploadApp={() => setIsUploadOpen(true)}
                />
            </Container>
            <Stack direction={'column'} spacing={5}>
                <Stack
                    direction={'column'}
                    alignItems={'flex-start'}
                    spacing={2}
                >
                    <Stack
                        direction={'column'}
                        alignItems={'flex-start'}
                        spacing={1}
                    >
                        <Typography variant={'h5'}>Browse Templates</Typography>
                        <Typography variant={'body1'}>
                            Don’t know where to start? Don’t worry! Browse our
                            collection of templates to start personalizing the
                            app to your specific use case.
                        </Typography>
                    </Stack>
                    <AppTemplates
                        onUse={(t) => {
                            setNewAppOptions({
                                type: 'blocks',
                                state: t.state,
                            });
                        }}
                    />
                </Stack>
            </Stack>
        </NewAppStep>
    );
};
