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
                <Stack direction={'column'} alignItems={'start'} spacing={2}>
                    <Stack
                        direction={'row'}
                        justifyContent={'space-between'}
                        alignItems={'center'}
                        alignSelf={'stretch'}
                        spacing={2}
                    >
                        <Typography variant={'h5'} fontWeight="medium">
                            Start from our tools
                        </Typography>
                        <StyledButton
                            size="large"
                            variant="contained"
                            startIcon={<FileUploadOutlined />}
                            onClick={() => setIsUploadOpen(true)}
                            disableRipple={true}
                            data-testid={'new-app-upload-btn'}
                        >
                            Upload App
                        </StyledButton>
                    </Stack>
                    <Stack
                        direction={'row'}
                        alignItems={'flex-start'}
                        flexWrap={'wrap'}
                        gap={3}
                        spacing={0}
                    >
                        <StyledBox location="first">
                            <StyledBoxContent>
                                <StyledBoxHeader>
                                    <Typography variant={'h6'}>Code</Typography>
                                    <Typography variant={'body1'}>
                                        Choose a framework or start coding from
                                        scratch. Develop your app within our
                                        code editor feature to seamlessly code
                                        and preview your live application!
                                    </Typography>
                                </StyledBoxHeader>
                                <Stack direction="row">
                                    <StyledButton
                                        size="large"
                                        variant="contained"
                                        onClick={() =>
                                            setNewAppOptions({
                                                type: 'code',
                                            })
                                        }
                                        data-testid={'new-app-code-btn'}
                                    >
                                        Get Started
                                    </StyledButton>
                                </Stack>
                            </StyledBoxContent>
                            <StyledBoxImage
                                src={CodeSprite}
                                height={'143.513px'}
                                width={'131.539px'}
                            />
                        </StyledBox>
                        <StyledBox location="second">
                            <StyledBoxContent>
                                <StyledBoxHeader>
                                    <Typography variant={'h6'}>
                                        Drag and Drop
                                    </Typography>
                                    <Typography variant={'body1'}>
                                        Drag and drop UI components to make your
                                        app come to life. Customize the design
                                        of your app in this no-code environment.
                                    </Typography>
                                </StyledBoxHeader>
                                <Stack direction="row">
                                    <StyledButton
                                        size="large"
                                        variant="contained"
                                        onClick={() =>
                                            setNewAppOptions({
                                                type: 'blocks',
                                                state: {
                                                    version: STATE_VERSION,
                                                    variables: {},
                                                    queries: {},
                                                    blocks: BASE_PAGE_BLOCKS,
                                                    executionOrder: [],
                                                },
                                            })
                                        }
                                        data-testid={'new-app-drag-btn'}
                                    >
                                        Get Started
                                    </StyledButton>
                                </Stack>
                            </StyledBoxContent>
                            <StyledBoxImage
                                src={BlocksSprite}
                                height={'166.818px'}
                                width={'130.624px'}
                            />
                        </StyledBox>
                        <StyledBox location="third">
                            <StyledBoxContent>
                                <StyledBoxHeader>
                                    <Typography variant={'h6'}>
                                        Agent Builder
                                    </Typography>
                                    <Typography variant={'body1'}>
                                        Engineer a prompt to interact with your
                                        LLM. Structure the text and design
                                        inputs to generate the optimal AI
                                        response.
                                    </Typography>
                                </StyledBoxHeader>
                                <Stack direction="row">
                                    <StyledButton
                                        size="large"
                                        variant="contained"
                                        onClick={() =>
                                            navigate('/app/new/prompt')
                                        }
                                        data-testid={'new-app-agent-btn'}
                                    >
                                        Get Started
                                    </StyledButton>
                                </Stack>
                            </StyledBoxContent>
                            <StyledBoxImage
                                src={PromptSprite}
                                height={'178.973px'}
                                width={'108.189px'}
                            />
                        </StyledBox>
                    </Stack>
                </Stack>
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
