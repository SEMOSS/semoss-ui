import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    Breadcrumbs,
    Button,
    IconButton,
    Menu,
    styled,
    Typography,
    useNotification,
    Chip,
    Modal,
    Stack,
    CircularProgress,
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
import {
    Add,
    Edit,
    HdrAuto,
    MoreVert,
    Share,
    EditLocation,
    RemoveRedEyeRounded,
    SimCardDownload,
} from '@mui/icons-material';

import { Link } from 'react-router-dom';

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

const ActionBar = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    marginLeft: 'auto',
}));

const PageBody = styled('div')(({ theme }) => ({
    marginLeft: '200px',
    display: 'flex',
    flexDirection: 'column',
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
    fontSize: 20,
    fontWeight: '500',
    marginBottom: theme.spacing(1),
}));

const TitleSection = styled('section')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    paddingBottom: theme.spacing(6),
}));

const TitleSectionImg = styled('img')(({ theme }) => ({
    borderRadius: theme.spacing(0.75),
    height: '135px',
    width: '160px',
    overflow: 'hidden',
}));

const TitleSectionBodyWrapper = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    justifyContent: 'center',
});

const TitleSectionBody = styled(Typography)(({ theme }) => ({
    alignItems: 'center',
    color: theme.palette.secondary.dark,
    display: 'flex',
    gap: '0.25rem',
}));

const TagsBodyWrapper = styled('div')({
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.6rem',
});

const StyledSection = styled('section')(({ theme }) => ({
    paddingBottom: theme.spacing(3),
}));

const DependenciesHeadingWrapper = styled('div')({
    alignItems: 'start',
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
});

const StyledMenuItem = styled(Menu.Item)(({ theme }) => ({
    color: theme.palette.secondary.dark,
    display: 'flex',
    gap: theme.spacing(0.5),
    alignItems: 'center',
    height: '48px',
}));

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
        setValue('appId', appId);
        fetchUserSpecificData();
        fetchAppData(appId);
    }, [appId]);

    const fetchUserSpecificData = async () => {
        const currPermission = getValues('permission');
        await getPermission();
        const newPermission = getValues('permission');

        if (newPermission !== currPermission && newPermission === 'readOnly') {
            fetchSimilarApps();
        }
    };

    async function getPermission() {
        const { permission: role } =
            await monolithStore.getUserProjectPermission(appId);

        setValue('userRole', role);
        const permission = determineUserPermission(role);
        setValue('permission', permission);

        if (permission === 'author') setValue('requestedPermission', 'OWNER');
        if (permission === 'editor') setValue('requestedPermission', 'EDIT');
        if (permission === 'readOnly' || permission === 'discoverable')
            setValue('requestedPermission', 'READ_ONLY');
    }

    const fetchAppData = async (id: string) => {
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

    const fetchSimilarApps = () => {
        // TODO
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

    const handleCloseChangeAccessModal = (refresh?: boolean) => {
        if (refresh) {
            // fetch updated permission.
            getPermission();
        } else {
            // reset permission to original.
            if (permission === 'author')
                setValue('requestedPermission', 'OWNER');
            if (permission === 'editor')
                setValue('requestedPermission', 'EDIT');
            if (permission === 'readOnly')
                setValue('requestedPermission', 'READ_ONLY');
        }
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

    // export loading state
    const [exportLoading, setExportLoading] = useState(false);
    /**
     * @name exportAPP
     * @desc export APP pixel
     */
    const exportApp = () => {
        setExportLoading(true);
        const pixel = `ExportProjectApp(project=["${appId}"]);`;

        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0].output,
                insightId = response.insightId;

            monolithStore.download(insightId, output);
        });
        setExportLoading(false);
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

                fetchAppData(appId);
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
                    <StyledLink to="../../..">
                        <StyledCrumb variant="body1">App Library</StyledCrumb>
                    </StyledLink>
                    <StyledCrumb variant="body1" disabled>
                        {appInfo?.project_name}
                    </StyledCrumb>
                </Breadcrumbs>

                <div>
                    <Sidebar permission={permission} refs={detailRefs} />
                    <PageBody>
                        <ActionBar>
                            {permission === 'author' ? (
                                <Button
                                    disabled={exportLoading}
                                    startIcon={
                                        exportLoading ? (
                                            <CircularProgress size="1em" />
                                        ) : (
                                            <SimCardDownload />
                                        )
                                    }
                                    variant="outlined"
                                    onClick={() => exportApp()}
                                >
                                    Export
                                </Button>
                            ) : (
                                <Button
                                    startIcon={<Add />}
                                    variant="outlined"
                                    onClick={() =>
                                        setIsChangeAccessModalOpen(true)
                                    }
                                    sx={{ fontWeight: 'bold' }}
                                >
                                    {permission === 'discoverable' ? (
                                        <>Request Access</>
                                    ) : (
                                        <>Change Access</>
                                    )}
                                </Button>
                            )}

                            <Button
                                variant="contained"
                                onClick={() => navigate(`/app/${appId}`)}
                            >
                                Open
                            </Button>

                            <IconButton
                                onClick={(event) =>
                                    setMoreVertAnchorEl(event.currentTarget)
                                }
                            >
                                <MoreVert />
                            </IconButton>

                            <Menu
                                anchorEl={moreVertAnchorEl}
                                open={Boolean(moreVertAnchorEl)}
                                onClose={() => setMoreVertAnchorEl(null)}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                sx={{ borderRadius: '4px' }}
                            >
                                {permission === 'author' && (
                                    <StyledMenuItem
                                        onClick={() => {
                                            setIsEditDetailsModalOpen(true);
                                            setMoreVertAnchorEl(null);
                                        }}
                                        value={null}
                                    >
                                        <Edit fontSize="small" />
                                        <Typography variant="caption">
                                            Edit App Details
                                        </Typography>
                                    </StyledMenuItem>
                                )}

                                <StyledMenuItem
                                    value={null}
                                    onClick={() => setIsShareOverlayOpen(true)}
                                >
                                    <Share fontSize="small" />
                                    <Typography variant="caption">
                                        Share
                                    </Typography>
                                </StyledMenuItem>
                            </Menu>
                        </ActionBar>

                        <TitleSection>
                            <TitleSectionImg
                                src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
                                alt="App Image"
                            />
                            <TitleSectionBodyWrapper>
                                <Typography variant="h6">
                                    {appInfo?.project_name}
                                </Typography>
                                <TitleSectionBody variant="body1">
                                    {permission === 'author' ? (
                                        <HdrAuto />
                                    ) : permission === 'editor' ? (
                                        <EditLocation />
                                    ) : permission === 'discoverable' ? (
                                        <RemoveRedEyeRounded />
                                    ) : null}
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

                        {permission && permission !== 'discoverable' && (
                            <StyledSection ref={dependenciesRef}>
                                <DependenciesHeadingWrapper>
                                    <SectionHeading variant="h2">
                                        Dependencies
                                    </SectionHeading>
                                    {permission === 'author' && (
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
                                            <Edit />
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
                                        type={'APP'}
                                        direction="row"
                                        name={appInfo?.project_name || 'app'}
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
                                                type={'APP'}
                                                id={appId}
                                            />
                                            <MembersTable
                                                type={'APP'}
                                                id={appId}
                                                onChange={() => {
                                                    fetchUserSpecificData();
                                                }}
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
                    </PageBody>
                </div>
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
                getValues={getValues}
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
    width: '145px',
    borderRight: `1px solid ${theme.palette.secondary.main}`,
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    position: 'fixed',
    paddingRight: theme.spacing(1),
}));

const StyledSidebarItem = styled(Button)(({ theme }) => ({
    justifyContent: 'flex-start',
    whiteSpace: 'nowrap',
}));

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
            <StyledSidebarItem
                variant="text"
                color="secondary"
                onClick={() => scrollIntoView(mainUsesRef.ref)}
                value={null}
            >
                Main Uses
            </StyledSidebarItem>
            <StyledSidebarItem
                variant="text"
                color="secondary"
                onClick={() => scrollIntoView(tagsRef.ref)}
                value={null}
            >
                Tags
            </StyledSidebarItem>
            {dynamicRefs?.map((ref) => (
                <StyledSidebarItem
                    variant="text"
                    color="secondary"
                    onClick={() => scrollIntoView(ref.ref)}
                    value={null}
                    key={ref.display}
                >
                    {ref.display}
                </StyledSidebarItem>
            ))}
            {permission !== 'discoverable' && (
                <StyledSidebarItem
                    variant="text"
                    color="secondary"
                    onClick={() => scrollIntoView(dependenciesRef.ref)}
                    value={null}
                >
                    Dependencies
                </StyledSidebarItem>
            )}
            {permission === 'author' && (
                <StyledSidebarItem
                    variant="text"
                    color="secondary"
                    onClick={() => scrollIntoView(appAccessRef.ref)}
                    value={null}
                >
                    App Access
                </StyledSidebarItem>
            )}
            {canEdit && (
                <StyledSidebarItem
                    variant="text"
                    color="secondary"
                    onClick={() => scrollIntoView(memberAccessRef.ref)}
                    value={null}
                >
                    Member Access
                </StyledSidebarItem>
            )}
            {!canEdit && (
                <StyledSidebarItem
                    variant="text"
                    color="secondary"
                    onClick={() => scrollIntoView(similarAppsRef.ref)}
                    value={null}
                >
                    Similar Apps
                </StyledSidebarItem>
            )}
        </StyledSidebar>
    );
};
