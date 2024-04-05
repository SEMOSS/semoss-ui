import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HdrAutoIcon from '@mui/icons-material/HdrAuto';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import ShareIcon from '@mui/icons-material/Share';
// import { dividerClasses } from '@mui/material';
import {
    Breadcrumbs,
    Button,
    IconButton,
    Menu,
    MenuItem,
    styled,
    Typography,
} from '@semoss/ui';
import { SettingsTiles } from '@/components/settings/SettingsTiles';
// import { AppSettings } from '@/components/app/AppSettings';
import { SettingsContext } from '@/contexts';
import { Env } from '@/env';
import { useRootStore } from '@/hooks';
// import { usePixel, useRootStore } from '@/hooks';
// import { MonolithStore } from '@/stores';

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

const SidebarAndSectionsContainer = styled('div')({
    display: 'flex',
});

const Sections = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '1rem',
    marginLeft: '12.4rem',
});

const SectionHeading = styled(Typography)({
    fontSize: 20,
    fontWeight: '550',
    marginBottom: '0.75rem',
});

const TitleSection = styled('section')({
    display: 'flex',
    gap: '1rem',
    paddingBottom: '3rem',
});

const TitleSectionImg = styled('img')({
    borderRadius: '0.75rem',
});

const TitleSectionBodyWrapper = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    justifyContent: 'center',
});

const TitleSectionBody = styled(Typography)({
    alignItems: 'center',
    color: 'rgb(0, 0, 0, 0.6)',
    display: 'flex',
    gap: '0.25rem',
});

const TagsBodyWrapper = styled('div')({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem',
});

const Tag = styled('span')(({ theme }) => ({
    background: theme.palette.grey[300],
    borderRadius: '1.5rem',
    padding: '0.5em 1em',
}));

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
    const [dependenciesState, setDependenciesState] = useState([]);
    // const [selectedDependenciesState, setSelectedDependenciesState] = useState(
    //     [],
    // );
    const [moreVertAnchorEl, setMoreVertAnchorEl] = useState(null);

    const mainUsesRef = useRef<HTMLElement>(null);
    const tagsRef = useRef<HTMLElement>(null);
    const videosRef = useRef<HTMLElement>(null);
    const dependenciesRef = useRef<HTMLElement>(null);
    const appAccessRef = useRef<HTMLElement>(null);
    const memberAccessRef = useRef<HTMLElement>(null);

    const refs = [
        mainUsesRef,
        tagsRef,
        videosRef,
        dependenciesRef,
        appAccessRef,
        memberAccessRef,
    ];

    const { appId } = useParams();
    const { monolithStore } = useRootStore();
    const navigate = useNavigate();

    useEffect(() => {
        getPermission();
        getAppInfo();
        getDependencies();
    }, []);

    async function getPermission() {
        const getUserProjectPermission =
            await monolithStore.getUserProjectPermission(appId);
        setPermissionState(getUserProjectPermission.permission);
    }

    async function getAppInfo() {
        const response = await monolithStore.runQuery(
            `ProjectInfo(project="${appId}")`,
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

    async function runSetDependenciesQuery(testSelectedDeps: string[]) {
        // async function setDependenciesQuery(selectedDependenciesState)
        const response = await monolithStore.runQuery(
            `SetProjectDependencies(project="${appId}", dependencies=${JSON.stringify(
                testSelectedDeps,
            )})`,
            // `SetProjectDependencies(project="${appId}", dependencies=${selectedDependenciesState})`,
        );
        // SetProjectDependencies(project=["<project_id>"], dependencies=["<engine_id_1>","<engine_id_2>",...]);
        console.log('🚀 ~ setDependenciesQuery ~ response:', response);
    }

    function PermissionComponent(): JSX.Element {
        switch (permissionState) {
            case 'OWNER':
                return (
                    <>
                        <HdrAutoIcon />
                        Author Access
                    </>
                );
            case 'EDITOR':
                return (
                    <>
                        <NoteAltIcon />
                        Editor Access
                    </>
                );
            case 'DISCOVERABLE':
                return (
                    <>
                        <AssignmentIcon />
                        Read-Only Access
                    </>
                );
            default:
                return null;
        }
    }

    return (
        <OuterContainer>
            <InnerContainer>
                <Breadcrumbs>Breadcrumbs</Breadcrumbs>

                <TopButtonsContainer>
                    <ChangeAccessButton variant="text">
                        Change Access
                    </ChangeAccessButton>
                    <Button variant="contained">Open</Button>
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
                    <Sidebar refs={refs} />

                    <Sections>
                        <TitleSection>
                            <TitleSectionImg
                                src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
                                alt="App Image"
                            />
                            <TitleSectionBodyWrapper>
                                <SectionHeading variant="h1">
                                    {appInfoState?.project_name}
                                </SectionHeading>
                                <TitleSectionBody variant="body1">
                                    <PermissionComponent />
                                </TitleSectionBody>
                                <TitleSectionBody variant="body1">
                                    {appInfoState?.description
                                        ? appInfoState?.description
                                        : 'No description available'}
                                </TitleSectionBody>
                            </TitleSectionBodyWrapper>
                        </TitleSection>

                        <section ref={mainUsesRef}>
                            <SectionHeading variant="h2">
                                Main uses
                            </SectionHeading>
                        </section>

                        <section ref={tagsRef}>
                            <SectionHeading variant="h2">Tags</SectionHeading>
                            {appInfoState?.tag ? (
                                <TagsBodyWrapper>
                                    {appInfoState?.tag.map((tag) => (
                                        <Tag key={nanoid()}>{tag}</Tag>
                                    ))}
                                </TagsBodyWrapper>
                            ) : (
                                <Typography variant="body1">
                                    No tags available
                                </Typography>
                            )}
                        </section>

                        <section ref={videosRef}>
                            <SectionHeading variant="h2">Videos</SectionHeading>
                        </section>

                        <section ref={dependenciesRef}>
                            <DepsHeadingWrapper>
                                <SectionHeading variant="h2">
                                    Dependencies
                                </SectionHeading>
                                <IconButton
                                    onClick={() => {
                                        runSetDependenciesQuery([
                                            '38e13c86-a6f3-4d2b-b42b-31c7ce26c147',
                                        ]);
                                    }}
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

                        <section ref={appAccessRef}>
                            <SectionHeading variant="h2">
                                App Access
                            </SectionHeading>
                            <SettingsContext.Provider
                                value={{
                                    adminMode: false,
                                }}
                            >
                                <SettingsTiles
                                    mode={'app'}
                                    name={'app'}
                                    id={appId}
                                    onDelete={() => {
                                        navigate('/settings/app');
                                    }}
                                />
                            </SettingsContext.Provider>
                        </section>

                        <section ref={memberAccessRef}>
                            <SectionHeading variant="h2">
                                Member Access
                            </SectionHeading>
                        </section>
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
    position: 'fixed',
    // marginRight: '3rem',
}));

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

interface SidebarProps {
    refs: React.MutableRefObject<HTMLElement>[];
}

function Sidebar({ refs }: SidebarProps) {
    const [
        mainUsesRef,
        tagsRef,
        videosRef,
        dependenciesRef,
        appAccessRef,
        memberAccessRef,
    ] = refs;

    const headings = [
        { text: 'Main Uses', ref: mainUsesRef },
        { text: 'Tags', ref: tagsRef },
        { text: 'Videos', ref: videosRef },
        { text: 'Dependencies', ref: dependenciesRef },
        { text: 'App Access', ref: appAccessRef },
        { text: 'Member Access', ref: memberAccessRef },
    ];

    return (
        <StyledSidebar>
            {headings.map(({ text, ref }) => (
                <SidebarMenuItem
                    onClick={() =>
                        ref.current.scrollIntoView({ behavior: 'smooth' })
                    }
                    key={nanoid()}
                    value={null}
                >
                    {text}
                </SidebarMenuItem>
            ))}
        </StyledSidebar>
    );
}
