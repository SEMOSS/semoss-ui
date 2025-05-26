import { ChangeEvent, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled from '@emotion/styled';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import {
    Button,
    Chip,
    InputAdornment,
    lightTheme,
    Switch,
    TextField,
} from '@semoss/ui';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { UserLandingPage } from './UserlandingPage';
import DevBanner from '@/assets/img/DevBanner.png';
import { SideNav } from '@/components/ui';
import { Logo } from '@/assets/img/Logo';
import playground from '@/assets/img/Playground.png';
import AIConductor from '@/assets/img/AIConductor.png';

const StyledBox = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    background: '#FAFAFA',
    height: '56px',
    flexGrow: 1,
    '& .MuiPaper-root > .MuiToolbar-root': {
        gap: '8px',
    },
}));

const StyledAppBar = styled(AppBar)(({ theme }) => ({
    borderBottom: '1px solid #EAEAEE',
    background: lightTheme.palette.background.default, //"var(--Background-Paper-2, #FAFAFA)",
    color: lightTheme.palette.text.secondary, //"var(--Text-Primary-1, #212B36)",
    padding: '0px 32px 8px 32px',
    boxShadow: 'none',
    transition: 'none',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    fontFamily: 'Inter',
    fontSize: '20px',
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: '160%' /* 32px */,
    letterSpacing: '0.15px',
    color: 'var(--Text-Primary, #212121)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    // marginLeft: "8px",
    height: 'auto',
    maxWidth: '7.5em',
    display: 'flex',
    flexGrow: 1,
}));

const StyledImg = styled('img')(({ theme }) => ({
    color: '#212121',
    width: '24px',
    height: '26px',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    backgroundColor: '#F5F5F5',
    width: '50rem',
    // marginLeft:"128px",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'center',
    '& .MuiOutlinedInput-root': {
        padding: '0px 12px',
        borderRadius: '8px',
        border: '1px solid  #C4C4C4',
        marginBottom: '8px',
    },
    '& .MuiOutlinedInput-root > input': {
        paddingLeft: '0px',
        paddingRight: '0px',
    },
}));

const StyledAppBuilderSection = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexGrow: 1,
}));

const StyledAppBuilder = styled(Typography)(({ theme }) => ({
    color: 'var(--Text-Secondary, #666)',
    fontFeatureSettings: "'liga' off, 'clig' off",
    display: 'flex',
    /* Typography/Caption */
    fontFamily: 'Roboto',
    fontSize: '12px',
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: '166%' /* 19.92px */,
    letterSpacing: '0.4px',
    flexDirection: 'column',
    alignItems: 'flex-end',
    flexGrow: 1,
}));

const StyledSwitch = styled(Switch)(({ theme }) => ({
    display: 'flex',
    width: '3.125rem',
    padding: '2px 0px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '10px',
}));

const StyledSearchSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '18rem',
    alignItems: 'center',
    flex: '2 0.5 10%',
    minWidth: '0px',
}));

const StyledIconButton = styled(IconButton)(({ theme }) => ({
    marginRight: 2,
    borderRadius: '7px',
    border: '0.938px solid #323232',
    width: '30px',
    height: '30px',
}));

const StyledComponent = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: '40px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '24px',
    flex: '1 0 0',
    alignSelf: 'stretch',
    width: '100%',
}));

const StyledLeftSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: '1.5 0.5 5%',
}));
const StyledRightSection = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: '1 0.5 15%',
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

const StyledAppTitle = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
}));
const StyledOuterContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flex: '1 1.5 50%',
    borderRadius: '12px',
    background: '#FFF',
    boxShadow: '0px 5px 8px 0px rgba(0, 0, 0, 0.08)',
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
    return (
        <>
            <div
                style={{
                    padding: '53px 21px',
                    backgroundImage: `url(${DevBanner})`,
                    minHeight: '30dvh',
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
                    Empower your ideas with AI Core
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
                        endIcon={
                            <ArrowForwardIcon style={{ color: '#0471F0' }} />
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
                        endIcon={
                            <ArrowForwardIcon style={{ color: '#0471F0' }} />
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

export const LandingPageHeader = () => {
    const [showAppBuilder, setShowAppBuilder] = useState(false);
    const [showSideNav, setShowSideNav] = useState(false);

    return (
        <>
            <StyledBox>
                <StyledAppBar position="static">
                    <Toolbar>
                        <StyledLeftSection>
                            <StyledIconButton
                                size="medium"
                                edge="start"
                                color="inherit"
                                aria-label="menu"
                                onClick={() => setShowSideNav(true)}
                            >
                                <MenuIcon />
                            </StyledIconButton>
                            <StyledAppTitle>
                                <Logo />
                                <StyledTypography variant="h6">
                                    GovConnect.AI
                                </StyledTypography>
                            </StyledAppTitle>
                        </StyledLeftSection>
                        {showAppBuilder ? (
                            <StyledSearchSection>
                                <StyledTextField
                                    variant="outlined"
                                    size="small"
                                    placeholder="Search"
                                    label=""
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                    }}
                                ></StyledTextField>
                            </StyledSearchSection>
                        ) : (
                            <></>
                        )}
                        <StyledRightSection>
                            <StyledAppBuilderSection>
                                <StyledAppBuilder variant="h6">
                                    App Builder
                                </StyledAppBuilder>
                                <StyledSwitch
                                    checked={showAppBuilder}
                                    onChange={(
                                        e: ChangeEvent<HTMLInputElement>,
                                    ) => setShowAppBuilder(e.target.checked)}
                                ></StyledSwitch>
                            </StyledAppBuilderSection>
                        </StyledRightSection>
                    </Toolbar>
                </StyledAppBar>
            </StyledBox>
            <SideNav
                isOpen={showSideNav}
                onClose={() =>
                    setShowSideNav((prevShowSideNav) => !prevShowSideNav)
                }
            />
            <StyledComponent>
                {showAppBuilder ? (
                    <>
                        <BannerComponent />
                        <div
                            style={{
                                display: 'flex',
                                width: '100%',
                                gap: '24px',
                            }}
                        >
                            <PlayGroundContainer />
                            <AIConductorContainer />
                        </div>
                    </>
                ) : (
                    <UserLandingPage />
                )}
            </StyledComponent>
        </>
    );
};
