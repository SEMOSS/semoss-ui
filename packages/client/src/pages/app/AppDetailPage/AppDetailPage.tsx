import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AssignmentIcon from '@mui/icons-material/Assignment';
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
    styled,
    Typography,
    useNotification,
    Chip,
} from '@semoss/ui';
import { MembersTable, SettingsTiles } from '@/components/settings';
// import { AppSettings } from '@/components/app/AppSettings';
import { SettingsContext } from '@/contexts';
import { Env } from '@/env';
import { useRootStore } from '@/hooks';
import { formatPermission } from '@/utils';
import {
    AppDetailsFormTypes,
    AppDetailsFormValues,
} from './appDetails.utility';
import { ChangeAccessModal } from './ChangeAccessModal';
import { DeleteAppModal } from './DeleteAppModal';
import { EditDetailsModal } from './EditDetailsModal';
import { EditDependenciesModal } from './EditDependenciesModal';
import {
    fetchMainUses,
    fetchAppInfo,
    fetchDependencies,
    determineUserPermission,
} from './appDetails.utility';

const OuterContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    overflow: 'scroll',
    padding: '0 1rem',
    width: '100%',
}));

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

export const AppDetailPage = () => {
    const { control, setValue, getValues, watch } =
        useForm<AppDetailsFormTypes>({ defaultValues: AppDetailsFormValues });

    const mainUses = watch('mainUses');
    const appInfo = watch('appInfo');
    const userRole = watch('userRole');
    console.log('APP INFO', appInfo);
    const dependencies = watch('dependencies');

    const [moreVertAnchorEl, setMoreVertAnchorEl] = useState(null);
    const [isChangeAccessModalOpen, setIsChangeAccessModalOpen] =
        useState(false);
    const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
    const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
        useState(false);
    const [isDeleteAppModalOpen, setIsDeleteAppModalOpen] = useState(false);

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

    const { monolithStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();
    const { appId } = useParams();

    useEffect(() => {
        getPermission();
        setValue('appId', appId);

        fetchAllData(appId);
    }, []);

    async function getPermission() {
        const { permission: role } =
            await monolithStore.getUserProjectPermission(appId);

        setValue('userRole', role);
        const permission = determineUserPermission(role);
        if (permission === 'author') setValue('permission', 'author');
        if (permission === 'editor') setValue('permission', 'editor');
        if (permission === 'readOnly') setValue('permission', 'readOnly');
    }

    const fetchAllData = async (id: string) => {
        Promise.allSettled([
            fetchMainUses(monolithStore, id),
            fetchAppInfo(monolithStore, id),
            fetchDependencies(monolithStore, id),
        ]).then((results) =>
            results.forEach((result, idx) => {
                if (result.status === 'rejected') {
                    emitMessage(true, result.reason);
                } else {
                    if (idx === 0) {
                        if (result.value.type === 'error') {
                            emitMessage(true, result.value.output);
                        } else {
                            setValue('mainUses', result.value.output);
                        }
                    } else if (idx === 1) {
                        if (result.value.type === 'error') {
                            emitMessage(true, result.value.output);
                        } else {
                            setValue('appInfo', result.value.output);
                        }
                    } else if (idx === 2) {
                        if (result.value.type === 'error') {
                            emitMessage(true, result.value.output);
                        } else {
                            setValue('dependencies', result.value.output);
                        }
                    }
                }
            }),
        );
    };

    const emitMessage = (isError: boolean, message: string) => {
        notification.add({
            color: isError ? 'error' : 'success',
            message,
        });
    };

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

    const handleCloseChangeAccessModal = () => {
        setIsChangeAccessModalOpen(false);
    };

    function PermissionComponent(): JSX.Element {
        return (
            <>
                {userRole === 'OWNER' ? <HdrAutoIcon /> : null}
                {userRole === 'EDIT' || userRole === 'EDITOR' ? (
                    <NoteAltIcon />
                ) : null}
                {userRole === 'VIEWER' ||
                userRole === 'READ_ONLY' ||
                userRole === 'DISCOVERABLE' ? (
                    <AssignmentIcon />
                ) : null}
                {`${formatPermission(userRole)} Access`}
            </>
        );
    }

    function DependenciesBody(): JSX.Element {
        if (dependencies?.length > 0) {
            return (
                <>
                    {userRole === 'OWNER' ? null : (
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
                        {dependencies?.map(
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
                                        {formatPermission(userRole)}
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

    return (
        <OuterContainer>
            <InnerContainer>
                <Breadcrumbs>Breadcrumbs</Breadcrumbs>

                <TopButtonsContainer>
                    {userRole !== 'OWNER' && (
                        <ChangeAccessButton
                            variant="text"
                            onClick={() => setIsChangeAccessModalOpen(true)}
                        >
                            Change Access
                        </ChangeAccessButton>
                    )}

                    <Button variant="contained" onClick={() => navigate('../')}>
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
                        {(userRole === 'OWNER' ||
                            userRole === 'EDIT' ||
                            userRole === 'EDITOR') && (
                            <StyledMenuItem
                                onClick={() => {
                                    setIsEditDetailsModalOpen(true);
                                    setMoreVertAnchorEl(null);
                                }}
                                value={null}
                            >
                                <EditIcon fontSize="small" />
                                Edit App Details
                            </StyledMenuItem>
                        )}
                        <StyledMenuItem value={null}>
                            <ShareIcon fontSize="small" />
                            Share
                        </StyledMenuItem>
                        {userRole === 'OWNER' && (
                            <StyledMenuItem
                                onClick={() => {
                                    setIsDeleteAppModalOpen(true);
                                    setMoreVertAnchorEl(null);
                                }}
                                value={null}
                            >
                                <DeleteIcon fontSize="small" />
                                Delete App
                            </StyledMenuItem>
                        )}
                    </Menu>
                </TopButtonsContainer>

                <SidebarAndSectionsContainer>
                    <Sidebar userRole={userRole} refs={refs} />

                    <Sections>
                        <TitleSection>
                            <TitleSectionImg
                                src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
                                alt="App Image"
                            />
                            <TitleSectionBodyWrapper>
                                <SectionHeading variant="h1">
                                    {appInfo?.project_name}
                                </SectionHeading>
                                <TitleSectionBody variant="body1">
                                    <PermissionComponent />
                                </TitleSectionBody>
                                <TitleSectionBody variant="body1">
                                    {appInfo?.description
                                        ? appInfo?.description
                                        : 'No description available'}
                                </TitleSectionBody>
                            </TitleSectionBodyWrapper>
                        </TitleSection>

                        <section ref={mainUsesRef}>
                            <SectionHeading variant="h2">
                                Main uses
                            </SectionHeading>
                            <Typography variant="body1">{mainUses}</Typography>
                        </section>

                        <section ref={tagsRef}>
                            <SectionHeading variant="h2">Tags</SectionHeading>
                            {appInfo?.tag ? (
                                <TagsBodyWrapper>
                                    {appInfo?.tag.map((tag, idx) => (
                                        <Chip
                                            key={`tag-${tag}-${idx}`}
                                            label={tag}
                                        />
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

                        {userRole === 'DISCOVERABLE' ? null : (
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
                                    direction="row"
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

            <ChangeAccessModal
                open={isChangeAccessModalOpen}
                onClose={handleCloseChangeAccessModal}
                control={control}
            />

            <EditDetailsModal
                isOpen={isEditDetailsModalOpen}
                onClose={() => setIsEditDetailsModalOpen(false)}
                control={control}
                getValues={getValues}
            />

            <EditDependenciesModal
                isOpen={isEditDependenciesModalOpen}
                onClose={() => setIsEditDependenciesModalOpen(false)}
                dependencies={dependencies}
                runSetDependenciesQuery={runSetDependenciesQuery}
            />

            <DeleteAppModal
                isOpen={isDeleteAppModalOpen}
                appId={appId}
                appName="TODO"
                onDelete={() => {
                    console.log('HELLO');
                }}
                close={() => setIsDeleteAppModalOpen(false)}
            />
        </OuterContainer>
    );
};

const StyledSidebar = styled('div')(({ theme }) => ({
    borderRight: `2px solid ${theme.palette.secondary.main}`,
    display: 'flex',
    flexDirection: 'column',
    fontWeight: 'bold',
    gap: '1rem',
    paddingRight: '0.7rem',
    position: 'fixed',
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
    userRole: string;
    refs: React.MutableRefObject<HTMLElement>[];
}

const Sidebar = ({ userRole, refs }: SidebarProps) => {
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
        userRole === 'DISCOVERABLE'
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
};
