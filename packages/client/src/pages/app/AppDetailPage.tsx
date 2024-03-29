import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Env } from '@/env';
import { SettingsTiles } from '@/components/settings/SettingsTiles';
import { SettingsContext } from '@/contexts';
// import { AppSettings } from '@/components/app/AppSettings';
import { usePixel, useRootStore } from '@/hooks';
// import { MonolithStore } from '@/stores';
// import { dividerClasses } from '@mui/material';

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
    marginLeft: '198px',
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

const TitleSectionAccess = styled('div')({
    alignItems: 'center',
    color: 'rgb(0, 0, 0, 0.54)',
    display: 'flex',
    gap: '0.25rem',
});

const TitleSectionText = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
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
    const [dependenciesState, setDependenciesState] = useState([]);
    const [selectedDependenciesState, setSelectedDependenciesState] = useState(
        [],
    );
    const [arrowAnchorEl, setArrowAnchorEl] = useState(null);
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
    const { configStore, monolithStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

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
                        <Button
                            onClick={(event) =>
                                setArrowAnchorEl(event.currentTarget)
                            }
                            variant="contained"
                        >
                            <StyledArrowDropDownIcon />
                        </Button>
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
                    <Sidebar refs={refs} />

                    <Sections>
                        <TitleSection>
                            <TitleSectionImg
                                src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
                                alt="App Image"
                            />
                            <TitleSectionText>
                                <SectionHeading variant="h1">
                                    {appInfoState?.project_name}
                                </SectionHeading>
                                <Typography variant="body1">
                                    {appInfoState?.project_description
                                        ? appInfoState?.project_description
                                        : 'No description available'}
                                </Typography>
                                {permissionState === 'OWNER' ? (
                                    <TitleSectionAccess>
                                        <HdrAutoIcon />
                                        Author Access
                                    </TitleSectionAccess>
                                ) : null}
                                {/* <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel iste cumque porro facilis ea vero, est debitis beatae quis inventore, error officia ex magnam rerum at molestiae nobis excepturi numquam perferendis explicabo deleniti nisi consectetur illo tempore! Deleniti, quam optio inventore vitae ex provident consequuntur quo similique doloribus in reiciendis? Laborum quos saepe dignissimos dolorum voluptates officia, reiciendis excepturi corrupti maiores numquam provident nesciunt pariatur officiis, laboriosam labore quia quaerat. Fuga earum atque praesentium id molestias corporis illo iure quisquam, nam ipsum sint. Assumenda sapiente voluptatum ex autem unde fugiat ut optio rem maiores veritatis aliquid expedita illo esse molestias dolore dicta, officiis sunt reiciendis magni. Molestiae, voluptatum libero, dicta nam beatae est accusamus neque quae aspernatur dolore excepturi illo eaque minus quas. Unde, magnam rem voluptatum, natus delectus ducimus iusto sint quia minus sed possimus molestiae at, omnis cupiditate. Sint maxime cum esse voluptas libero eligendi praesentium similique reprehenderit necessitatibus sapiente ea iste laboriosam accusantium dolorem incidunt sequi consectetur tenetur, soluta in dignissimos deleniti? Quae perferendis, saepe exercitationem explicabo unde ducimus tempora quia at, consectetur aspernatur distinctio laborum, fugit veniam veritatis aliquam asperiores voluptatum nobis sapiente facilis. Est accusamus mollitia quis aut eveniet, aliquam quisquam quo ipsam dolorum. Nemo!</div> */}
                            </TitleSectionText>
                        </TitleSection>

                        <section ref={mainUsesRef}>
                            <SectionHeading variant="h2">
                                Main uses
                            </SectionHeading>
                            {/* <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel iste cumque porro facilis ea vero, est debitis beatae quis inventore, error officia ex magnam rerum at molestiae nobis excepturi numquam perferendis explicabo deleniti nisi consectetur illo tempore! Deleniti, quam optio inventore vitae ex provident consequuntur quo similique doloribus in reiciendis? Laborum quos saepe dignissimos dolorum voluptates officia, reiciendis excepturi corrupti maiores numquam provident nesciunt pariatur officiis, laboriosam labore quia quaerat. Fuga earum atque praesentium id molestias corporis illo iure quisquam, nam ipsum sint. Assumenda sapiente voluptatum ex autem unde fugiat ut optio rem maiores veritatis aliquid expedita illo esse molestias dolore dicta, officiis sunt reiciendis magni. Molestiae, voluptatum libero, dicta nam beatae est accusamus neque quae aspernatur dolore excepturi illo eaque minus quas. Unde, magnam rem voluptatum, natus delectus ducimus iusto sint quia minus sed possimus molestiae at, omnis cupiditate. Sint maxime cum esse voluptas libero eligendi praesentium similique reprehenderit necessitatibus sapiente ea iste laboriosam accusantium dolorem incidunt sequi consectetur tenetur, soluta in dignissimos deleniti? Quae perferendis, saepe exercitationem explicabo unde ducimus tempora quia at, consectetur aspernatur distinctio laborum, fugit veniam veritatis aliquam asperiores voluptatum nobis sapiente facilis. Est accusamus mollitia quis aut eveniet, aliquam quisquam quo ipsam dolorum. Nemo!</div> */}
                        </section>

                        <section ref={tagsRef}>
                            <SectionHeading variant="h2">Tags</SectionHeading>
                            {/* <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel iste cumque porro facilis ea vero, est debitis beatae quis inventore, error officia ex magnam rerum at molestiae nobis excepturi numquam perferendis explicabo deleniti nisi consectetur illo tempore! Deleniti, quam optio inventore vitae ex provident consequuntur quo similique doloribus in reiciendis? Laborum quos saepe dignissimos dolorum voluptates officia, reiciendis excepturi corrupti maiores numquam provident nesciunt pariatur officiis, laboriosam labore quia quaerat. Fuga earum atque praesentium id molestias corporis illo iure quisquam, nam ipsum sint. Assumenda sapiente voluptatum ex autem unde fugiat ut optio rem maiores veritatis aliquid expedita illo esse molestias dolore dicta, officiis sunt reiciendis magni. Molestiae, voluptatum libero, dicta nam beatae est accusamus neque quae aspernatur dolore excepturi illo eaque minus quas. Unde, magnam rem voluptatum, natus delectus ducimus iusto sint quia minus sed possimus molestiae at, omnis cupiditate. Sint maxime cum esse voluptas libero eligendi praesentium similique reprehenderit necessitatibus sapiente ea iste laboriosam accusantium dolorem incidunt sequi consectetur tenetur, soluta in dignissimos deleniti? Quae perferendis, saepe exercitationem explicabo unde ducimus tempora quia at, consectetur aspernatur distinctio laborum, fugit veniam veritatis aliquam asperiores voluptatum nobis sapiente facilis. Est accusamus mollitia quis aut eveniet, aliquam quisquam quo ipsam dolorum. Nemo!</div> */}
                        </section>

                        <section ref={videosRef}>
                            <SectionHeading variant="h2">Videos</SectionHeading>
                            {/* <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel iste cumque porro facilis ea vero, est debitis beatae quis inventore, error officia ex magnam rerum at molestiae nobis excepturi numquam perferendis explicabo deleniti nisi consectetur illo tempore! Deleniti, quam optio inventore vitae ex provident consequuntur quo similique doloribus in reiciendis? Laborum quos saepe dignissimos dolorum voluptates officia, reiciendis excepturi corrupti maiores numquam provident nesciunt pariatur officiis, laboriosam labore quia quaerat. Fuga earum atque praesentium id molestias corporis illo iure quisquam, nam ipsum sint. Assumenda sapiente voluptatum ex autem unde fugiat ut optio rem maiores veritatis aliquid expedita illo esse molestias dolore dicta, officiis sunt reiciendis magni. Molestiae, voluptatum libero, dicta nam beatae est accusamus neque quae aspernatur dolore excepturi illo eaque minus quas. Unde, magnam rem voluptatum, natus delectus ducimus iusto sint quia minus sed possimus molestiae at, omnis cupiditate. Sint maxime cum esse voluptas libero eligendi praesentium similique reprehenderit necessitatibus sapiente ea iste laboriosam accusantium dolorem incidunt sequi consectetur tenetur, soluta in dignissimos deleniti? Quae perferendis, saepe exercitationem explicabo unde ducimus tempora quia at, consectetur aspernatur distinctio laborum, fugit veniam veritatis aliquam asperiores voluptatum nobis sapiente facilis. Est accusamus mollitia quis aut eveniet, aliquam quisquam quo ipsam dolorum. Nemo!</div> */}
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
                            {/* <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel iste cumque porro facilis ea vero, est debitis beatae quis inventore, error officia ex magnam rerum at molestiae nobis excepturi numquam perferendis explicabo deleniti nisi consectetur illo tempore! Deleniti, quam optio inventore vitae ex provident consequuntur quo similique doloribus in reiciendis? Laborum quos saepe dignissimos dolorum voluptates officia, reiciendis excepturi corrupti maiores numquam provident nesciunt pariatur officiis, laboriosam labore quia quaerat. Fuga earum atque praesentium id molestias corporis illo iure quisquam, nam ipsum sint. Assumenda sapiente voluptatum ex autem unde fugiat ut optio rem maiores veritatis aliquid expedita illo esse molestias dolore dicta, officiis sunt reiciendis magni. Molestiae, voluptatum libero, dicta nam beatae est accusamus neque quae aspernatur dolore excepturi illo eaque minus quas. Unde, magnam rem voluptatum, natus delectus ducimus iusto sint quia minus sed possimus molestiae at, omnis cupiditate. Sint maxime cum esse voluptas libero eligendi praesentium similique reprehenderit necessitatibus sapiente ea iste laboriosam accusantium dolorem incidunt sequi consectetur tenetur, soluta in dignissimos deleniti? Quae perferendis, saepe exercitationem explicabo unde ducimus tempora quia at, consectetur aspernatur distinctio laborum, fugit veniam veritatis aliquam asperiores voluptatum nobis sapiente facilis. Est accusamus mollitia quis aut eveniet, aliquam quisquam quo ipsam dolorum. Nemo!</div> */}
                        </section>

                        <section ref={appAccessRef}>
                            <SectionHeading variant="h2">
                                App Access (from the `SettingsTiles` component)
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
                            </SectionHeading>
                            {/* <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel iste cumque porro facilis ea vero, est debitis beatae quis inventore, error officia ex magnam rerum at molestiae nobis excepturi numquam perferendis explicabo deleniti nisi consectetur illo tempore! Deleniti, quam optio inventore vitae ex provident consequuntur quo similique doloribus in reiciendis? Laborum quos saepe dignissimos dolorum voluptates officia, reiciendis excepturi corrupti maiores numquam provident nesciunt pariatur officiis, laboriosam labore quia quaerat. Fuga earum atque praesentium id molestias corporis illo iure quisquam, nam ipsum sint. Assumenda sapiente voluptatum ex autem unde fugiat ut optio rem maiores veritatis aliquid expedita illo esse molestias dolore dicta, officiis sunt reiciendis magni. Molestiae, voluptatum libero, dicta nam beatae est accusamus neque quae aspernatur dolore excepturi illo eaque minus quas. Unde, magnam rem voluptatum, natus delectus ducimus iusto sint quia minus sed possimus molestiae at, omnis cupiditate. Sint maxime cum esse voluptas libero eligendi praesentium similique reprehenderit necessitatibus sapiente ea iste laboriosam accusantium dolorem incidunt sequi consectetur tenetur, soluta in dignissimos deleniti? Quae perferendis, saepe exercitationem explicabo unde ducimus tempora quia at, consectetur aspernatur distinctio laborum, fugit veniam veritatis aliquam asperiores voluptatum nobis sapiente facilis. Est accusamus mollitia quis aut eveniet, aliquam quisquam quo ipsam dolorum. Nemo!</div> */}
                        </section>

                        <section ref={memberAccessRef}>
                            <SectionHeading variant="h2">
                                Member Access
                            </SectionHeading>
                            {/* <div>Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel iste cumque porro facilis ea vero, est debitis beatae quis inventore, error officia ex magnam rerum at molestiae nobis excepturi numquam perferendis explicabo deleniti nisi consectetur illo tempore! Deleniti, quam optio inventore vitae ex provident consequuntur quo similique doloribus in reiciendis? Laborum quos saepe dignissimos dolorum voluptates officia, reiciendis excepturi corrupti maiores numquam provident nesciunt pariatur officiis, laboriosam labore quia quaerat. Fuga earum atque praesentium id molestias corporis illo iure quisquam, nam ipsum sint. Assumenda sapiente voluptatum ex autem unde fugiat ut optio rem maiores veritatis aliquid expedita illo esse molestias dolore dicta, officiis sunt reiciendis magni. Molestiae, voluptatum libero, dicta nam beatae est accusamus neque quae aspernatur dolore excepturi illo eaque minus quas. Unde, magnam rem voluptatum, natus delectus ducimus iusto sint quia minus sed possimus molestiae at, omnis cupiditate. Sint maxime cum esse voluptas libero eligendi praesentium similique reprehenderit necessitatibus sapiente ea iste laboriosam accusantium dolorem incidunt sequi consectetur tenetur, soluta in dignissimos deleniti? Quae perferendis, saepe exercitationem explicabo unde ducimus tempora quia at, consectetur aspernatur distinctio laborum, fugit veniam veritatis aliquam asperiores voluptatum nobis sapiente facilis. Est accusamus mollitia quis aut eveniet, aliquam quisquam quo ipsam dolorum. Nemo!</div> */}
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
