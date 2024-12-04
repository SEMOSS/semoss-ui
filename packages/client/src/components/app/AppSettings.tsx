import { useEffect, useState } from 'react';
import {
    styled,
    useNotification,
    Avatar,
    Button,
    Paper,
    Switch,
    Table,
    Typography,
    Divider,
    TextField,
    Stack,
    FileDropzone,
} from '@semoss/ui';

import {
    Person,
    ToggleOff,
    Cached,
    PublishedWithChanges,
    InsertLink,
    Publish,
} from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { usePixel, useRootStore, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

import { Java } from '@/assets/img/Java';

const StyledAppSettings = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '1rem',
    marginBottom: theme.spacing(10),
}));

const StyledCardContainer = styled('div')(({ theme }) => ({
    width: '100%',
    gap: theme.spacing(2),
    display: 'flex',
    background: '#FFF',
    alignSelf: 'stretch',
    borderRadius: theme.shape.borderRadius,
    alignItems: 'flex-start',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
}));

const StyledTopCardContainer = styled('div')(({ theme }) => ({
    width: '100%',
    gap: theme.spacing(2),
    display: 'flex',
    background: '#FFF',
    alignSelf: 'stretch',
    borderRadius: theme.shape.borderRadius,
    alignItems: 'flex-start',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    marginBottom: theme.spacing(1),
}));

const StyledRightSwitch = styled(Switch)(({ theme }) => ({
    marginLeft: 'auto',
    paddingRight: theme.spacing(1),
}));

const StyledRightButton = styled(Button)(({ theme }) => ({
    marginLeft: 'auto',
    paddingRight: theme.spacing(1),
}));

const StyledCardDiv = styled('div')(({ theme }) => ({
    gap: theme.spacing(2),
    flex: '1 0 0',
    display: 'flex',
    padding: theme.spacing(2),
    alignItems: 'flex-start',
}));

const StyledCardLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    height: theme.spacing(33),
    width: '50%',
    gap: '1rem',
    flexDirection: 'column',
    alignItems: 'flex-start',
}));

const StyledCondensedPublishContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    gap: '1rem',
    flexDirection: 'column',
    alignItems: 'flex-start',
}));

const StyledListItemHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    width: theme.spacing(79),
    flexDirection: 'column',
    alignItems: 'flex-start',
}));

const StyledSubColumn = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSubRow = styled('div')({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    alignContent: 'center',
    width: '100%',
    margin: '4px 0 8px 0',
    '.MuiTypography-body2': {
        marginLeft: '32px',
    },
    '.MuiFormControl-root': {
        marginLeft: '32px',
    },
});

const StyledSubHeaderContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
}));

const StyledLeftActionContainer = styled('div')({
    display: 'flex',
    gap: '4px',
    flex: '1 0 0',
    alignItems: 'flex-end',
    justifyContent: 'center',
});

const StyledLeftActionDiv = styled('div')({
    gap: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const StyledTypography = styled(Typography)({
    fontWeight: '500',
});

const StyledActionDivLeft = styled('div')(({ theme }) => ({
    display: 'flex',
    paddingRight: theme.spacing(3),
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
}));

const StyledPersonIcon = styled(Person)(() => ({
    display: 'flex',
    alignItems: 'flex-start',
}));

const StyledPublishedIcon = styled(PublishedWithChanges)(() => ({
    marginRight: '5px',
}));

const StyledSwitchIcon = styled(ToggleOff)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginRight: theme.spacing(1),
}));
const StyledPublishIcon = styled(Publish)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginRight: theme.spacing(1),
    color: 'rgba(0, 0, 0, .5)',
}));

const StyledRefreshIcon = styled(Cached)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    marginRight: theme.spacing(1),
    color: 'rgba(0, 0, 0, .5)',
}));

const StyledCardRight = styled('div')(() => ({
    width: '50%',
}));

const StyledTable = styled(Table)(({ theme }) => ({
    borderRadius: theme.spacing(1),
    borderColor: '#BDBDBD',
    borderStyle: 'solid',
    borderCollapse: 'initial',
    borderWidth: 'thin',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
}));

// User Table
interface User {
    id: string;
    name: string;
    date: string;
    time: string;
}

interface AppSettingsProps {
    id: string;

    condensed?: boolean;
}

type EditAppForm = {
    PROJECT_UPLOAD: File;
};

export const AppSettings = (props: AppSettingsProps) => {
    const { id, condensed = false } = props;
    const { monolithStore, configStore } = useRootStore();
    const notification = useNotification();
    const { adminMode } = useSettings();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { handleSubmit, control, reset, watch } = useForm<EditAppForm>({
        defaultValues: {
            PROJECT_UPLOAD: null,
        },
    });

    const uploadFile = watch('PROJECT_UPLOAD');

    const admin = configStore.store.user.admin;

    const [portalReactors, setPortalReactors] = useState<{
        reactors: string[];
        lastCompiled?: string;
        compiledBy?: string;
    }>({
        lastCompiled: '',
        reactors: [],
        compiledBy: '',
    });

    const [portalDetails, setPortalDetails] = useState<{
        url?: string;
        hasPortal?: boolean;
        // isPublished: boolean;
        project_has_portal: boolean;
        project_portal_url?: string;
        lastCompiled?: string;
        compiledBy?: string;
    }>({
        url: '',
        hasPortal: false,
        // isPublished: false,
        project_has_portal: false,
        project_portal_url: '',
        lastCompiled: '12/25/2022',
        compiledBy: 'J.Smith',
    });

    const getPortalDetails = usePixel<{
        url?: string;
        hasPortal?: boolean;
        // isPublished: boolean;
        project_has_portal: boolean;
        project_portal_url?: string;
        lastCompiled?: string;
        compiledBy?: string;
    }>(
        adminMode
            ? `
        AdminGetProjectPortalDetails('${id}');
    `
            : `
        GetProjectPortalDetails('${id}');
    `,
    );

    useEffect(() => {
        if (getPortalDetails.status !== 'SUCCESS') {
            return;
        }

        // Set Details for Portal
        setPortalDetails({
            ...getPortalDetails.data,
        });

        // Get the portal reactors if we have a portal
        if (getPortalDetails.data.project_has_portal) {
            getPortalReactors();
        }
    }, [getPortalDetails.status, getPortalDetails.data]);

    /** LOADING */
    if (getPortalDetails.status !== 'SUCCESS') {
        return (
            <LoadingScreen.Trigger description="Getting app portal details" />
        );
    }

    /**
     * @name getPortalReactors
     */
    const getPortalReactors = () => {
        const pixelString = adminMode
            ? `AdminGetProjectAvailableReactors(project=['${id}']);`
            : `GetProjectAvailableReactors(project=['${id}']);`;

        monolithStore
            .runQuery(pixelString)
            .then((response) => {
                let output = undefined;
                let type = undefined;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });

                    return;
                }

                setPortalReactors({
                    ...portalReactors,
                    reactors: output,
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error,
                });
            });
    };

    /**
     * @name recompileReactors
     */
    const recompileReactors = ({ release }) => {
        let pixelString;
        if (release == null) {
            pixelString = `ReloadInsightClasses('${id}');`;
        } else {
            pixelString = `ReloadInsightClasses('${id}', release = true );`;
        }

        monolithStore
            .runQuery(pixelString)
            .then((response) => {
                let output = undefined;
                let type = undefined;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });
                    return;
                }

                if (release == null) {
                    notification.add({
                        color: 'success',
                        message: 'Successfully recompiled',
                    });
                } else {
                    notification.add({
                        color: 'success',
                        message: 'Successfully redeployed',
                    });
                }
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error,
                });
            });
    };

    /**
     * @name publish
     * @desc Publishes Portal
     */
    const publish = () => {
        const pixelString = `PublishProject('${id}', release=true);`;

        monolithStore
            .runQuery(pixelString)
            .then((response) => {
                let output = undefined;
                let type = undefined;

                output = response.pixelReturn[0].output;
                type = response.pixelReturn[0].operationType[0];

                if (type.indexOf('ERROR') > -1) {
                    notification.add({
                        color: 'error',
                        message: output,
                    });

                    return;
                }

                setPortalDetails({
                    ...portalDetails,
                    project_portal_url: output,
                });

                notification.add({
                    color: 'success',
                    message: 'Successfully published',
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error,
                });
            });
    };

    /**
     * @name enablePublishing
     */
    const enablePublishing = () => {
        monolithStore
            .setProjectPortal(admin, id, !portalDetails.project_has_portal)
            .then((resp) => {
                if (resp.data) {
                    setPortalDetails({
                        ...portalDetails,
                        project_has_portal: !portalDetails.project_has_portal,
                    });

                    notification.add({
                        color: 'success',
                        message: `Successfully ${
                            !portalDetails.project_has_portal
                                ? 'enabled'
                                : 'disabled'
                        } portal`,
                    });
                } else {
                    notification.add({
                        color: 'error',
                        message: `Unsuccessfully ${
                            !portalDetails.project_has_portal
                                ? 'disabled'
                                : 'enabled'
                        } portal`,
                    });
                }
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error,
                });
            });
    };

    /**
     * @name editApp
     */
    const editApp = handleSubmit(async (data: EditAppForm) => {
        // turn on loading
        setIsLoading(true);

        try {
            const path = 'version/assets/';

            // unzip the file in the new app
            await monolithStore.runQuery(
                `DeleteAsset(filePath=["${path}"], space=["${id}"]);`,
            );

            // upload the file
            const upload = await monolithStore.uploadFile(
                [data.PROJECT_UPLOAD],
                configStore.store.insightID,
                id,
                path,
            );

            // upnzip the file in the new app
            await monolithStore.runQuery(
                `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${id}"]);`,
            );

            // Load the insight classes
            await monolithStore.runQuery(`ReloadInsightClasses('${id}');`);

            // set the app portal
            await monolithStore.setProjectPortal(false, id, true, 'public');

            // Publish the app the insight classes
            await monolithStore.runQuery(
                `PublishProject('${id}', release=true);`,
            );

            notification.add({
                color: 'success',
                message: 'Succesfully Updated Project',
            });

            reset();
        } catch (e) {
            console.error(e);

            notification.add({
                color: 'error',
                message: e.message,
            });
        } finally {
            // turn of loading
            setIsLoading(false);
        }
    });

    if (condensed) {
        return (
            <StyledPaper>
                <StyledCondensedPublishContainer>
                    <StyledSubColumn style={{ width: '100%' }}>
                        <StyledSubHeaderContainer>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <StyledPublishIcon />
                                <StyledTypography variant="body1">
                                    Enable Publishing
                                </StyledTypography>
                            </div>
                            <StyledRightSwitch
                                checked={portalDetails.project_has_portal}
                                value={portalDetails.project_has_portal}
                                onChange={() => {
                                    enablePublishing();
                                }}
                            ></StyledRightSwitch>
                        </StyledSubHeaderContainer>

                        <StyledSubRow>
                            <Typography variant="body2">
                                Enable the publishing of the portal.
                            </Typography>
                        </StyledSubRow>
                    </StyledSubColumn>

                    <>
                        <Divider />

                        <StyledSubColumn style={{ width: '100%' }}>
                            <StyledSubRow>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <StyledRefreshIcon />
                                    <StyledTypography variant="body1">
                                        Publish Portal
                                    </StyledTypography>
                                </div>

                                <StyledRightButton
                                    disabled={!portalDetails.project_has_portal}
                                    variant="outlined"
                                    onClick={() => {
                                        publish();
                                    }}
                                >
                                    Publish
                                </StyledRightButton>
                            </StyledSubRow>

                            <StyledSubRow>
                                <Typography variant="body2">
                                    Publish the portal to generate a shareable
                                    link.
                                </Typography>
                            </StyledSubRow>

                            <StyledSubRow>
                                <TextField
                                    focused={false}
                                    label={'Link'}
                                    variant={'outlined'}
                                    value={
                                        portalDetails.project_has_portal
                                            ? portalDetails.project_portal_url
                                            : ''
                                    }
                                    sx={{ width: '100%' }}
                                    InputProps={{
                                        startAdornment: <InsertLink />,
                                    }}
                                >
                                    {portalDetails.project_has_portal
                                        ? portalDetails.project_portal_url
                                        : ''}
                                </TextField>
                            </StyledSubRow>
                        </StyledSubColumn>
                    </>
                </StyledCondensedPublishContainer>
            </StyledPaper>
        );
    } else {
        return (
            <StyledAppSettings>
                <StyledTopCardContainer>
                    <StyledCardDiv>
                        <StyledCardLeft>
                            <StyledListItemHeader>
                                <Typography variant="h6">Portals</Typography>
                            </StyledListItemHeader>

                            <StyledLeftActionContainer>
                                {portalDetails.lastCompiled && (
                                    <StyledLeftActionDiv>
                                        <StyledActionDivLeft>
                                            <Typography variant="body2">
                                                Last compiled by:
                                            </Typography>
                                        </StyledActionDivLeft>
                                        <Avatar>
                                            <StyledPersonIcon />
                                        </Avatar>
                                        <Typography variant="body2">
                                            {portalDetails.compiledBy}
                                        </Typography>
                                        <Typography variant="body2">
                                            on
                                        </Typography>
                                        <Typography variant="body2">
                                            {portalDetails.lastCompiled}
                                        </Typography>
                                    </StyledLeftActionDiv>
                                )}
                            </StyledLeftActionContainer>
                        </StyledCardLeft>

                        <StyledCardRight>
                            <StyledSubColumn>
                                <StyledSubRow>
                                    <StyledSwitchIcon />
                                    <Typography variant="subtitle1">
                                        Enable Publishing
                                    </Typography>
                                </StyledSubRow>

                                <StyledSubRow>
                                    <Typography variant="body2">
                                        Enable the publishing of the portal.
                                    </Typography>

                                    <StyledRightSwitch
                                        checked={
                                            portalDetails.project_has_portal
                                        }
                                        value={portalDetails.project_has_portal}
                                        onChange={() => {
                                            enablePublishing();
                                        }}
                                    ></StyledRightSwitch>
                                </StyledSubRow>
                            </StyledSubColumn>

                            <>
                                <Divider />

                                <StyledSubColumn>
                                    <StyledSubRow>
                                        <StyledRefreshIcon />
                                        <Typography variant="subtitle1">
                                            Publish Portal
                                        </Typography>
                                    </StyledSubRow>

                                    <StyledSubRow>
                                        <Typography variant="body2">
                                            Publish the portal to generate a
                                            shareable link.
                                        </Typography>

                                        <StyledRightButton
                                            variant="outlined"
                                            startIcon={<StyledPublishedIcon />}
                                            disabled={
                                                !portalDetails.project_has_portal
                                            }
                                            onClick={() => {
                                                publish();
                                            }}
                                        >
                                            Publish
                                        </StyledRightButton>
                                    </StyledSubRow>

                                    <StyledSubRow>
                                        <TextField
                                            focused={false}
                                            label={'Link'}
                                            variant={'outlined'}
                                            value={
                                                portalDetails.project_has_portal
                                                    ? portalDetails.project_portal_url
                                                    : ''
                                            }
                                            sx={{ width: '100%' }}
                                            InputProps={{
                                                startAdornment: <InsertLink />,
                                            }}
                                        >
                                            {portalDetails.project_has_portal
                                                ? portalDetails.project_portal_url
                                                : ''}
                                        </TextField>
                                    </StyledSubRow>
                                </StyledSubColumn>
                            </>
                        </StyledCardRight>
                    </StyledCardDiv>
                </StyledTopCardContainer>

                {portalReactors.reactors.length ? (
                    <StyledCardContainer>
                        <StyledCardDiv>
                            <StyledCardLeft>
                                <StyledListItemHeader>
                                    <Typography variant="h6">
                                        Reactors
                                    </Typography>
                                </StyledListItemHeader>

                                <StyledListItemHeader>
                                    Custom reactors created for the portal.
                                </StyledListItemHeader>
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        recompileReactors({ release: null });
                                    }}
                                >
                                    Compile Changes on This Instance
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() => {
                                        recompileReactors({ release: true });
                                    }}
                                >
                                    Deploy and Persist Changes
                                </Button>
                                {portalReactors.lastCompiled && (
                                    <StyledLeftActionContainer>
                                        <StyledLeftActionDiv>
                                            <StyledActionDivLeft>
                                                <Typography variant="body2">
                                                    Last compiled by:
                                                </Typography>
                                            </StyledActionDivLeft>
                                            <Avatar>
                                                <StyledPersonIcon />
                                            </Avatar>
                                            <Typography variant="body2">
                                                {portalReactors.compiledBy}
                                            </Typography>
                                            <Typography variant="body2">
                                                on
                                            </Typography>
                                            <Typography variant="body2">
                                                {portalReactors.lastCompiled}
                                            </Typography>
                                        </StyledLeftActionDiv>{' '}
                                    </StyledLeftActionContainer>
                                )}
                            </StyledCardLeft>
                            <StyledCardRight>
                                <StyledTable>
                                    <Table.Body>
                                        {portalReactors.reactors.map(
                                            (reactor, i) => {
                                                return (
                                                    <Table.Row
                                                        key={reactor + i}
                                                    >
                                                        <Table.Cell>
                                                            {reactor}
                                                        </Table.Cell>
                                                        <Table.Cell align="right">
                                                            <Java />
                                                        </Table.Cell>
                                                    </Table.Row>
                                                );
                                            },
                                        )}
                                    </Table.Body>
                                </StyledTable>
                            </StyledCardRight>
                        </StyledCardDiv>
                    </StyledCardContainer>
                ) : null}
                <StyledCardContainer>
                    {isLoading && (
                        <LoadingScreen.Trigger description="Updating Project" />
                    )}
                    <StyledCardDiv>
                        <StyledCardLeft>
                            <StyledListItemHeader>
                                <Typography variant="h6">
                                    Update Project
                                </Typography>
                            </StyledListItemHeader>
                        </StyledCardLeft>
                        <StyledCardRight>
                            <Controller
                                name={'PROJECT_UPLOAD'}
                                control={control}
                                rules={{}}
                                render={({ field }) => {
                                    return (
                                        <FileDropzone
                                            multiple={false}
                                            value={field.value}
                                            disabled={isLoading}
                                            onChange={(newValues) => {
                                                field.onChange(newValues);
                                            }}
                                        />
                                    );
                                }}
                            />
                            <Stack alignItems={'center'}>
                                <Button
                                    type="submit"
                                    variant={'contained'}
                                    disabled={isLoading || !uploadFile}
                                    onClick={editApp}
                                >
                                    Update
                                </Button>
                            </Stack>
                        </StyledCardRight>
                    </StyledCardDiv>
                </StyledCardContainer>
            </StyledAppSettings>
        );
    }
};
