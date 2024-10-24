import { useState } from 'react';
import { styled, Button, Stack, Typography } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';
import { FileUploadOutlined } from '@mui/icons-material';

import { STATE_VERSION } from '@/stores';
import {
    NewAppStep,
    AddAppModal,
    AppTemplates,
    NewAppModal,
} from '@/components/app';
import CodeSprite from '@/assets/img/CodeSprite.svg';
import BlocksSprite from '@/assets/img/BlocksSprite.svg';
import PromptSprite from '@/assets/img/PromptSprite.svg';
import { BASE_PAGE_BLOCKS } from './app.constants';

const StyledBox = styled('div', {
    shouldForwardProp: (prop) => prop !== 'color',
})<{
    /** Color of the box */
    location: 'first' | 'second' | 'third';
}>(({ theme, location }) => {
    let backgroundColor = '';
    if (location === 'first') {
        backgroundColor = '#A1D396';
    } else if (location === 'second') {
        backgroundColor = '#07C2B6';
    } else if (location === 'third') {
        backgroundColor = '#8BCAFF';
    }

    return {
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flexStart',
        minHeight: '355px',
        minWidth: '355px',
        padding: theme.spacing(4),
        gap: theme.spacing(1.25),
        backgroundColor: backgroundColor,
        borderRadius: theme.shape.borderRadius,
        overflow: 'hidden',
    };
});

const StyledBoxContent = styled('div')(() => ({
    flexShrink: '0',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flexStart',
    alignSelf: 'stretch',
    minHeight: '232px',
}));

const StyledBoxHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flexStart',
    alignSelf: 'stretch',
    gap: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
    backgroundColor: 'white',
    color: theme.palette.grey[900],
    '&:hover': {
        backgroundColor: theme.palette.grey[100],
    },
}));

const StyledBoxImage = styled('img', {
    shouldForwardProp: (prop) => !(prop === 'top' || prop === 'left'),
})<{
    /** Height of image */
    height: string;

    /** Width of image */
    width: string;

    /** Src of the image */
    src: string;
}>(({ theme, height, width }) => ({
    position: 'absolute',
    right: theme.spacing(3),
    bottom: theme.spacing(2),
    height: height,
    width: width,
}));

export const NewAppPage = () => {
    const navigate = useNavigate();

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

        navigate(`/app/${appId}/edit`);
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
                                                    dependencies: {},
                                                    variables: {},
                                                    notebooks: {},
                                                    blocks: BASE_PAGE_BLOCKS,
                                                    executionOrder: [],
                                                },
                                            })
                                        }
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
