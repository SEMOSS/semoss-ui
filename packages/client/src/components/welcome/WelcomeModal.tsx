import React, { createElement, useEffect, useState } from 'react';
import { styled, Card, Modal, Stack, Typography, List, Box } from '@semoss/ui';
import { StepToolbar } from './StepToolbar';
import { StepActions } from './StepActions';

const StyledCard = styled(Card)(({ theme }) => ({
    flexDirection: 'row',
    height: '80vh',
}));

const StyledSidebar = styled(Stack)(({ theme }) => ({
    width: '30%',
    backgroundColor: '#121212',
    color: theme.palette.background.paper,
    justifyContent: 'space-between',
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
    padding: `${theme.spacing(8)} ${theme.spacing(4)}`,
}));

const StyledMain = styled(Stack)(({ theme }) => ({
    width: '70%',
    padding: theme.spacing(2),
}));

const VerticalSpacer = styled('div')(() => ({
    flexDirection: 'column',
    flex: 1,
    display: 'flex',
}));

const StyledList = styled(List)(({ theme }) => ({
    height: '45%',
    color: theme.palette.background.paper,
}));

const StyledListItem = styled(List.Item)(() => ({
    '& .MuiListItemButton-root:hover': {
        backgroundColor: '#6D6D6D29!important',
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
}
const WelcomeModalSteps: Array<WelcomeModalStep> = [
    {
        sidebarTitle: 'Welcome',
        mainTitle: 'What you can do with CFG AI:',
        mainListItems: [
            'Build a custom app with no front end coding',
            'Automate tasks with large language models',
            "Run an app that connects your client's database with a large language model for efficient data reporting",
        ],
    },
    {
        sidebarTitle: 'CFG AI Network',
        mainTitle: 'CFG AI Network',
        mainListItems: [
            "Public and discoverable apps: Try out awesome apps created by our community users and view each app's source code on the CFG AI GitHub",
            'Blog: Read blogs created by our users for inspiration on how CFG AI can help you work faster and better',
        ],
    },
    {
        sidebarTitle: 'Documentation',
        mainTitle: 'Documentation',
        mainListItems: [
            'New to CFG AI? Learn about CFG AI key concepts, watch tutorials, use the starter kit, and more.',
            'Already have a pre-built app that needs hosting on CFG AI? Read the How-To guide.',
        ],
    },
];

export const WelcomeModal = () => {
    const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
    const [open, setOpen] = useState<boolean>(false);

    const nextStepAction = () => {
        if (currentStepIndex === WelcomeModalSteps.length - 1) {
            setOpen(false);
        } else {
            setCurrentStepIndex((state) => state + 1);
        }
    };

    const previousStepAction = () => {
        setCurrentStepIndex((state) => state - 1);
    };

    // don't show modal within the same browser session
    useEffect(() => {
        setOpen(true);
        if (!sessionStorage.getItem('platform-welcome')) {
            setOpen(true);
            sessionStorage.setItem('platform-welcome', 'true');
        }
    }, []);

    return (
        <Modal open={open} maxWidth="md" fullWidth>
            <StyledCard id="welcome-dialog-card">
                <StyledSidebar>
                    <StyledTitle variant="h4">Welcome to CFG AI</StyledTitle>
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
                <StyledMain>
                    <Stack
                        id={`welcome-modal-step-${currentStepIndex}`}
                        height="100%"
                    >
                        <Stack height="55%">
                            <StepToolbar closeModal={() => setOpen(false)} />
                            {/* TODO: custom images here */}
                            <Box
                                sx={{
                                    height: '100%',
                                    border: '2px blue solid',
                                }}
                            />
                        </Stack>
                        <Stack height="45%">
                            <Typography variant="h6">
                                {WelcomeModalSteps[currentStepIndex].mainTitle}
                            </Typography>
                            <List disablePadding>
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
                            <StepActions
                                isFirstStep={currentStepIndex === 0}
                                isLastStep={
                                    currentStepIndex ===
                                    WelcomeModalSteps.length - 1
                                }
                                nextStepAction={nextStepAction}
                                previousStepAction={previousStepAction}
                            />
                        </Stack>
                    </Stack>
                </StyledMain>
            </StyledCard>
        </Modal>
    );
};
