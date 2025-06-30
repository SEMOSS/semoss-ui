import {
    styled,
    Modal,
    Button,
    Typography,
    TextField,
    Stack,
    RadioGroup,
    useNotification,
    Tab,
    Tabs,
    Box,
    Chip,
    Link,
} from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import { HdrAuto, Visibility } from '@mui/icons-material';
import { AppDetailsFormTypes } from './app-details.utility';

import { PERMISSION_DESCRIPTION_MAP } from '@/constants';
import { useRootStore } from '@/hooks';
import { useMemo, useState } from 'react';
import { modelledDependency } from '@/components/app';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import { Edit } from '@mui/icons-material';
import OPEN_AI from '@/assets/img/OPEN_AI.png';

const StyledContentBox = styled(Stack)(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
    borderRadius: '4px',
}));

const StyledContentCard = styled(Stack)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: '4px',
}));

const StyledRoleInfo = styled('div')({
    width: '100%',
});

const StyledHdrAutoIcon = styled(HdrAuto)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const StyledEditIcon = styled(Edit)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const StyledVisibilityIcon = styled(Visibility)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const ModalSectionHeading = styled(Typography)({
    fontWeight: 500,
    margin: '1rem 0 0.5rem 0',
});

const TabPanel = (props: {
    children?: React.ReactNode;
    value: number;
    index: number;
}) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tab-panel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
        </div>
    );
};
interface ChangeAccessModalProps {
    open: boolean;
    onClose: (refresh?: boolean) => void;
    control: Control<AppDetailsFormTypes>;
    getValues: any;
    dependencies: modelledDependency[];
    onSuccess: () => void;
    permission: string;
}

export const ChangeAccessModal = (props: ChangeAccessModalProps) => {
    const {
        open,
        onClose,
        control,
        getValues,
        dependencies,
        onSuccess,
        permission,
    } = props;
    const permissionDescriptions = PERMISSION_DESCRIPTION_MAP['APP'];
    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const [tabValue, setTabValue] = useState(0);
    const [requestedDeps, setRequestedDeps] = useState<Set<string>>(new Set());

    const toCapitalized = (word: string): string => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    };

    const handleTabChange = (
        _event: React.SyntheticEvent,
        newValue: number,
    ) => {
        setTabValue(newValue);
    };

    const requestAccessForDependency = async (
        depId: string,
        requestedRole: string,
        comment?: string,
    ) => {
        try {
            const res = await monolithStore.runQuery(
                `META | RequestEngine(engine=['${depId}'], permission=['${requestedRole}']${
                    comment ? `, comment=['${comment}']` : ''
                })`,
            );
            const { operationType, output } = res.pixelReturn[0];
            if (operationType.indexOf('ERROR') > -1) {
                return { depId, success: false, message: output };
            } else {
                return { depId, success: true, message: output };
            }
        } catch (error) {
            return { depId, success: false, message: 'Request failed.' };
        }
    };

    const handleChangeAccess = async () => {
        const current = getValues('permission');
        const requested = getValues('requestedPermission');
        const comment = getValues('roleChangeComment');
        const id = getValues('appId');

        if (requested === current || requested === '') {
            notification.add({
                color: 'error',
                message:
                    'No change in Access has been requested. Please select another and try again.',
            });
            return;
            //  } else if (!comment) {
            // notification.add({
            //     color: 'error',
            //     message: 'A comment is required to request access.',
            // });
            // return;
        }

        try {
            const res = await monolithStore.runQuery(
                `RequestProject(project=['${id}'], permission=['${requested}'], comment=['${comment}'])`,
            );

            const { operationType, output } = res.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: output,
                });
                return;
            }

            notification.add({
                color: 'success',
                message: output,
            });

            onSuccess();
            onClose(true); // Close modal after successful RequestProject call
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Request failed.',
            });
        }
    };

    const [isRequestAllLoading, setIsRequestAllLoading] = useState(false);

    const isAllRequested = useMemo(() => {
        return dependencies.every((dep) => requestedDeps.has(dep.id));
    }, [dependencies, requestedDeps]);

    const handleRequestAllAccess = async () => {
        setIsRequestAllLoading(true);
        try {
            const requestedRole = getValues('requestedPermission');
            const comment = getValues('roleChangeComment');

            if (!requestedRole || requestedRole === '') {
                notification.add({
                    color: 'error',
                    message:
                        'Please select a permission role on the first tab before requesting access.',
                });
                setTabValue(0);
                return;
            }

            const dependenciesToRequest = dependencies.filter(
                (dep) => !dep.userPermission && !requestedDeps.has(dep.id),
            );

            if (dependenciesToRequest.length === 0) {
                notification.add({
                    color: 'info',
                    message: 'No new dependencies require access request.',
                });
                return;
            }

            const promises = dependenciesToRequest.map((dep) =>
                requestAccessForDependency(dep.id, requestedRole, comment),
            );

            const results = await Promise.allSettled(promises);

            let successCount = 0;
            let errorCount = 0;
            results.forEach((result) => {
                if (result.status === 'fulfilled') {
                    const { depId, success, message } = result.value;
                    if (success) {
                        setRequestedDeps((prev) => new Set(prev).add(depId));
                        successCount++;
                        notification.add({
                            color: 'success',
                            message: `Dependency ${depId}: ${message}`,
                        });
                    } else {
                        errorCount++;
                        notification.add({
                            color: 'error',
                            message: `Dependency ${depId}: ${message}`,
                        });
                    }
                } else {
                    errorCount++;
                    notification.add({
                        color: 'error',
                        message: 'Request failed for a dependency.',
                    });
                }
            });

            // if (successCount > 0) {
            //     onSuccess();
            // }
        } finally {
            setIsRequestAllLoading(false);
        }
    };

    // Handle single dependency request button click
    const handleSingleDependencyRequest = async (depId: string) => {
        const requestedRole = getValues('requestedPermission');
        const comment = getValues('roleChangeComment');

        if (!requestedRole || requestedRole === '') {
            notification.add({
                color: 'error',
                message:
                    'Please select a permission role on the first tab before requesting access.',
            });
            setTabValue(0);
            return;
        }

        const { success, message } = await requestAccessForDependency(
            depId,
            requestedRole,
            comment,
        );

        if (success) {
            setRequestedDeps((prev) => new Set(prev).add(depId));
            notification.add({
                color: 'success',
                message: `Dependency ${depId}: ${message}`,
            });
            // onSuccess();
        } else {
            notification.add({
                color: 'error',
                message: `Dependency ${depId}: ${message}`,
            });
        }
    };

    return (
        <>
            <Modal open={open} maxWidth={'md'} onClose={onClose}>
                <Modal.Title>
                    {getValues('requestedPermission') === 'discoverable' ? (
                        <>Request Access</>
                    ) : (
                        <>Change Access</>
                    )}
                </Modal.Title>
                {permission !== 'discoverable' ? (
                    <Box
                        sx={{
                            borderBottom: 1,
                            borderColor: 'divider',
                            ml: '40px',
                            mr: '40px',
                        }}
                    >
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            aria-label="Access Tabs"
                        >
                            <Tab
                                label="App Permissions"
                                aria-controls="tab-panel-0"
                            />
                            <Tab
                                label="Dependency Permissions"
                                aria-controls="tab-panel-1"
                            />
                        </Tabs>
                    </Box>
                ) : (
                    <> </>
                )}
                <TabPanel value={tabValue} index={0}>
                    <Modal.Content>
                        <Controller
                            name="requestedPermission"
                            control={control}
                            render={({ field }) => {
                                return (
                                    <StyledContentBox
                                        direction="column"
                                        gap={1}
                                    >
                                        <StyledContentCard
                                            direction="row"
                                            gap={1}
                                        >
                                            <StyledHdrAutoIcon />
                                            <StyledRoleInfo>
                                                <Typography variant="subtitle1">
                                                    Author
                                                </Typography>
                                                <span>
                                                    {
                                                        permissionDescriptions.author
                                                    }
                                                </span>
                                            </StyledRoleInfo>
                                            <RadioGroup
                                                label=""
                                                value={field.value}
                                                onChange={(val) =>
                                                    field.onChange(val)
                                                }
                                            >
                                                <RadioGroup.Item
                                                    value="OWNER"
                                                    label=""
                                                />
                                            </RadioGroup>
                                        </StyledContentCard>

                                        <StyledContentCard
                                            direction="row"
                                            gap={1}
                                        >
                                            <StyledEditIcon />
                                            <StyledRoleInfo>
                                                <Typography variant="subtitle1">
                                                    Editor
                                                </Typography>
                                                <span>
                                                    {
                                                        permissionDescriptions.editor
                                                    }
                                                </span>
                                            </StyledRoleInfo>
                                            <RadioGroup
                                                label=""
                                                value={field.value}
                                                onChange={(val) =>
                                                    field.onChange(val)
                                                }
                                            >
                                                <RadioGroup.Item
                                                    value="EDIT"
                                                    label=""
                                                />
                                            </RadioGroup>
                                        </StyledContentCard>

                                        <StyledContentCard
                                            direction="row"
                                            gap={1}
                                        >
                                            <StyledVisibilityIcon />
                                            <StyledRoleInfo>
                                                <Typography variant="subtitle1">
                                                    Read-Only
                                                </Typography>
                                                <span>
                                                    {
                                                        permissionDescriptions.readonly
                                                    }
                                                </span>
                                            </StyledRoleInfo>
                                            <RadioGroup
                                                label=""
                                                value={field.value}
                                                onChange={(val) =>
                                                    field.onChange(val)
                                                }
                                            >
                                                <RadioGroup.Item
                                                    value="READ_ONLY"
                                                    label=""
                                                />
                                            </RadioGroup>
                                        </StyledContentCard>
                                    </StyledContentBox>
                                );
                            }}
                        />
                        <ModalSectionHeading variant="subtitle1">
                            Reason For Access
                        </ModalSectionHeading>
                        <StyledContentBox>
                            <Controller
                                name="roleChangeComment"
                                control={control}
                                render={({ field }) => {
                                    return (
                                        <StyledContentCard>
                                            <TextField
                                                multiline
                                                fullWidth
                                                placeholder="Optional"
                                                rows={2}
                                                value={field.value}
                                                onChange={field.onChange}
                                            />
                                        </StyledContentCard>
                                    );
                                }}
                            />
                        </StyledContentBox>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            color="primary"
                            variant="text"
                            onClick={() => onClose(false)}
                        >
                            Cancel
                        </Button>
                        {permission !== 'discoverable' ? (
                            <Button
                                color="primary"
                                variant="contained"
                                onClick={() => setTabValue(1)}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                color="primary"
                                variant="contained"
                                onClick={handleChangeAccess}
                            >
                                Submit
                            </Button>
                        )}
                    </Modal.Actions>
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <Modal.Content>
                        <Typography
                            variant={'body2'}
                            sx={{ fontSize: '14px', pb: 2 }}
                        >
                            The app will not work for you without having at
                            least read-only access to the following
                            dependencies. Click request access to be provisioned
                            as a read-only user.
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                pb: 2,
                            }}
                        >
                            <Button
                                variant="outlined"
                                sx={{ borderRadius: 10, px: 2, py: 0.5 }}
                                size="small"
                                onClick={handleRequestAllAccess}
                                disabled={isAllRequested || isRequestAllLoading}
                            >
                                {isRequestAllLoading
                                    ? 'Requesting...'
                                    : 'Request All Access'}
                            </Button>
                        </Box>
                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                            <Stack spacing={2} sx={{ width: '100%' }}>
                                {dependencies.map((dep, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            p: 2,
                                            border: '1px solid #ddd',
                                            borderRadius: 2,
                                            bgcolor: 'background.paper',
                                            width: '100%',
                                        }}
                                    >
                                        {/* Left side: Icon, Name, Tags, Description */}
                                        <Box sx={{ flex: 1 }}>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1,
                                                    mb: 1,
                                                }}
                                            >
                                                <img
                                                    src={OPEN_AI}
                                                    alt={dep.name}
                                                    width="48px"
                                                    height="48px"
                                                />
                                                <Box>
                                                    <Typography
                                                        variant="subtitle1"
                                                        sx={{
                                                            color: 'primary.main',
                                                            fontWeight: 400,
                                                            fontSize: '16px',
                                                        }}
                                                    >
                                                        <Link
                                                            href={`./#/engine/${dep.type}/${dep.id}`}
                                                        >
                                                            <Typography variant="body2">
                                                                {dep.name}
                                                            </Typography>
                                                        </Link>
                                                    </Typography>
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        {dep.userPermission ===
                                                        'OWNER' ? (
                                                            <PersonIcon
                                                                fontSize="small"
                                                                sx={{
                                                                    color: '#C4C4C4',
                                                                    width: '16px',
                                                                    height: '16px',
                                                                }}
                                                            />
                                                        ) : dep.userPermission ===
                                                          'READ_ONLY' ? (
                                                            <VisibilityIcon
                                                                fontSize="small"
                                                                sx={{
                                                                    color: '#C4C4C4',
                                                                    width: '16px',
                                                                    height: '16px',
                                                                }}
                                                            />
                                                        ) : dep.userPermission ===
                                                          'EDIT' ? (
                                                            <Edit
                                                                fontSize="small"
                                                                sx={{
                                                                    color: '#C4C4C4',
                                                                    width: '16px',
                                                                    height: '16px',
                                                                }}
                                                            />
                                                        ) : (
                                                            <BlockIcon
                                                                fontSize="small"
                                                                sx={{
                                                                    color: '#C4C4C4',
                                                                    width: '16px',
                                                                    height: '16px',
                                                                }}
                                                            />
                                                        )}

                                                        <Typography
                                                            variant="subtitle1"
                                                            sx={{
                                                                fontSize:
                                                                    '12px',
                                                                ml: '1px',
                                                                color: 'text.secondary',
                                                            }}
                                                        >
                                                            {toCapitalized(
                                                                dep.userPermission ||
                                                                    'NONE',
                                                            )}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Stack
                                                    direction="row"
                                                    spacing={1}
                                                    sx={{
                                                        justifyContent:
                                                            'space-between',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        {dep.isPublic ? (
                                                            <Chip
                                                                label="Public"
                                                                sx={{
                                                                    height: '32px',
                                                                }}
                                                            />
                                                        ) : dep.isDiscoverable ? (
                                                            <Chip
                                                                label="Discoverable"
                                                                sx={{
                                                                    height: '32px',
                                                                }}
                                                            />
                                                        ) : (
                                                            <>
                                                                <Chip
                                                                    label="Non-Discoverable"
                                                                    sx={{
                                                                        height: '32px',
                                                                    }}
                                                                />
                                                                <Chip
                                                                    label="Private"
                                                                    sx={{
                                                                        height: '32px',
                                                                    }}
                                                                />
                                                            </>
                                                        )}
                                                        <Chip
                                                            label={toCapitalized(
                                                                dep.type,
                                                            )}
                                                            sx={{
                                                                height: '32px',
                                                            }}
                                                        />
                                                    </Stack>

                                                    <Box sx={{ ml: 2 }}>
                                                        {!dep.userPermission ? (
                                                            !requestedDeps.has(
                                                                dep.id,
                                                            ) ? (
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    sx={{
                                                                        borderRadius: 10,
                                                                        px: 2,
                                                                        py: 0.5,
                                                                        fontSize:
                                                                            '13px',
                                                                    }}
                                                                    onClick={() =>
                                                                        handleSingleDependencyRequest(
                                                                            dep.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Request
                                                                    Access
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    sx={{
                                                                        borderRadius: 10,
                                                                        px: 2,
                                                                        py: 0.5,
                                                                    }}
                                                                    disabled
                                                                >
                                                                    Pending
                                                                    Access
                                                                </Button>
                                                            )
                                                        ) : // If dep.userPermission is not null or "none", show "Change Access"
                                                        !requestedDeps.has(
                                                              dep.id,
                                                          ) ? (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{
                                                                    borderRadius: 10,
                                                                    px: 2,
                                                                    py: 0.5,
                                                                    fontSize:
                                                                        '13px',
                                                                }}
                                                                onClick={() =>
                                                                    handleSingleDependencyRequest(
                                                                        dep.id,
                                                                    )
                                                                }
                                                            >
                                                                Change Access
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                color="secondary"
                                                                sx={{
                                                                    borderRadius: 10,
                                                                    px: 2,
                                                                    py: 0.5,
                                                                }}
                                                                disabled
                                                            >
                                                                Pending Access
                                                            </Button>
                                                        )}
                                                    </Box>
                                                </Stack>
                                            </Box>

                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    color: 'text.secondary',
                                                }}
                                            >
                                                {dep.description &&
                                                dep.description.trim() !== ''
                                                    ? dep.description
                                                    : 'No Description Available'}
                                            </Typography>
                                        </Box>

                                        {/* Right side: Button */}
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    </Modal.Content>
                    <Modal.Actions>
                        <Button
                            color="primary"
                            variant="text"
                            onClick={() => {
                                onClose(false);
                                setTabValue(0);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            color="primary"
                            variant="contained"
                            onClick={handleChangeAccess}
                        >
                            Submit
                        </Button>
                    </Modal.Actions>
                </TabPanel>
            </Modal>
        </>
    );
};
