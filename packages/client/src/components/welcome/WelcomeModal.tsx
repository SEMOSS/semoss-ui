import { useEffect, useState } from 'react';
import { styled, Card, Modal, Stack, Typography, List } from '@semoss/ui';
import { WelcomeStepToolbar } from './WelcomeStepToolbar';
import { WelcomeStepActions } from './WelcomeStepActions';
import WelcomeSplash from '@/assets/img/welcome-splash.png';
import WelcomeApps from '@/assets/img/welcome-apps.png';
import WelcomeDocumentation from '@/assets/img/welcome-documentation.png';
import { THEME } from '@/constants';
import { Tour, TourStep } from '../tour';

const StyledCard = styled(Card)(() => ({
    flexDirection: 'row',
    height: '80vh',
    maxHeight: '750px',
}));

const StyledSidebar = styled(Stack)(({ theme }) => ({
    width: '30%',
    backgroundColor: '#121212',
    color: theme.palette.background.paper,
    justifyContent: 'space-between',
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    padding: `${theme.spacing(7)} ${theme.spacing(3)}`,
}));

const StyledMain = styled(Stack)(() => ({
    width: '70%',
}));

const StyledTopStack = styled(Stack)(({ theme }) => ({
    height: '50%',
    overflow: 'hidden',
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(3),
}));

const StyledBottomStack = styled(Stack)(({ theme }) => ({
    height: '50%',
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

const VerticalSpacer = styled('div')(() => ({
    flexDirection: 'column',
    flex: 1,
    display: 'flex',
}));

const StyledList = styled(List)(({ theme }) => ({
    height: '50%',
    color: theme.palette.background.paper,
}));

const StyledListItem = styled(List.Item)(({ theme }) => ({
    '& .MuiListItemButton-root:hover': {
        backgroundColor: '#6D6D6D29!important',
    },
    '& .MuiListItemButton-root': {
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
    },
}));

const StyledListItemButton = styled(List.ItemButton)(() => ({
    '&.Mui-selected': {
        backgroundColor: '#6D6D6D29!important',
    },
}));

interface WelcomeModalStep {
    sidebarTitle: string;
    mainTitle: string;
    mainListItems: Array<string>;
    img: string;
}
const WelcomeModalSteps: Array<WelcomeModalStep> = [
    {
        sidebarTitle: 'Welcome',
        mainTitle: `What you can do with ${THEME.name}:`,
        mainListItems: [
            'Build a custom app with no front end coding',
            'Automate tasks with large language models',
            "Run an app that connects your client's database with a large language model for efficient data reporting",
        ],
        img: WelcomeSplash,
    },
    {
        sidebarTitle: `${THEME.name} Network`,
        mainTitle: `${THEME.name} Network`,
        mainListItems: [
            `Public and discoverable apps: Try out awesome apps created by our community users and view each app's source code on the ${THEME.name} GitHub`,
            `Blog: Read blogs created by our users for inspiration on how ${THEME.name} can help you work faster and better`,
        ],
        img: WelcomeApps,
    },
    {
        sidebarTitle: 'Documentation',
        mainTitle: 'Documentation',
        mainListItems: [
            `New to ${THEME.name}? Learn about ${THEME.name} key concepts, watch tutorials, use the starter kit, and more.`,
            `Already have a pre-built app that needs hosting on ${THEME.name}? Read the How-To guide.`,
        ],
        img: WelcomeDocumentation,
    },
];

const WelcomeTourSteps: TourStep[] = [
    {
        tourAttr: 'nav-app-library',
        position: 'right',
        highlightPadding: 0,
        title: 'Apps',
        content:
            'Welcome to the app landing page where you can view your apps and browse through discoverable apps.',
    },
    {
        tourAttr: 'nav-engine-function',
        position: 'right',
        highlightPadding: 0,
        title: 'Function Catalog',
        content:
            'Expose and reuse large language model functionality in the form of functions to promote efficiency across app development.',
    },
    {
        tourAttr: 'nav-engine-model',
        position: 'right',
        highlightPadding: 0,
        title: 'Model Catalog',
        content:
            'Upload or use commercially-available large language model to supercharge your app.',
    },
    {
        tourAttr: 'nav-engine-database',
        position: 'right',
        highlightPadding: 0,
        title: 'Database Catalog',
        content: 'Browse, upload, and connect data sources to your app.',
    },
    {
        tourAttr: 'nav-engine-vector',
        position: 'right',
        highlightPadding: 0,
        title: 'Vector Database Catalog',
        content:
            'Connect vector databases to your app to enable fast retrieval of information and semantic search.',
    },
    {
        tourAttr: 'nav-engine-storage',
        position: 'right',
        highlightPadding: 0,
        title: 'Storage Catalog',
        content: "Pick and choose the storage option that's best for you.",
    },
];

export const WelcomeModal = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [open, setOpen] = useState<boolean>(false);
    const [showTour, setShowTour] = useState<boolean>(false);

    const nextStepAction = () => {
        if (currentStepIndex === WelcomeModalSteps.length - 1) {
            setOpen(false);
            setShowTour(true);
        } else {
            setCurrentStepIndex((state) => state + 1);
        }
    };

    const previousStepAction = () => {
        setCurrentStepIndex((state) => state - 1);
    };

    // don't show modal within the same browser session
    // or if the we have it set in local storage
    useEffect(() => {
        if (
            !sessionStorage.getItem('platform-welcome') &&
            !localStorage.getItem('platform-welcome')
        ) {
            setOpen(true);
            sessionStorage.setItem('platform-welcome', 'true');
        }
    }, []);

    return (
        <>
            {showTour ? (
                <Tour
                    hideTour={() => setShowTour(false)}
                    steps={WelcomeTourSteps}
                />
            ) : (
                <></>
            )}
            <Modal open={open} maxWidth="md" fullWidth>
                <StyledCard id="welcome-dialog-card">
                    <StyledSidebar>
                        <StyledTitle variant="h4">
                            Welcome to {THEME.name}
                        </StyledTitle>
                        <StyledList disablePadding dense>
                            {Array.from(
                                WelcomeModalSteps,
                                (step: WelcomeModalStep, index: number) => {
                                    return (
                                        <StyledListItem
                                            key={index}
                                            disableGutters
                                            disablePadding
                                        >
                                            <StyledListItemButton
                                                onClick={() =>
                                                    setCurrentStepIndex(index)
                                                }
                                                selected={
                                                    currentStepIndex === index
                                                }
                                            >
                                                <List.ItemText
                                                    primary={step.sidebarTitle}
                                                />
                                            </StyledListItemButton>
                                        </StyledListItem>
                                    );
                                },
                            )}
                        </StyledList>
                    </StyledSidebar>
                    <StyledMain id="welcome-modal-main">
                        <Stack
                            id={`welcome-modal-step-${currentStepIndex}`}
                            height="100%"
                        >
                            <StyledTopStack>
                                <WelcomeStepToolbar
                                    closeModal={() => setOpen(false)}
                                />
                                <img
                                    src={
                                        WelcomeModalSteps[currentStepIndex].img
                                    }
                                />
                            </StyledTopStack>
                            <StyledBottomStack>
                                <Typography variant="h6">
                                    {
                                        WelcomeModalSteps[currentStepIndex]
                                            .mainTitle
                                    }
                                </Typography>
                                <List
                                    disablePadding
                                    sx={{ overflowY: 'scroll' }}
                                >
                                    {Array.from(
                                        WelcomeModalSteps[currentStepIndex]
                                            .mainListItems,
                                        (text, index) => {
                                            return (
                                                <List.Item
                                                    key={`welcome-main-list-${index}`}
                                                >
                                                    <List.ItemText
                                                        primary={`\u2022 ${text}`}
                                                    />
                                                </List.Item>
                                            );
                                        },
                                    )}
                                </List>
                                <VerticalSpacer />
                                <WelcomeStepActions
                                    isFirstStep={currentStepIndex === 0}
                                    isLastStep={
                                        currentStepIndex ===
                                        WelcomeModalSteps.length - 1
                                    }
                                    nextStepAction={nextStepAction}
                                    previousStepAction={previousStepAction}
                                />
                            </StyledBottomStack>
                        </Stack>
                    </StyledMain>
                </StyledCard>
            </Modal>
        </>
    );
};
