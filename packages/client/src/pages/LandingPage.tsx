import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Navigate, useNavigate } from 'react-router-dom';

import { Button, Chip, Container } from '@semoss/ui';
import { STATE_VERSION } from '@semoss/renderer';

import { UserLandingPage } from './UserlandingPage';
import DevBanner from '@/assets/img/DevBanner.png';
import playground from '@/assets/img/playground.png';
import AIConductor from '@/assets/img/AIConductor.png';
import NavSection from './app/NavSection';
import { useRootStore } from '@/hooks';
import { AddAppModal, NewAppModal } from '@/components/app';
import { BASE_PAGE_BLOCKS } from './app/app.constants';
import { THEME } from '@/constants';

const StyledComponent = styled(Container)(({ theme }) => ({
    top: '56px',
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
    flex: '1 0 0',
    alignSelf: 'stretch',
    // width: '100%',
    backgroundColor: '#FAFAFA',
    height: 'calc(100vh - 56px)', // Adjust height based on AppBar height
    overflow: 'auto',
    /* Media query for screens with a minimum width of 600px */
    '@media (min-width: 600px)': {
        '&.MuiContainer-root': {
            paddingLeft: '0px',
            paddingRight: '0px',
        },
    },
}));

const StyledBannerTitle = styled(Typography)(({ theme }) => ({
    color: '#212121',
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: 'Inter',
    fontSize: '24px',
    fontStyle: 'normal',
    fontWeight: '700',
    lineHeight: '133.4%',
}));

const StyledBannerText = styled(Typography)(({ theme }) => ({
    color: '#212121',
    fontFeatureSettings: "'liga' off, 'clig' off",
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '150%' /* 24px */,
    letterSpacing: '0.15px',
    padding: '24px 0px',
    width: '35%',
}));
const StyledOuterContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flex: '1 1.5 50%',
    borderRadius: '12px',
    background: '#FFF',
    boxShadow: '0px 5px 8px 0px rgba(0, 0, 0, 0.08)',
    height: '204px',
}));
const StyledInnerContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flex: '0.55 1 60%',
    alignItems: 'center',
    padding: '16px',
    justifyContent: 'space-between',
    flexDirection: 'column',
}));

const StyledContainerTitleSection = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
}));

const StyledContainerContentSection = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    justifyContent: 'space-between',
    padding: '16px 0px',
}));

const StyledContainerButtonSection = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%',
}));

const StyledContainerImageSection = styled('div')<{ backgroundImage: string }>(
    ({ theme, backgroundImage }) => ({
        display: 'flex',
        flex: '0.45 1 40%',
        backgroundImage: `${backgroundImage}`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
    }),
);

const BannerComponent = observer(() => {
    const navigate = useNavigate();

    const { configStore } = useRootStore();

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

    return (
        <>
            <div
                style={{
                    padding: '53px 21px',
                    backgroundImage: `url(${DevBanner})`,
                    height: '276px',
                    width: '100%',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    borderRadius: '24px',
                }}
            >
                <StyledBannerTitle variant="h5">
                    Empower your ideas with{' '}
                    {themeMap.name ? themeMap.name : THEME.name}
                </StyledBannerTitle>
                <StyledBannerText variant="body1">
                    Build, automate, and innovate—all without coding. Harness
                    the power of AI to transform your projects and workflows
                </StyledBannerText>
                <Button
                    variant="contained"
                    size="large"
                    style={{
                        marginTop: 'auto',
                        borderRadius: '12px',
                        background: '#000',
                    }}
                    onClick={(e) => navigate('/marketplace')}
                    endIcon={<ArrowForwardIcon style={{ color: '#fff' }} />}
                >
                    Browse Templates
                </Button>
            </div>
        </>
    );
});

const PlayGroundContainer = observer(() => {
    return (
        <StyledOuterContainer>
            <StyledInnerContainer>
                <StyledContainerTitleSection>
                    <Typography
                        style={{
                            color: 'var(--Text-Primary, #212121)',
                            fontFeatureSettings: "'liga' off, 'clig' off",
                            fontFamily: 'Inter',
                            fontSize: '16px',
                            fontStyle: 'normal',
                            fontWeight: '500',
                            lineHeight: '150%' /* 24px */,
                            letterSpacing: '0.15px',
                        }}
                    >
                        Experiment in our Playground&trade;
                    </Typography>
                    <StyledChip
                        variant="filled"
                        size="small"
                        sx={{
                            borderRadius: '4px',
                            background: 'var(--Primary-Selected, #EBF4FE)',
                        }}
                        label="FEATURED"
                    />
                </StyledContainerTitleSection>
                <StyledContainerContentSection>
                    <Typography
                        variant="body2"
                        style={{
                            color: 'var(--Text-Primary, #212121)',
                            fontFeatureSettings: "'liga' off, 'clig' off",
                        }}
                    >
                        Chat with different LLMs and try out different prompts
                        from our prompt library. Or chat with multiple LLMs in
                        one room to hold a focus group or round table.
                    </Typography>
                </StyledContainerContentSection>
                <StyledContainerButtonSection>
                    <Button
                        variant="text"
                        disabled={true}
                        endIcon={
                            <ArrowForwardIcon
                                style={{
                                    // color: '#0471F0',
                                    color: 'rgba(0, 0, 0, 0.26)',
                                }}
                            />
                        }
                    >
                        {' '}
                        Try it out{' '}
                    </Button>
                </StyledContainerButtonSection>
            </StyledInnerContainer>
            <StyledContainerImageSection backgroundImage={`url(${playground})`}>
                &nbsp;
            </StyledContainerImageSection>
        </StyledOuterContainer>
    );
});

const AIConductorContainer = observer(() => {
    return (
        <StyledOuterContainer>
            <StyledInnerContainer>
                <StyledContainerTitleSection>
                    <Typography
                        style={{
                            color: 'var(--Text-Primary, #212121)',
                            fontFeatureSettings: "'liga' off, 'clig' off",
                            fontFamily: 'Inter',
                            fontSize: '16px',
                            fontStyle: 'normal',
                            fontWeight: '500',
                            lineHeight: '150%' /* 24px */,
                            letterSpacing: '0.15px',
                        }}
                    >
                        Simplify tasks with AI Conductor
                    </Typography>
                    <StyledChip
                        variant="filled"
                        size="small"
                        sx={{
                            borderRadius: '4px',
                            background: 'var(--Primary-Selected, #EBF4FE)',
                        }}
                        label="NEW"
                    />
                </StyledContainerTitleSection>
                <StyledContainerContentSection>
                    <Typography
                        variant="body2"
                        style={{
                            color: 'var(--Text-Primary, #212121)',
                            fontFeatureSettings: "'liga' off, 'clig' off",
                        }}
                    >
                        Use a chat interface to breakdown goals into subtasks
                        that can be accomplished via an app, a routine, or
                        another user. Simplify your workflows!
                    </Typography>
                </StyledContainerContentSection>
                <StyledContainerButtonSection>
                    <Button
                        variant="text"
                        disabled={true}
                        endIcon={
                            <ArrowForwardIcon
                                style={{
                                    // color: '#0471F0',
                                    color: 'rgba(0, 0, 0, 0.26)',
                                }}
                            />
                        }
                    >
                        {' '}
                        Try it out{' '}
                    </Button>
                </StyledContainerButtonSection>
            </StyledInnerContainer>
            <StyledContainerImageSection
                backgroundImage={`url(${AIConductor})`}
            >
                &nbsp;
            </StyledContainerImageSection>
        </StyledOuterContainer>
    );
});

const StyledChip = styled(Chip)(({ theme }) => ({
    borderRadius: '4px',
    background: 'var(--Primary-Selected, #EBF4FE)',
    '&.MuiChip-root > .MuiChip-label': {
        color: 'var(--Primary-Main, #0471F0)',
        fontFeatureSettings: "'liga' off, 'clig' off",
        /* Components/Chip */
        fontFamily: 'Inter',
        fontSize: '13px',
        fontStyle: 'normal',
        fontWeight: '400',
        lineHeight: '18px' /* 138.462% */,
        letterSpacing: '0.16px',
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
                        <BannerComponent />
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
                                <PlayGroundContainer />
                                <AIConductorContainer />
                            </Box>
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
