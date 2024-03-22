import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import HdrAutoIcon from '@mui/icons-material/HdrAuto';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ShareIcon from '@mui/icons-material/Share';
import {
    Breadcrumbs,
    Button,
    ButtonGroup,
    IconButton,
    Menu,
    MenuItem,
    styled,
    Typography,
    useNotification,
} from '@semoss/ui';
import { SettingsTiles } from '@/components/settings/SettingsTiles';
import { AppSettings } from '@/components/app/AppSettings';
import { usePixel, useRootStore } from '@/hooks';
import { MonolithStore } from '@/stores';
import { dividerClasses } from '@mui/material';

const HEADINGS = [
    { id: 'main-uses', text: 'Main Uses' },
    { id: 'tags', text: 'Tags' },
    { id: 'videos', text: 'Videos' },
    { id: 'dependencies', text: 'Dependencies' },
    { id: 'app-access', text: 'App Access' },
    { id: 'member-access', text: 'Member Access' },
];

const OuterContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    overflow: 'scroll',
    padding: '0 1rem',
    width: '100%',
});

const InnerContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '1rem',
    margin: 'auto',
    maxWidth: '79rem',
    width: '100%',
});

const TopButtonsContainer = styled('div')({
    display: 'flex',
    gap: '0.6rem',
    marginLeft: 'auto',
});

const ChangeAccessButton = styled(Button)({
    fontWeight: 'bold',
});

const ArrowButton = styled(Button)({
    // display: 'flex',
});

const StyledArrowDropDownIcon = styled(ArrowDropDownIcon)({
    '&:first-child': {
        display: 'flex',
    },
});

const SidebarAndSectionsContainer = styled('div')({
    display: 'flex',
});

const Sections = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    fontWeight: 'bold',
    width: '100%',
    gap: '0.5rem',
});

const SectionHeading = styled(Typography)({
    fontSize: 20,
    fontWeight: '550',
    marginBottom: '0.75rem',
});

const TitleSection = styled('section')({
    paddingBottom: '3rem',
});

const TitleSectionContent = styled('div')({
    alignItems: 'center',
    color: 'rgb(0, 0, 0, 0.54)',
    display: 'flex',
    gap: '0.25rem',
});

const DepsHeadingWrapper = styled('div')({
    alignItems: 'start',
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
});

const StyledMenuItem = styled(MenuItem)({
    color: 'rgb(0, 0, 0, 0.7)',
    display: 'flex',
    fontSize: 12,
    gap: '0.75rem',
    padding: '0.75rem',
});

export function AppDetailPage() {
    const [permissionState, setPermissionState] = useState('');
    const [appInfoState, setAppInfoState] = useState(null);
    const [dependenciesState, setDependenciesState] = useState(null);
    const [arrowAnchorEl, setArrowAnchorEl] = useState(null);
    const [moreVertAnchorEl, setMoreVertAnchorEl] = useState(null);

    const { appId } = useParams();
    const { configStore, monolithStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    // const setDependencies = usePixel(
    //     `SetProjectDependencies(project="${appId}", dependencies="${dependencies})`,
    // );

    // async function onSetDependencies() {
    //     await setDependencies();
    // }

    // const { status, data, refresh } = usePixel<
    //     {
    //         database_name: string;
    //         database_id: string;
    //     }[]
    // >(`SimilarCatalog(database=["${id}"])`);

    // SetProjectDependencies(project=["<project_id>"], dependencies=["<engine_id_1>","<engine_id_2>",...]);
    // GetProjectDependencies()

    // To run legacy, do `pnpm run dev:legacy`
    // Tend to pass reactors arrays, even if one arg.

    async function getPermission() {
        const getUserProjectPermission =
            await monolithStore.getUserProjectPermission(appId);
        setPermissionState(getUserProjectPermission.permission);
    }

    async function getAppInfo() {
        const response = await monolithStore.runQuery(
            `ProjectInfo(project=["${appId}"])`,
        );
        console.log('response: ', response);
        const appInfo = response.pixelReturn[0].output;
        setAppInfoState(appInfo);
        return appInfo;
    }

    async function getDependencies() {
        const response = await monolithStore.runQuery(
            `GetProjectDependencies(project="${appId}")`,
        );

        const dependencies = response.pixelReturn[0].output;
        console.log('deps: ', dependencies);
        setDependenciesState(dependencies);
        return dependencies;
    }

    useEffect(() => {
        getPermission();
        getAppInfo();
        getDependencies();
    }, []);

    return (
        <OuterContainer>
            <InnerContainer>
                <Breadcrumbs>Breadcrumbs</Breadcrumbs>

                <TopButtonsContainer>
                    <ChangeAccessButton variant="text">
                        Change Access
                    </ChangeAccessButton>
                    <ButtonGroup>
                        <Button variant="contained">Open</Button>
                        <ArrowButton
                            onClick={(event) =>
                                setArrowAnchorEl(event.currentTarget)
                            }
                            variant="contained"
                        >
                            <StyledArrowDropDownIcon />
                        </ArrowButton>
                        <Menu
                            anchorEl={arrowAnchorEl}
                            open={Boolean(arrowAnchorEl)}
                            onClose={() => setArrowAnchorEl(null)}
                        >
                            <StyledMenuItem value={null}>
                                <EditIcon fontSize="small" />
                                Open in UI Builder
                            </StyledMenuItem>
                            <StyledMenuItem value={null}>
                                <EditIcon fontSize="small" />
                                Go to Code Editor
                            </StyledMenuItem>
                        </Menu>
                    </ButtonGroup>
                    <IconButton
                        onClick={(event) =>
                            setMoreVertAnchorEl(event.currentTarget)
                        }
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        anchorEl={moreVertAnchorEl}
                        open={Boolean(moreVertAnchorEl)}
                        onClose={() => setMoreVertAnchorEl(null)}
                    >
                        <StyledMenuItem value={null}>
                            <EditIcon fontSize="small" />
                            Edit App Details
                        </StyledMenuItem>
                        <StyledMenuItem value={null}>
                            <ShareIcon fontSize="small" />
                            Share
                        </StyledMenuItem>
                        <StyledMenuItem value={null}>
                            <DeleteIcon fontSize="small" />
                            Delete App
                        </StyledMenuItem>
                    </Menu>
                </TopButtonsContainer>

                <SidebarAndSectionsContainer>
                    <Sidebar />

                    <Sections>
                        <TitleSection>
                            <SectionHeading
                                id="#main-uses-app-detail-page"
                                variant="h1"
                            >
                                {appInfoState?.project_name}
                            </SectionHeading>
                            {permissionState === 'OWNER' ? (
                                <TitleSectionContent>
                                    <HdrAutoIcon />
                                    Author Access
                                </TitleSectionContent>
                            ) : null}
                        </TitleSection>

                        <section>
                            <SectionHeading variant="h2">
                                Main uses
                            </SectionHeading>
                        </section>

                        <section>
                            <SectionHeading
                                id="#tags-app-detail-page"
                                variant="h2"
                            >
                                Tags
                            </SectionHeading>
                        </section>

                        <section>
                            <SectionHeading
                                id="#videos-app-detail-page"
                                variant="h2"
                            >
                                Videos
                            </SectionHeading>
                        </section>

                        <section id="#dependencies-app-detail-page">
                            <DepsHeadingWrapper>
                                <SectionHeading
                                    id="#dependencies-app-detail-page"
                                    variant="h2"
                                >
                                    Dependencies
                                </SectionHeading>
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        right: 0,
                                        top: '-0.4rem',
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                            </DepsHeadingWrapper>
                            {dependenciesState?.length > 0
                                ? dependenciesState.map((dependency) => (
                                      <div key={nanoid()}>{dependency}</div>
                                  ))
                                : 'This app has no dependencies. (Prompt to add dependencies.)'}
                        </section>

                        <section>
                            <SectionHeading
                                id="#app-access-app-detail-page"
                                variant="h2"
                            >
                                App Access (from the `SettingsTiles` component)
                            </SectionHeading>
                        </section>

                        <section>
                            <SectionHeading
                                id="#member-access-app-detail-page"
                                variant="h2"
                            >
                                Member Access
                            </SectionHeading>
                        </section>

                        {/* {HEADINGS.map(({ id, text }) => (
                            <SectionHeading
                                key={nanoid()}
                                id={`#${id}-app-detail-page`}
                            >
                                {text}
                            </SectionHeading>
                        ))} */}
                        {/* <AppSettings id={appId} /> */}
                        {/* <SettingsTiles
                        id={appId}
                        mode={'app'}
                        name={'app'}
                        onDelete={() => {
                            navigate('..', { relative: 'path' });
                        }}
                    /> */}
                        <SectionHeading id="#app-access" variant="h2">
                            App Access (from the `SettingsTiles` component)
                        </SectionHeading>
                    </Sections>
                </SidebarAndSectionsContainer>
            </InnerContainer>
        </OuterContainer>
    );
}

const StyledSidebar = styled('div')(({ theme }) => ({
    display: 'flex',
    borderRight: `2px solid ${theme.palette.secondary.main}`,
    flexDirection: 'column',
    fontWeight: 'bold',
    gap: '1rem',
    paddingRight: '0.7rem',
    marginRight: '3rem',
}));

const SidebarLink = styled(Link)({
    color: 'inherit',
    textDecoration: 'none',
    '&:visited': {
        color: 'inherit',
    },
    whiteSpace: 'nowrap',
});

const SidebarMenuItem = styled(MenuItem)({
    fontSize: 13,
    fontWeight: 'bold',
    color: 'inherit',
    textDecoration: 'none',
    '&:visited': {
        color: 'inherit',
    },
    whiteSpace: 'nowrap',
});

function Sidebar() {
    return (
        <StyledSidebar>
            {HEADINGS.map(({ id, text }) => (
                <SidebarLink key={nanoid()} to={`#${id}-app-detail-page`}>
                    <SidebarMenuItem value={null}>{text}</SidebarMenuItem>
                </SidebarLink>
            ))}
        </StyledSidebar>
    );
}
