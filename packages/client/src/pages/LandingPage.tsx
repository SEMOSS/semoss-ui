import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useNavigate } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { Button, Box, Chip, Container, Typography, styled } from '@semoss/ui';
import { STATE_VERSION } from '@semoss/renderer';

import { UserLandingPage } from '../components/landing/UserlandingPage';
import DevBanner from '@/assets/img/DevBanner.png';
import playground from '@/assets/img/playground.png';
import AIConductor from '@/assets/img/AIConductor.png';
import NavSection from './app/NavSection';
import { useRootStore } from '@/hooks';
import { AddAppModal, NewAppModal } from '@/components/app';
import { BASE_PAGE_BLOCKS } from './app/app.constants';
import { THEME } from '@/constants';
import { FeaturedAppCard } from '@/components/landing/FeaturedAppCard';
import { BannerSection } from '@/components/landing/BannerSection';

const StyledComponent = styled(Container)(({ theme }) => ({
    position: 'absolute',
    top: theme.spacing(5),
    height: `calc(100vh - ${theme.spacing(5)})`, // Adjust height based on AppBar height
    gap: theme.spacing(3),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: '1 0 0',
    alignSelf: 'stretch',
    backgroundColor: theme.palette.background.default,
    overflow: 'auto',
    /* Media query for screens with a minimum width of 600px */
    '@media (min-width: 600px)': {
        '&.MuiContainer-root': {
            paddingLeft: theme.spacing(0),
            paddingRight: theme.spacing(0),
        },
    },
}));

export const LandingPage = observer(() => {
    const { configStore } = useRootStore();
    const navigate = useNavigate();

    const [newAppOptions, setNewAppOptions] = useState<
        React.ComponentProps<typeof NewAppModal>['options'] | null
    >(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const isNameOpen = !!newAppOptions;

    const themeMap = useMemo(() => {
        const theme = configStore.store.config['theme'];

        if (theme && theme['THEME_MAP']) {
            try {
                return JSON.parse(theme['THEME_MAP'] as string);
            } catch {
                return {};
            }
        }

        return {};
    }, [Object.keys(configStore.store.config).length]);

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

    /**
     * @name setupApp
     *
     * @description Sets initial app meta based on tile click,
     * in order to open the modal and gather more meta
     *
     * @param type - What type of app is user trying to create
     * @returns void
     */
    const setupApp = (type: 'blocks' | 'code' | 'agent'): void => {
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
        <>
            <StyledComponent
                maxWidth={false}
                sx={{
                    maxWidth: '1440px',
                    paddingLeft: '0px',
                    paddingRight: '0px',
                }}
            >
                {configStore.store.isAppBuilder ? (
                    <Box
                        sx={{
                            display: 'flex',
                            paddingTop: '40px',
                            paddingBottom: '40px',
                            paddingLeft: '40px',
                            paddingRight: '40px',
                            gap: '24px',
                            flexDirection: 'column',
                        }}
                    >
                        <BannerSection
                            tagline={`Empower your ideas with ${
                                themeMap.name ? themeMap.name : THEME.name
                            }`}
                            description={
                                'Build, automate, and innovate—all without coding. Harness the power of AI to transform your projects and workflows'
                            }
                            imageUrl={DevBanner}
                            link={{
                                label: 'Browse Templates',
                                to: '/marketplace',
                            }}
                        />
                        <div
                            style={{
                                display: 'flex',
                                width: '100%',
                                gap: '24px',
                                flexDirection: 'column',
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: '24px',
                                    flexGrow: 1,
                                    flexDirection: 'row',
                                }}
                            >
                                <FeaturedAppCard
                                    tagline={'Experiment in our Playground'}
                                    description={`Chat with different LLMs and try out different prompts from our prompt library. Or chat with multiple LLMs in one room to hold a focus group or round table.`}
                                    imageUrl={playground}
                                    chip={{
                                        label: 'FEATURED',
                                        color: '#EBF4FE',
                                    }}
                                />
                                <FeaturedAppCard
                                    tagline={'Simplify tasks with AI Conductor'}
                                    description={
                                        'Use a chat interface to breakdown goals into subtasks that can be accomplished via an app, a routine, or another user. Simplify your workflows!'
                                    }
                                    imageUrl={AIConductor}
                                    chip={{
                                        label: 'NEW',
                                        color: '#EBF4FE',
                                    }}
                                />
                            </Box>
                            {isUploadOpen ? (
                                <AddAppModal
                                    open={isUploadOpen}
                                    handleClose={(appId) => {
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
                            <NavSection
                                setupApp={setupApp}
                                uploadApp={() => setIsUploadOpen(true)}
                            />
                        </div>
                    </Box>
                ) : (
                    <UserLandingPage />
                )}
            </StyledComponent>
        </>
    );
});
