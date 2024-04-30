import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { Controller, useForm } from 'react-hook-form';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HdrAutoIcon from '@mui/icons-material/HdrAuto';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import ShareIcon from '@mui/icons-material/Share';
import {
    Breadcrumbs,
    Button,
    Link,
    IconButton,
    Menu,
    MenuItem,
    Modal,
    styled,
    Typography,
    Select,
} from '@semoss/ui';
import { MembersTable, SettingsTiles } from '@/components/settings';
// import { AppSettings } from '@/components/app/AppSettings';
import { SettingsContext } from '@/contexts';
import { Env } from '@/env';
import { useRootStore } from '@/hooks';
// import { usePixel, useRootStore } from '@/hooks';
// import { MonolithStore } from '@/stores';
import { Role } from '@/types';
import { formatPermission } from '@/utils';
import { usePixel } from '@/hooks';

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

const DependenciesHeadingWrapper = styled('div')({
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

const DependenciesTable = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
});

const DependencyRow = styled('div')({
    display: 'flex',
    width: '100%',
});

export function AppDetailPage() {
    const [permissionState, setPermissionState] = useState<Role | ''>('');
    const [appInfoState, setAppInfoState] = useState(null);
    const [mainUsesState, setMainUsesState] = useState('');
    const [dependenciesState, setDependenciesState] = useState([]);
    // const [selectedDependenciesState, setSelectedDependenciesState] = useState(
    //     [],
    // );
    const [moreVertAnchorEl, setMoreVertAnchorEl] = useState(null);
    const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
    const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
        useState(false);

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
        getMainUses();
        getDependencies();
    }, []);

    async function getPermission() {
        const response = await monolithStore.getUserProjectPermission(appId);
        setPermissionState(response.permission);
    }

    async function getAppInfo() {
        const response = await monolithStore.runQuery(
            `ProjectInfo(project="${appId}")`,
        );
        const appInfo = response.pixelReturn[0].output;
        setAppInfoState(appInfo);
        return appInfo;
    }
    async function getMainUses() {
        const response = await monolithStore.runQuery(
            `GetProjectMarkdown(project="${appId}")`,
        );
        const mainUses = response.pixelReturn[0].output;
        setMainUsesState(mainUses);
    }

    async function getDependencies() {
        const response = await monolithStore.runQuery(
            `GetProjectDependencies(project="${appId}", details=[true])`,
        );
        const dependencies = response.pixelReturn[0].output;
        setDependenciesState(dependencies);
        return dependencies;
    }

    async function runSetMainUses() {
        const response = await monolithStore.runQuery(
            `SetProjectMetadata(project="${appId}", meta=[{"markdown":"test123test123"}])`,
        );
        console.log('🚀 ~ runSetProjectMetadata ~ response:', response);
        if (response?.errors?.length === 0) {
            getMainUses();
        }
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
        // console.log('🚀 ~ setDependenciesQuery ~ response:', response);
    }

    function PermissionComponent(): JSX.Element {
        return (
            <>
                {permissionState === 'OWNER' ? <HdrAutoIcon /> : null}
                {permissionState === 'EDIT' || permissionState === 'EDITOR' ? (
                    <NoteAltIcon />
                ) : null}
                {permissionState === 'VIEWER' ||
                permissionState === 'READ_ONLY' ||
                permissionState === 'DISCOVERABLE' ? (
                    <AssignmentIcon />
                ) : null}
                {`${formatPermission(permissionState)} Access`}
            </>
        );
    }

    function DependenciesBody(): JSX.Element {
        if (dependenciesState?.length > 0) {
            return (
                <>
                    {permissionState === 'OWNER' ? null : (
                        <pre
                            style={{
                                background: 'gray',
                                padding: '1rem',
                                textAlign: 'center',
                                width: '100%',
                            }}
                        >
                            (Warning component)
                        </pre>
                    )}
                    <DependenciesTable>
                        <DependencyRow>
                            <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{ width: '50%' }}
                            >
                                Dependency
                            </Typography>
                            <Typography
                                variant="body2"
                                fontWeight="bold"
                                sx={{ width: '50%' }}
                            >
                                Current level of access
                            </Typography>
                        </DependencyRow>
                        {dependenciesState?.map(
                            ({ engine_id, engine_name, engine_type }) => (
                                <DependencyRow
                                    key={`name-${engine_name}--id-${engine_id}`}
                                >
                                    <Link
                                        href={`./#/engine/${engine_type}/${engine_id}`}
                                        sx={{ width: '50%' }}
                                    >
                                        <Typography variant="body2">
                                            {engine_name}
                                        </Typography>
                                    </Link>
                                    <Typography
                                        variant="body2"
                                        sx={{ width: '50%' }}
                                    >
                                        {formatPermission(permissionState)}
                                    </Typography>
                                </DependencyRow>
                            ),
                        )}
                    </DependenciesTable>
                </>
            );
        } else {
            return <Typography variant="body1">No dependencies</Typography>;
        }
    }

    // TODO: Close `MoreVert` menu on modal open

    return (
        <OuterContainer>
            <InnerContainer>
                <Breadcrumbs>Breadcrumbs</Breadcrumbs>

                <TopButtonsContainer>
                    <ChangeAccessButton variant="text">
                        Change Access
                    </ChangeAccessButton>
                    <Button onClick={() => navigate('../')} variant="contained">
                        Open
                    </Button>
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
                        <StyledMenuItem
                            onClick={() => setIsEditDetailsModalOpen(true)}
                            value={null}
                        >
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
                    <Sidebar permissionState={permissionState} refs={refs} />

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
                            <Typography variant="body1">
                                {mainUsesState}
                            </Typography>
                        </section>

                        <section ref={tagsRef}>
                            <SectionHeading variant="h2">Tags</SectionHeading>
                            {appInfoState?.tag ? (
                                <TagsBodyWrapper>
                                    {appInfoState?.tag.map((tag, idx) => (
                                        <Tag key={`tag-${tag}-${idx}`}>
                                            {tag}
                                        </Tag>
                                    ))}
                                </TagsBodyWrapper>
                            ) : (
                                <Typography variant="body1">
                                    No tags available
                                </Typography>
                            )}
                        </section>

                        <section ref={videosRef} style={{ display: 'none' }}>
                            <SectionHeading variant="h2">Videos</SectionHeading>
                        </section>

                        {permissionState === 'DISCOVERABLE' ? null : (
                            <section ref={dependenciesRef}>
                                <DependenciesHeadingWrapper>
                                    <SectionHeading variant="h2">
                                        Dependencies
                                    </SectionHeading>
                                    <IconButton
                                        onClick={() =>
                                            setIsEditDependenciesModalOpen(true)
                                        }
                                        sx={{
                                            position: 'absolute',
                                            right: 0,
                                            top: '-0.4rem',
                                        }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </DependenciesHeadingWrapper>
                                <DependenciesBody />
                            </section>
                        )}

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
                            <SettingsContext.Provider
                                value={{
                                    adminMode: false,
                                }}
                            >
                                <MembersTable
                                    id={appId}
                                    mode={'app'}
                                    name={'app'}
                                />
                            </SettingsContext.Provider>
                        </section>
                    </Sections>
                </SidebarAndSectionsContainer>
            </InnerContainer>

            <EditDetailsModal
                isOpen={isEditDetailsModalOpen}
                onClose={() => setIsEditDetailsModalOpen(false)}
                runSetMainUses={runSetMainUses}
            />

            <EditDependenciesModal
                isOpen={isEditDependenciesModalOpen}
                onClose={() => setIsEditDependenciesModalOpen(false)}
                dependenciesState={dependenciesState}
                setDependenciesState={setDependenciesState}
                getDependencies={getDependencies}
                runSetDependenciesQuery={runSetDependenciesQuery}
            />
        </OuterContainer>
    );
}

const StyledSidebar = styled('div')(({ theme }) => ({
    borderRight: `2px solid ${theme.palette.secondary.main}`,
    display: 'flex',
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
    permissionState: string;
    refs: React.MutableRefObject<HTMLElement>[];
}

function Sidebar({ permissionState, refs }: SidebarProps) {
    const [
        mainUsesRef,
        tagsRef,
        // videosRef,
        dependenciesRef,
        appAccessRef,
        memberAccessRef,
    ] = refs;

    const headings = [
        { text: 'Main Uses', ref: mainUsesRef },
        { text: 'Tags', ref: tagsRef },
        // { text: 'Videos', ref: videosRef },
        permissionState === 'DISCOVERABLE'
            ? null
            : { text: 'Dependencies', ref: dependenciesRef },
        { text: 'App Access', ref: appAccessRef },
        { text: 'Member Access', ref: memberAccessRef },
    ];

    return (
        <StyledSidebar>
            {headings.map(({ text, ref }, idx) => (
                <SidebarMenuItem
                    onClick={() =>
                        ref.current.scrollIntoView({ behavior: 'smooth' })
                    }
                    key={`sidebar-menu-${idx}`}
                    value={null}
                >
                    {text}
                </SidebarMenuItem>
            ))}
        </StyledSidebar>
    );
}

const EditModalInnerContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
});

const ModalHeaderWrapper = styled('div')({
    alignItems: 'center',
    display: 'flex',
    marginBottom: '1rem',
    justifyContent: 'space-between',
});

const ModalHeading = styled(Typography)({
    fontSize: 20,
    fontWeight: 500,
});

const ModalFooter = styled('div')({
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto',
});

const ModalSectionHeading = styled(Typography)({
    fontSize: 16,
    fontWeight: 500,
    margin: '1rem 0 0.5rem 0',
});

interface EditDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    runSetMainUses: () => Promise<void>;
}

function EditDetailsModal({
    isOpen,
    onClose,
    runSetMainUses,
}: EditDetailsModalProps) {
    return (
        <Modal open={isOpen} fullWidth>
            <EditModalInnerContainer>
                <ModalHeaderWrapper>
                    <ModalHeading variant="h2">Edit App Details</ModalHeading>
                    <IconButton onClick={() => onClose()}>
                        <CloseIcon />
                    </IconButton>
                </ModalHeaderWrapper>

                <ModalSectionHeading variant="h3">
                    Main Uses
                </ModalSectionHeading>
                <Button onClick={() => runSetMainUses()}>
                    <pre>set test main uses</pre>
                </Button>

                <ModalSectionHeading variant="h3">Tags</ModalSectionHeading>

                <ModalFooter>
                    <Button onClick={() => onClose()} variant="text">
                        Cancel
                    </Button>
                    <Button onClick={null} variant="contained">
                        Save
                    </Button>
                </ModalFooter>
            </EditModalInnerContainer>
        </Modal>
    );
}

const ModalDependencyRow = styled('div')({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    margin: '0.5rem 0',
});

const ModalEngineName = styled(Typography)({
    marginBottom: '0.5rem',
});

const ModalEngineTypeAndId = styled(Typography)({
    fontSize: 12,
});

// TODO: Improve interface

interface EditDependenciesModalProps {
    isOpen: boolean;
    onClose: () => void;
    dependenciesState: any;
    setDependenciesState: any;
    getDependencies: any;
    runSetDependenciesQuery: any;
}

function EditDependenciesModal({
    isOpen,
    onClose,
    dependenciesState,
    setDependenciesState,
    getDependencies,
    runSetDependenciesQuery,
}: EditDependenciesModalProps) {
    // TODO: Get dependency image
    // TODO: Add search bar
    // TODO: Add save functionality

    // Temporary: I need all Engines
    const [engines, setEngines] = useState({
        models: [],
        databases: [],
        storages: [],
    });

    const [dependency, setDependency] = useState(null);

    const getEngines = usePixel<
        { app_id: string; app_name: string; app_type: string }[]
    >(`
        MyEngines();
    `);

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }

        const cleanedEngines = getEngines.data.map((d) => ({
            app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            app_id: d.app_id,
            app_type: d.app_type,
        }));

        const newEngines = {
            models: cleanedEngines.filter((e) => e.app_type === 'MODEL'),
            databases: cleanedEngines.filter((e) => e.app_type === 'DATABASE'),
            storages: cleanedEngines.filter((e) => e.app_type === 'STORAGE'),
        };

        setEngines(newEngines);
    }, [getEngines.status, getEngines.data]);

    const saveDependencies = () => {
        runSetDependenciesQuery([dependency]);
    };

    return (
        <Modal open={isOpen} fullWidth>
            <EditModalInnerContainer>
                <ModalHeaderWrapper>
                    <ModalHeading variant="h2">
                        Add and Edit Dependencies
                    </ModalHeading>
                    <IconButton onClick={() => onClose()}>
                        <CloseIcon />
                    </IconButton>
                </ModalHeaderWrapper>

                <Typography
                    variant="h3"
                    fontWeight="medium"
                    sx={{ fontSize: '14px' }}
                >
                    Linked Dependencies
                </Typography>

                <pre>search bar</pre>

                <Select
                    onChange={(e) => {
                        setDependency(e.target.value);
                    }}
                >
                    {engines.models.map((model, i) => {
                        return (
                            <Select.Item
                                key={`select-item--${model}--${i}`}
                                value={model.app_id}
                            >
                                {model.app_id}
                            </Select.Item>
                        );
                    })}
                </Select>

                {dependenciesState?.map(
                    ({ engine_id, engine_name, engine_type }, idx) => (
                        <ModalDependencyRow
                            key={`dependency-${engine_id}-${idx}`}
                        >
                            <div>
                                <ModalEngineName
                                    variant="body1"
                                    fontWeight="medium"
                                >
                                    {engine_name}
                                </ModalEngineName>
                                <ModalEngineTypeAndId variant="body2">
                                    {engine_type} | Engine ID: {engine_id}
                                </ModalEngineTypeAndId>
                            </div>
                            <IconButton onClick={() => null}>
                                <CloseIcon />
                            </IconButton>
                        </ModalDependencyRow>
                    ),
                )}

                <ModalFooter>
                    <Button onClick={() => onClose()} variant="text">
                        Cancel
                    </Button>
                    <Button onClick={saveDependencies} variant="contained">
                        Save
                    </Button>
                </ModalFooter>
            </EditModalInnerContainer>
        </Modal>
    );
}
