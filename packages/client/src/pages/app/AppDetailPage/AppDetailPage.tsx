import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import AssignmentIcon from '@mui/icons-material/Assignment';
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
    Modal,
} from '@semoss/ui';
import { ShareOverlay } from '@/components/workspace';
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
    padding: `${theme.spacing(6)} 1rem 0`,
    width: '100%',
}));

const InnerContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: theme.spacing(3),
    margin: 'auto',
    maxWidth: '79rem',
    width: '100%',
}));

const StyledLink = styled(Link)(({ theme }) => ({
    textDecoration: 'none',
}));

const StyledCrumb = styled(Typography, {
    shouldForwardProp: (prop) => prop !== 'disabled',
})<{ disabled?: true }>(({ theme, disabled }) => ({
    color: theme.palette.text.primary,

    ...(disabled && {
        color: theme.palette.text.disabled,
    }),
}));

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

const StyledSection = styled('section')(({ theme }) => ({
    paddingBottom: theme.spacing(1),
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

export const AppDetailPage = () => {
    const { control, setValue, getValues, watch } =
        useForm<AppDetailsFormTypes>({ defaultValues: AppDetailsFormValues });

    const mainUses = watch('mainUses');
    const tags = watch('tags');
    const appInfo = watch('appInfo');
    const userRole = watch('userRole');
    const permission = watch('permission');
    const dependencies = watch('dependencies');

    const [moreVertAnchorEl, setMoreVertAnchorEl] = useState(null);
    const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
    const [isChangeAccessModalOpen, setIsChangeAccessModalOpen] =
        useState(false);
    const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
    const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
        useState(false);

    const mainUsesRef = useRef<HTMLElement>(null);
    const tagsRef = useRef<HTMLElement>(null);
    const dependenciesRef = useRef<HTMLElement>(null);
    const appAccessRef = useRef<HTMLElement>(null);
    const memberAccessRef = useRef<HTMLElement>(null);
    const similarAppsRef = useRef<HTMLElement>(null);

    const refs = [
        mainUsesRef,
        tagsRef,
        dependenciesRef,
        appAccessRef,
        memberAccessRef,
        similarAppsRef,
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
        if (permission === 'author') {
            setValue('permission', 'author');
            setValue('requestedPermission', 'author');
        } else if (permission === 'editor') {
            setValue('permission', 'editor');
            setValue('requestedPermission', 'editor');
        } else if (permission === 'readOnly') {
            setValue('permission', 'readOnly');
            setValue('requestedPermission', 'readOnly');
        } else if (permission === 'discoverable') {
            setValue('permission', 'discoverable');
        }
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
                            setValue(
                                'detailsForm.mainUses',
                                result.value.output,
                            );
                        }
                    } else if (idx === 1) {
                        if (result.value.type === 'error') {
                            emitMessage(true, result.value.output);
                        } else {
                            setValue('appInfo', result.value.output);
                            setValue('tags', result.value.output.tag || []);
                            setValue(
                                'detailsForm.tags',
                                result.value.output.tag || [],
                            );
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

    const handleCloseEditDetailsModal = (reset?: boolean) => {
        if (reset) {
            setValue('detailsForm', {
                mainUses,
                tags,
            });
        }
        setIsEditDetailsModalOpen(false);
    };

    function DependenciesBody(): JSX.Element {
        if (dependencies?.length > 0) {
            return (
                <>
                    {permission === 'author' ? null : (
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
                <Breadcrumbs separator="/">
                    <StyledLink href="/">
                        <StyledCrumb variant="body1">App Library</StyledCrumb>
                    </StyledLink>
                    <StyledCrumb variant="body1" disabled>
                        {appInfo?.project_name}
                    </StyledCrumb>
                </Breadcrumbs>

                <TopButtonsContainer>
                    {permission !== 'author' && (
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
                        {(permission === 'author' ||
                            permission === 'editor') && (
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
                        <StyledMenuItem
                            value={null}
                            onClick={() => setIsShareOverlayOpen(true)}
                        >
                            <ShareIcon fontSize="small" />
                            Share
                        </StyledMenuItem>
                    </Menu>
                </TopButtonsContainer>

                <SidebarAndSectionsContainer>
                    <Sidebar permission={permission} refs={refs} />

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
                                    {() => {
                                        if (permission === 'author') {
                                            return <HdrAutoIcon />;
                                        } else if (permission === 'editor') {
                                            return <NoteAltIcon />;
                                        } else {
                                            return <AssignmentIcon />;
                                        }
                                    }}
                                    {`${formatPermission(userRole)} Access`}
                                </TitleSectionBody>
                                <TitleSectionBody variant="body1">
                                    {appInfo?.description
                                        ? appInfo?.description
                                        : 'No description available'}
                                </TitleSectionBody>
                            </TitleSectionBodyWrapper>
                        </TitleSection>

                        <StyledSection ref={mainUsesRef}>
                            <SectionHeading variant="h2">
                                Main uses
                            </SectionHeading>
                            <Typography variant="body1">{mainUses}</Typography>
                        </StyledSection>

                        <StyledSection ref={tagsRef}>
                            <SectionHeading variant="h2">Tags</SectionHeading>
                            {tags ? (
                                <TagsBodyWrapper>
                                    {tags.map((tag, idx) => (
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
                        </StyledSection>

                        {permission !== 'discoverable' && (
                            <StyledSection ref={dependenciesRef}>
                                <DependenciesHeadingWrapper>
                                    <SectionHeading variant="h2">
                                        Dependencies
                                    </SectionHeading>
                                    {(permission === 'author' ||
                                        permission === 'editor') && (
                                        <IconButton
                                            onClick={() =>
                                                setIsEditDependenciesModalOpen(
                                                    true,
                                                )
                                            }
                                            sx={{
                                                position: 'absolute',
                                                right: 0,
                                                top: '-0.4rem',
                                            }}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    )}
                                </DependenciesHeadingWrapper>
                                <DependenciesBody />
                            </StyledSection>
                        )}

                        {permission === 'author' && (
                            <StyledSection ref={appAccessRef}>
                                <SectionHeading variant="h2">
                                    App Access
                                </SectionHeading>
                                <SettingsContext.Provider
                                    value={{
                                        adminMode: false,
                                    }}
                                >
                                    <SettingsTiles
                                        mode="app"
                                        name="app"
                                        direction="row"
                                        id={appId}
                                        onDelete={() => {
                                            navigate('/settings/app');
                                        }}
                                    />
                                </SettingsContext.Provider>
                            </StyledSection>
                        )}

                        {permission !== 'discoverable' && (
                            <StyledSection ref={memberAccessRef}>
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
                                        mode="app"
                                        name="app"
                                    />
                                </SettingsContext.Provider>
                            </StyledSection>
                        )}

                        {permission === 'discoverable' && (
                            <StyledSection ref={similarAppsRef}>
                                <SectionHeading variant="h2">
                                    Similar Apps
                                </SectionHeading>
                            </StyledSection>
                        )}
                    </Sections>
                </SidebarAndSectionsContainer>
            </InnerContainer>

            <Modal
                open={isShareOverlayOpen}
                onClose={() => setIsShareOverlayOpen(false)}
            >
                <ShareOverlay
                    appId={appId}
                    diffs={false}
                    onClose={() => setIsShareOverlayOpen(false)}
                />
            </Modal>

            <ChangeAccessModal
                open={isChangeAccessModalOpen}
                onClose={handleCloseChangeAccessModal}
                control={control}
            />

            <EditDetailsModal
                isOpen={isEditDetailsModalOpen}
                onClose={handleCloseEditDetailsModal}
                control={control}
                getValues={getValues}
                setValue={setValue}
            />

            <EditDependenciesModal
                isOpen={isEditDependenciesModalOpen}
                onClose={() => setIsEditDependenciesModalOpen(false)}
                dependencies={dependencies}
                runSetDependenciesQuery={runSetDependenciesQuery}
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
    permission: string;
    refs: React.MutableRefObject<HTMLElement>[];
}

const Sidebar = ({ permission, refs }: SidebarProps) => {
    const [
        mainUsesRef,
        tagsRef,
        dependenciesRef,
        appAccessRef,
        memberAccessRef,
        similarAppsRef,
    ] = refs;

    const scrollIntoView = (ref: React.MutableRefObject<HTMLElement>) => {
        ref.current.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <StyledSidebar>
            <SidebarMenuItem
                onClick={() => scrollIntoView(mainUsesRef)}
                value={null}
            >
                Main Uses
            </SidebarMenuItem>
            <SidebarMenuItem
                onClick={() => scrollIntoView(tagsRef)}
                value={null}
            >
                Tags
            </SidebarMenuItem>
            {permission !== 'discoverable' && (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(dependenciesRef)}
                    value={null}
                >
                    Dependencies
                </SidebarMenuItem>
            )}
            {permission === 'author' && (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(appAccessRef)}
                    value={null}
                >
                    App Access
                </SidebarMenuItem>
            )}
            {permission !== 'discoverable' && (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(memberAccessRef)}
                    value={null}
                >
                    Member Access
                </SidebarMenuItem>
            )}
            {permission === 'discoverable' && (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(similarAppsRef)}
                    value={null}
                >
                    Similar Apps
                </SidebarMenuItem>
            )}
        </StyledSidebar>
    );
};
