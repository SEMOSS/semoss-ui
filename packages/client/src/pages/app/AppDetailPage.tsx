import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
    Breadcrumbs,
    Button,
    ButtonGroup,
    IconButton,
    Menu,
    MenuItem,
    styled,
    useNotification,
} from '@semoss/ui';
import { SettingsTiles } from '@/components/settings/SettingsTiles';
import { AppSettings } from '@/components/app/AppSettings';
import { usePixel, useRootStore } from '@/hooks';
import { MonolithStore } from '@/stores';

// TODO: Implement top drop-down menus.

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
    gap: '0.25rem',
    marginLeft: 'auto',
});

const StyledTextButton = styled(Button)(({ theme }) => ({
    fontWeight: 'bold',
}));

const StyledArrowDropDownIcon = styled(ArrowDropDownIcon)({
    '&:first-child': {
        display: 'flex',
    },
});

const StyledHeading2 = styled('h2')({
    fontSize: 18,
    fontWeight: '550',
    margin: '0.5rem 0',
});

const Content = styled('div')({
    display: 'flex',
});

const Sections = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    fontWeight: 'bold',
    width: '100%',
});

export function AppDetailPage() {
    // App ID Needed for pixel calls
    const { appId } = useParams();
    const { configStore, monolithStore } = useRootStore();

    const notification = useNotification();
    const navigate = useNavigate();

    const dependencies = usePixel(`GetProjectDependencies(project="${appId}")`);

    // const setDependencies = usePixel(
    //     `SetProjectDependencies(project="${appId}", dependencies="${dependencies})`,
    // );

    const [arrowAnchorEl, setArrowAnchorEl] = useState(null);
    const [moreVertAnchorEl, setMoreVertAnchorEl] = useState(null);

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

    // TODO: Explicitly set type based on expected options.
    // TODO: Handle errors in pixel calls.
    // TODO: Apply usePixel instead.
    // TODO: Check out how we do this in legacy.
    // To run legacy, do `pnpm run dev:legacy`
    // Tend to pass reactors arrays, even if one arg.
    const [permissionState, setPermissionState] = useState('');
    const [appInfoState, setAppInfoState] = useState(null);
    const [dependenciesState, setDependenciesState] = useState(null);

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
                    <StyledTextButton variant="text">
                        Change Access
                    </StyledTextButton>
                    <ButtonGroup>
                        <Button variant="contained">Open</Button>
                        <Button variant="contained" sx={{ display: 'flex' }}>
                            <StyledArrowDropDownIcon />
                        </Button>
                    </ButtonGroup>
                    <IconButton>
                        <MoreVertIcon />
                    </IconButton>
                </TopButtonsContainer>
                <Content
                    style={{
                        display: 'flex',
                    }}
                >
                    <Sidebar />
                    <Sections>
                        <div>
                            {/* <div>{appInfoState.project_name}</div> */}
                            <div>Permission: {permissionState}</div>
                            <div>Description</div>
                        </div>
                        <StyledHeading2 id="#dependencies-app-detail-page">
                            <div
                                style={{
                                    alignItems: 'center',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                <div>Dependencies</div>
                                {dependenciesState?.length > 0
                                    ? dependenciesState.map((dependency) => (
                                          <div key={nanoid()}>{dependency}</div>
                                      ))
                                    : 'This app has no dependencies. (Prompt to add dependencies.)'}
                                <IconButton sx={{ marginLeft: 'auto' }}>
                                    <EditIcon />
                                </IconButton>
                            </div>
                        </StyledHeading2>
                        {/* {HEADINGS.map(({ id, text }) => (
                            <StyledHeading2
                                key={nanoid()}
                                id={`#${id}-app-detail-page`}
                            >
                                {text}
                            </StyledHeading2>
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
                        <pre id="#app-access">
                            App Access section (components from Settings)
                        </pre>
                    </Sections>
                </Content>
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
    fontSize: 13,
    fontWeight: 'bold',
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
                    {text}
                </SidebarLink>
            ))}
        </StyledSidebar>
    );
}
