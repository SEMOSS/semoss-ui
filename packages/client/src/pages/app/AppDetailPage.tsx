import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import {
    SimCardDownload,
    EditOutlined,
    Settings,
    LockReset,
} from '@mui/icons-material';
import UpdateIcon from '@mui/icons-material/Update';
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
    Box,
    ToggleTabsGroup,
    Grid,
} from '@semoss/ui';
import { Env } from '@semoss/sdk/react';

import { useRootStore } from '@/hooks';
import { formatPermission, toTitleCase } from '@/utility';
import { ShareOverlay } from '@/components/ui';
import { SettingsContext } from '@/contexts';
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
    AppSettings,
} from '@/components/app';
import { Overview } from './AppDetailTabs/Overview';
import { AccessControl } from './AppDetailTabs/AccessControl';
import { SettingsTab } from './AppDetailTabs/Settings';
import { Dependencies } from './AppDetailTabs/Dependencies';
import { Role } from '@/types';
import { NavbarLeft, NavbarHeader } from '../../components/shared';

const OuterContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    // display: 'flex',
    // flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    overflow: 'scroll',
    paddingTop: '40px',
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
    padding: theme.spacing(4),
}));

const ActionBar = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    marginLeft: 'auto',
}));

const PageBody = styled('div')(({ theme }) => ({
    //marginLeft: '200px',
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
    paddingBottom: theme.spacing(2),
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
}));

const TitleSectionImg = styled('img')(({ theme }) => ({
    borderRadius: theme.spacing(0.75),
    height: '64px',
    width: '64px',
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

const StyledContentContainer = styled(Box)(({ theme }) => ({
    width: '100% !important',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    color: theme.palette.secondary.light,
    '&.MuiBox-root': {
        width: '100%',
    },
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    minHeight: '42px',
    color: theme.palette.secondary.light,
    //borderRadius: theme.shape.borderRadius,
    alignItems: 'center',
    padding: '0px 3px',
    display: 'flex',
    justifyContent: 'flex-start', // or 'flex-start' if you want left alignment
    borderBottomRadius: '0px',
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '38px',
    padding: '8px 11px',
    '&.MuiTab-root': {
        borderRadius: theme.shape.borderRadius,
    },
    '&.Mui-selected': {
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
    },
}));
const StyledTabsSection = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    flexWrap: 'wrap',
    gap: theme.spacing(3),
    padding: '2px',
    backgroundColor: 'white',
    boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
}));

export const AppDetailPage = () => {
    const { control, setValue, getValues, watch, handleSubmit } =
        useForm<AppDetailsFormTypes>({ defaultValues: AppDetailsFormValues });

    const markdown = watch('markdown');
    const tags = watch('tag');
    const appInfo = watch('appInfo');
    console.log('appInfo', appInfo);
    const userRole = watch('userRole');
    const permission = watch('permission');
    const dependencies = watch('dependencies');
    const detailsForm = watch('detailsForm');
    console.log(dependencies, ' dependencies');
    const [moreVertAnchorEl, setMoreVertAnchorEl] = useState(null);
    const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
    const [isChangeAccessModalOpen, setIsChangeAccessModalOpen] =
        useState(false);
    const [isEditDetailsModalOpen, setIsEditDetailsModalOpen] = useState(false);
    const [isEditDependenciesModalOpen, setIsEditDependenciesModalOpen] =
        useState(false);
    const [responseStatus, setResponseStatus] = useState(false);
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
        await getPermission();
        const permission = getValues('permission');
        const promises: Promise<any>[] = [
            fetchAppInfo(
                monolithStore,
                id,
                configStore.store.config.projectMetaKeys.map((a) => a.metakey),
            ),
            fetchMainUses(monolithStore, id),
        ];
        if (permission !== 'discoverable') {
            promises.push(fetchDependencies(monolithStore, id));
        }
        const results = await Promise.allSettled(promises);
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
                                    found.display_options === 'select-box' ||
                                    found.display_options === 'multi-typeahead'
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
                        setValue('markdown', parsedMeta.markdown);
                        setValue('detailsForm.markdown', parsedMeta.markdown);
                        setValues((prev) => ({
                            ...prev,
                            markdown: parsedMeta.markdown || '',
                        }));
                        setValues((prev) => ({ ...prev, ...parsedMeta }));
                    }
                } else if (idx === 1) {
                    if (res.value.type === 'error') {
                        emitMessage(true, res.value.output);
                    } else {
                        if (res.value.output !== null) {
                            setValue('markdown', res.value.output);
                            setValue('detailsForm.markdown', res.value.output);
                            setValues((prev) => ({
                                ...prev,
                                markdown: res.value.output || '',
                            }));
                        }
                    }
                } else if (idx === 2) {
                    if (res.value.type === 'error') {
                        emitMessage(true, res.value.output);
                    } else {
                        const modelled = modelDependencies(res.value.output);
                        setValue('dependencies', modelled);
                        setValue('selectedDependencies', modelled);
                    }
                }
            }
        });
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
            userPermission: dep.permission_name as Role, // TODO: no value currently available in the payload
            isPublic: !!dep.engine_global,
            isDiscoverable: !!dep.engine_discoverable,
            description: dep.description,
        }));
    };
    console.log('modelledDependencies', modelDependencies);

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
        let imageMeta = [] as File[];
        if (data?.detailsForm) {
            for (const key in data?.detailsForm) {
                if (
                    data?.detailsForm[key] !== undefined &&
                    key !== 'appImage'
                ) {
                    meta[key] = data?.detailsForm[key];
                }
                if (key === 'appImage') {
                    imageMeta = data?.detailsForm[key] as File[];
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
            .then(async (response) => {
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

                // upload the image
                if (imageMeta && appId) {
                    await monolithStore.uploadImage(imageMeta, appId);
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

    const handleAccessRequested = () => {
        setResponseStatus(true);
    };
    const [selectedTab, setSelectedTab] = useState('Overview');

    const TABS_BY_PERMISSION: Record<string, string[]> = {
        author: ['Overview', 'Access Control', 'Dependencies', 'Settings'],
        editor: ['Overview', 'Access Control'],
        readOnly: ['Overview'],
        discoverable: ['Overview'],
    };

    const visibleTabs = TABS_BY_PERMISSION[permission] || ['Overview'];

    return (
        <div>
            <NavbarLeft>
                <NavbarHeader />
            </NavbarLeft>
            <OuterContainer>
                <InnerContainer>
                    <Breadcrumbs separator="/">
                        <Breadcrumbs.Item
                            //@ts-expect-error: TODO FIX Type
                            as={Link}
                            to={`../../..`}
                            underline="none"
                            color="inherit"
                            variant="body1"
                        >
                            App Catalog
                        </Breadcrumbs.Item>
                        <Breadcrumbs.Item
                            //@ts-expect-error: TODO FIX Type
                            as={Link}
                            to={`.`}
                            underline="none"
                            color="text.disabled"
                            variant="body1"
                        >
                            {appInfo?.project_name}
                        </Breadcrumbs.Item>
                    </Breadcrumbs>

                    <div>
                        <PageBody>
                            <TitleSection>
                                <>
                                    <TitleSectionImg
                                        src={`${Env.MODULE}/api/project-${appId}/projectImage/download`}
                                        alt="App Image"
                                    />
                                    <TitleSectionBodyWrapper>
                                        <Typography
                                            sx={{
                                                fontSize: '34px',
                                                fontWeight: '400',
                                            }}
                                            variant="h6"
                                        >
                                            {appInfo?.project_name}
                                        </Typography>
                                    </TitleSectionBodyWrapper>
                                </>

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
                                            data-testid={
                                                'app-detail-export-btn'
                                            }
                                        >
                                            Export
                                        </Button>
                                    ) : (
                                        <Button
                                            startIcon={
                                                responseStatus ? (
                                                    <UpdateIcon
                                                        sx={{
                                                            color: 'grey.500',
                                                        }}
                                                    />
                                                ) : permission ===
                                                  'discoverable' ? (
                                                    <LockReset
                                                        sx={{ color: 'white' }}
                                                    />
                                                ) : null
                                            }
                                            disabled={responseStatus}
                                            variant={
                                                responseStatus
                                                    ? 'outlined'
                                                    : permission ===
                                                      'discoverable'
                                                    ? 'contained'
                                                    : 'outlined'
                                            }
                                            onClick={() =>
                                                setIsChangeAccessModalOpen(true)
                                            }
                                            sx={{ fontWeight: 'bold' }}
                                            data-testid={
                                                'app-detail-access-btn'
                                            }
                                        >
                                            {responseStatus
                                                ? 'Pending Access'
                                                : permission === 'discoverable'
                                                ? 'Request Access'
                                                : 'Change Access'}
                                        </Button>
                                    )}
                                    {permission !== 'discoverable' &&
                                        permission !== 'readOnly' && (
                                            <Button
                                                variant="contained"
                                                startIcon={
                                                    <EditOutlined fontSize="inherit" />
                                                }
                                                onClick={() => {
                                                    setIsEditDetailsModalOpen(
                                                        true,
                                                    );
                                                    setMoreVertAnchorEl(null);
                                                }}
                                                data-testid="app-detail-open-btn"
                                            >
                                                Edit
                                            </Button>
                                        )}
                                </ActionBar>
                            </TitleSection>
                            <Grid
                                container
                                spacing={2}
                                sx={{
                                    paddingBottom: 2,
                                    alignItems: 'flex-start', // align both columns to top
                                }}
                            >
                                <Grid item xs={12} md={8}>
                                    <Typography
                                        sx={{ paddingBottom: '16px' }}
                                        variant="body1"
                                    >
                                        {appInfo?.description ||
                                            'No description available'}
                                    </Typography>
                                </Grid>

                                <Grid
                                    item
                                    xs={12}
                                    md={4}
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'flex-end', // push content to the right
                                    }}
                                >
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            fontSize: '14px',
                                            color: 'gray',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end', // right-align the text itself
                                            gap: '4px',
                                        }}
                                    >
                                        <span>
                                            Published by:{' '}
                                            {appInfo?.project_created_by ||
                                                'Unknown'}
                                        </span>
                                        Updated{' '}
                                        {appInfo?.project_date_created
                                            ? new Date(
                                                  appInfo?.project_date_created,
                                              ).toLocaleString('en-US', {
                                                  month: 'long',
                                                  day: '2-digit',
                                                  year: 'numeric',
                                                  hour: 'numeric',
                                                  minute: '2-digit',
                                                  hour12: true,
                                              })
                                            : 'N/A'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Typography
                                sx={{ paddingBottom: '16px' }}
                                variant="body1"
                            >
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
                            </Typography>

                            <StyledContentContainer>
                                <StyledToggleTabsGroup
                                    value={selectedTab}
                                    boxSx={{
                                        width: '100%',
                                        borderBottomLeftRadius: '0px',
                                        borderBottomRightRadius: '0px',
                                    }}
                                    onChange={(e, val) =>
                                        setSelectedTab(String(val))
                                    }
                                >
                                    {visibleTabs.includes('Overview') && (
                                        <StyledToggleTabsGroupItem
                                            label="Overview"
                                            value="Overview"
                                        />
                                    )}
                                    {visibleTabs.includes('Access Control') && (
                                        <StyledToggleTabsGroupItem
                                            label="Access Control"
                                            value="Access Control"
                                        />
                                    )}
                                    {visibleTabs.includes('Dependencies') && (
                                        <StyledToggleTabsGroupItem
                                            label="Dependencies"
                                            value="Dependencies"
                                        />
                                    )}
                                    {visibleTabs.includes('Settings') && (
                                        <StyledToggleTabsGroupItem
                                            label="Settings"
                                            value="Settings"
                                        />
                                    )}
                                </StyledToggleTabsGroup>
                            </StyledContentContainer>
                            <StyledTabsSection>
                                {selectedTab === 'Overview' && (
                                    <Overview appInfo={appInfo} />
                                )}
                                {selectedTab === 'Access Control' && (
                                    <AccessControl
                                        appInfo={appInfo}
                                        appId={appId}
                                        fetchUserSpecificData={
                                            fetchUserSpecificData
                                        }
                                        permission={permission}
                                    />
                                )}
                                {selectedTab === 'Dependencies' && (
                                    <Dependencies dependencies={dependencies} />
                                )}
                                {selectedTab === 'Settings' && (
                                    <SettingsContext.Provider
                                        value={{
                                            adminMode: false,
                                        }}
                                    >
                                        <SettingsTab id={appId} />
                                    </SettingsContext.Provider>
                                )}
                            </StyledTabsSection>
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
                    dependencies={dependencies}
                    onSuccess={handleAccessRequested}
                    permission={permission}
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
        </div>
    );
};
