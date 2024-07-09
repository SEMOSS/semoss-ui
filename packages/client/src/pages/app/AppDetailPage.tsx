import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
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
    Stack,
} from '@semoss/ui';
import {
    MembersTable,
    PendingMembersTable,
    SettingsTiles,
} from '@/components/settings';
import {
    AppDetailsFormTypes,
    AppDetailsFormValues,
    ChangeAccessModal,
    DependencyTable,
    EditDetailsModal,
    EditDependenciesModal,
    appDependency,
    modelledDependency,
    fetchAppInfo,
    fetchMainUses,
    fetchDependencies,
    determineUserPermission,
    DetailsForm,
    AppDetailsRef,
} from '@/components/app';
import { ShareOverlay } from '@/components/workspace';
import { SettingsContext } from '@/contexts';
import { Env } from '@/env';
import { useRootStore } from '@/hooks';
import { formatPermission, toTitleCase } from '@/utility';

import AssignmentIcon from '@mui/icons-material/Assignment';
import EditIcon from '@mui/icons-material/Edit';
import HdrAutoIcon from '@mui/icons-material/HdrAuto';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NoteAltIcon from '@mui/icons-material/NoteAlt';
import ShareIcon from '@mui/icons-material/Share';

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

const SectionHeading = styled(Typography)(({ theme }) => ({
    fontSize: 20,
    fontWeight: '550',
    marginBottom: '0.75rem',
}));

const TitleSection = styled('section')({
    display: 'flex',
    gap: '1rem',
    paddingBottom: '3rem',
});

const TitleSectionImg = styled('img')({
    borderRadius: '0.75rem',
    height: '135px',
    width: '160px',
    overflow: 'hidden',
});

const TitleSectionBodyWrapper = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    justifyContent: 'center',
});

const TitleSectionBody = styled(Typography)(({ theme }) => ({
    alignItems: 'center',
    color: 'rgb(0, 0, 0, 0.6)',
    display: 'flex',
    gap: '0.25rem',
}));

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

export const AppDetailPage = () => {
    const { control, setValue, getValues, watch, handleSubmit } =
        useForm<AppDetailsFormTypes>({ defaultValues: AppDetailsFormValues });

    const markdown = watch('markdown');
    const tags = watch('tag');
    const appInfo = watch('appInfo');
    const userRole = watch('userRole');
    const permission = watch('permission');
    const dependencies = watch('dependencies');
    const detailsForm = watch('detailsForm');

    const [moreVertAnchorEl, setMoreVertAnchorEl] = useState(null);
    const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
    const [isChangeAccessModalOpen, setIsChangeAccessModalOpen] =
        useState(false);
    const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
    const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
        useState(false);

    const [values, setValues] = useState<DetailsForm>(
        AppDetailsFormValues.detailsForm,
    );

    const markdownRef = useRef<HTMLElement>(null);
    const tagsRef = useRef<HTMLElement>(null);
    const dependenciesRef = useRef<HTMLElement>(null);
    const appAccessRef = useRef<HTMLElement>(null);
    const memberAccessRef = useRef<HTMLElement>(null);
    const similarAppsRef = useRef<HTMLElement>(null);

    const refs = useMemo<
        { ref: React.MutableRefObject<HTMLElement>; display: string }[]
    >(() => {
        return [
            { ref: markdownRef, display: 'Main Uses' },
            { ref: tagsRef, display: 'Tags' },
            { ref: dependenciesRef, display: 'Dependencies' },
            { ref: appAccessRef, display: 'App Access' },
            { ref: memberAccessRef, display: 'Member Access' },
            { ref: similarAppsRef, display: 'Similar Apps' },
        ];
    }, []);

    const { monolithStore, configStore } = useRootStore();
    const navigate = useNavigate();
    const notification = useNotification();
    const { appId } = useParams();

    useEffect(() => {
        getPermission();
        setValue('appId', appId);
        fetchAllData(appId);
    }, [appId]);

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
            fetchAppInfo(
                monolithStore,
                id,
                configStore.store.config.projectMetaKeys.map((a) => a.metakey),
            ),
            fetchMainUses(monolithStore, id),
            fetchDependencies(monolithStore, id),
        ]).then((results) =>
            results.forEach((res, idx) => {
                if (res.status === 'rejected') {
                    emitMessage(true, res.reason);
                } else {
                    if (idx === 0) {
                        if (res.value.type === 'error') {
                            emitMessage(true, res.value.output);
                        } else {
                            setValue('appInfo', res.value.output);
                            const output = res.value.output;

                            const projectMetaKeys =
                                configStore.store.config.projectMetaKeys;
                            // Keep only relevant project keys defined for app details
                            const parsedMeta = projectMetaKeys
                                .map((k) => k.metakey)
                                .reduce((prev, curr) => {
                                    // tag, domain, and etc either come in as a string or a string[], format it to correct type
                                    const found = projectMetaKeys.find(
                                        (obj) => obj.metakey === curr,
                                    );

                                    if (curr === 'tag') {
                                        if (typeof output[curr] === 'string') {
                                            prev[curr] = [output[curr]];
                                        } else {
                                            prev[curr] = output[curr];
                                        }
                                    } else if (
                                        found.display_options ===
                                            'single-typeahead' ||
                                        found.display_options ===
                                            'select-box' ||
                                        found.display_options ===
                                            'multi-typeahead'
                                    ) {
                                        if (typeof output[curr] === 'string') {
                                            prev[curr] = [output[curr]];
                                        } else {
                                            prev[curr] = output[curr];
                                        }
                                    } else {
                                        prev[curr] = output[curr];
                                    }

                                    return prev;
                                }, {}) as AppDetailsFormTypes['detailsForm'];
                            setValue('detailsForm', parsedMeta);
                            setValue('tag', parsedMeta.tag);
                            setValues((prev) => ({ ...prev, ...parsedMeta }));
                        }
                    } else if (idx === 1) {
                        if (res.value.type === 'error') {
                            emitMessage(true, res.value.output);
                        } else {
                            setValue('markdown', res.value.output);
                            setValue('detailsForm.markdown', res.value.output);
                            setValues((prev) => ({
                                ...prev,
                                markdown: res.value.output || '',
                            }));
                        }
                    } else if (idx === 2) {
                        if (res.value.type === 'error') {
                            emitMessage(true, res.value.output);
                        } else {
                            const modelled = modelDependencies(
                                res.value.output,
                            );
                            setValue('dependencies', modelled);
                            setValue('selectedDependencies', modelled);
                        }
                    }
                }
            }),
        );
    };

    const modelDependencies = (
        dependencies: appDependency[],
    ): modelledDependency[] => {
        return dependencies.map((dep: appDependency) => ({
            name: dep.engine_name ? dep.engine_name.replace(/_/g, ' ') : '',
            id: dep.engine_id,
            type: dep.engine_type,
            userPermission: '', // TODO: no value currently available in the payload
            isPublic: !!dep.engine_global,
            isDiscoverable: !!dep.engine_discoverable,
        }));
    };

    const emitMessage = (isError: boolean, message: string) => {
        notification.add({
            color: isError ? 'error' : 'success',
            message,
        });
    };

    const handleCloseChangeAccessModal = () => {
        setIsChangeAccessModalOpen(false);
    };

    const handleCloseEditDetailsModal = (isReset?: boolean) => {
        if (isReset) {
            setValue('detailsForm', values);
        }
        setIsEditDetailsModalOpen(false);
    };

    const handleCloseDependenciesModal = async (refreshData: boolean) => {
        const currDependencies = getValues('dependencies');

        if (refreshData) {
            const appId = getValues('appId');
            const res = await fetchDependencies(monolithStore, appId);
            if (res.type === 'success') {
                const modelled = modelDependencies(res.output);
                setValue('dependencies', modelled);
                setValue('selectedDependencies', modelled);
            } else {
                setValue('selectedDependencies', currDependencies);
                notification.add({
                    color: 'error',
                    message: res.output,
                });
            }
        } else {
            setValue('selectedDependencies', currDependencies);
        }
        setIsEditDependenciesModalOpen(false);
    };

    // filter metakeys to the variable ones
    const projectMetaKeys = configStore.store.config.projectMetaKeys.filter(
        (k) => {
            return (
                k.metakey !== 'description' &&
                k.metakey !== 'markdown' &&
                k.metakey !== 'tag'
            );
        },
    );

    // Create refs for dynamic fields
    const createRefs = useMemo<AppDetailsRef[]>(() => {
        const refs = [];
        projectMetaKeys.forEach((meta) => {
            if (detailsForm?.[meta.metakey]) {
                refs.push({
                    ref: React.createRef<HTMLElement>(),
                    display: toTitleCase(meta.metakey),
                    ...meta,
                });
            }
        });
        return refs as AppDetailsRef[];
    }, [projectMetaKeys, detailsForm]);

    // Merge default/dynamic refs for side bar navigiation
    const detailRefs = [
        ...refs,
        ...createRefs.map((a) => ({ ref: a.ref, display: a.display })),
    ];

    /**
     * @name onSubmit
     * @desc update app details
     * @param data - form data
     */
    const onSubmit = handleSubmit((data: AppDetailsFormTypes) => {
        // copy over the defined keys
        const meta = {} as AppDetailsFormTypes['detailsForm'];
        if (data.detailsForm) {
            for (const key in data.detailsForm) {
                if (data.detailsForm[key] !== undefined) {
                    meta[key] = data.detailsForm[key];
                }
            }
        }

        if (Object.keys(meta).length === 0) {
            notification.add({
                color: 'warning',
                message: 'Nothing to Save',
            });

            return;
        }

        monolithStore
            .runQuery(
                `SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
                    meta,
                )}], jsonCleanup=[true])`,
            )
            .then((response) => {
                const { output, additionalOutput, operationType } =
                    response.pixelReturn[0];

                // track the errors
                if (operationType.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });

                    return;
                }

                // close it, refresh and succesfully message
                notification.add({
                    color: 'success',
                    message: additionalOutput[0].output,
                });

                fetchAllData(appId);
                handleCloseEditDetailsModal();
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error.message,
                });
            });
    });

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
                                value={''}
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
                    <Sidebar permission={permission} refs={detailRefs} />
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
                                    {permission === 'author' ? (
                                        <HdrAutoIcon />
                                    ) : permission === 'editor' ? (
                                        <NoteAltIcon />
                                    ) : (
                                        <AssignmentIcon />
                                    )}
                                    {`${formatPermission(userRole)} Access`}
                                </TitleSectionBody>
                                <TitleSectionBody variant="body1">
                                    {appInfo?.description
                                        ? appInfo?.description
                                        : 'No description available'}
                                </TitleSectionBody>
                            </TitleSectionBodyWrapper>
                        </TitleSection>

                        <StyledSection ref={markdownRef}>
                            <SectionHeading variant="h2">
                                Main uses
                            </SectionHeading>
                            <Typography variant="body1">{markdown}</Typography>
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
                        <>
                            {createRefs.map((k) => {
                                if (
                                    values[k.metakey] === undefined ||
                                    !Array.isArray(values[k.metakey])
                                ) {
                                    return null;
                                }

                                return (
                                    <StyledSection key={k.metakey} ref={k.ref}>
                                        <SectionHeading variant="h2">
                                            {k.display}
                                        </SectionHeading>
                                        <TagsBodyWrapper>
                                            {k.display_options ===
                                                'multi-checklist' ||
                                            k.display_options ===
                                                'multi-select' ||
                                            k.display_options ===
                                                'multi-typeahead' ||
                                            k.display_options ===
                                                'select-box' ? (
                                                <Stack
                                                    direction={'row'}
                                                    spacing={1}
                                                    flexWrap={'wrap'}
                                                >
                                                    {(
                                                        detailsForm[
                                                            k.metakey
                                                        ] as string[]
                                                    ).map((tag) => {
                                                        return (
                                                            <Chip
                                                                key={tag}
                                                                label={tag}
                                                            ></Chip>
                                                        );
                                                    })}
                                                </Stack>
                                            ) : (
                                                detailsForm[k.metakey]
                                            )}
                                        </TagsBodyWrapper>
                                    </StyledSection>
                                );
                            })}
                        </>

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

                                {dependencies.length > 0 ? (
                                    <DependencyTable
                                        dependencies={dependencies}
                                        permission={permission}
                                    />
                                ) : (
                                    <Typography variant="body1">
                                        No dependencies
                                    </Typography>
                                )}
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

                        {permission &&
                            permission !== 'discoverable' &&
                            permission !== 'readOnly' && (
                                <StyledSection ref={memberAccessRef}>
                                    <SectionHeading variant="h2">
                                        Member Access
                                    </SectionHeading>
                                    <SettingsContext.Provider
                                        value={{
                                            adminMode: false,
                                        }}
                                    >
                                        <Stack direction="column" spacing={2}>
                                            <PendingMembersTable
                                                mode="app"
                                                id={appId}
                                            />
                                            <MembersTable
                                                id={appId}
                                                mode="app"
                                                name="app"
                                            />
                                        </Stack>
                                    </SettingsContext.Provider>
                                </StyledSection>
                            )}

                        {(permission === 'discoverable' ||
                            permission === 'readOnly') && (
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
                onSubmit={onSubmit}
            />

            <EditDependenciesModal
                isOpen={isEditDependenciesModalOpen}
                onClose={handleCloseDependenciesModal}
                control={control}
                getValues={getValues}
                setValue={setValue}
                watch={watch}
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
    refs: { ref: React.MutableRefObject<HTMLElement>; display: string }[];
}

const Sidebar = ({ permission, refs }: SidebarProps) => {
    const [
        mainUsesRef,
        tagsRef,
        dependenciesRef,
        appAccessRef,
        memberAccessRef,
        similarAppsRef,
        ...dynamicRefs
    ] = refs;

    const scrollIntoView = (ref: React.MutableRefObject<HTMLElement>) => {
        ref.current.scrollIntoView({ behavior: 'smooth' });
    };

    const canEdit =
        permission &&
        permission !== 'discoverable' &&
        permission !== 'readOnly';

    return (
        <StyledSidebar>
            <SidebarMenuItem
                onClick={() => scrollIntoView(mainUsesRef.ref)}
                value={null}
            >
                Main Uses
            </SidebarMenuItem>
            <SidebarMenuItem
                onClick={() => scrollIntoView(tagsRef.ref)}
                value={null}
            >
                Tags
            </SidebarMenuItem>
            {dynamicRefs?.map((ref) => (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(ref.ref)}
                    value={null}
                    key={ref.display}
                >
                    {ref.display}
                </SidebarMenuItem>
            ))}
            {permission !== 'discoverable' && (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(dependenciesRef.ref)}
                    value={null}
                >
                    Dependencies
                </SidebarMenuItem>
            )}
            {permission === 'author' && (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(appAccessRef.ref)}
                    value={null}
                >
                    App Access
                </SidebarMenuItem>
            )}
            {canEdit && (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(memberAccessRef.ref)}
                    value={null}
                >
                    Member Access
                </SidebarMenuItem>
            )}
            {!canEdit && (
                <SidebarMenuItem
                    onClick={() => scrollIntoView(similarAppsRef.ref)}
                    value={null}
                >
                    Similar Apps
                </SidebarMenuItem>
            )}
        </StyledSidebar>
    );
};
