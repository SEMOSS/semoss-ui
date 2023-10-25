import {
    Add,
    Delete,
    ContentCopyOutlined,
    EditRounded,
    ContentCopy,
} from '@mui/icons-material';

import { useForm, Controller } from 'react-hook-form';
import {
    styled,
    Button,
    Typography,
    Stack,
    Table,
    IconButton,
    useNotification,
    Modal,
    Alert,
    TextField,
    Icon,
    Box,
    Grid,
} from '@semoss/ui';

import { useAPI, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { useState } from 'react';

const HeaderCell = styled(Table.Cell)(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
}));

const MessageDiv = styled('div')(({ theme }) => ({
    textAlign: 'center',
    margin: '50px auto 75px',
    display: 'block',
    width: '100%',
    marginTop: '100px',
    color: '#666',
    fontSize: '13px',
    // border: '1px solid pink',
}));

const ShadowedStack = styled(Stack)(({ theme }) => ({
    borderRadius: '15px',
    boxShadow: '0 0 10px #00000020',
    padding: '17.5px 20px',
}));

const GridItem = styled(Grid)(({ theme }) => ({
    padding: 0,
    // border: '1px solid red',
    display: 'flex',
    alignItems: 'center',
}));

const ProfileImagePlaceholder = styled('span')(({ theme }) => ({
    display: 'block',
    width: '50px',
    height: '50px',
    backgroundColor: '#eee',
    borderRadius: '50%',
}));

const StyledCodeBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(5),
    background: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    margin: '0px',
    overflowX: 'scroll',
}));

const StyledCodeContent = styled('code')(() => ({
    flex: 1,
}));

interface CreateAccessKeyForm {
    TOKENNAME: string;
    TOKENDESCRIPTION?: string;
    ACCESSKEY: string;
    SECRETKEY: string;
    FIRSTNAME: string;
    LASTNAME: string;
    USERNAME: string;
    EMAIL: string;
}

export const MyProfilePage = () => {
    const notification = useNotification();
    const { monolithStore } = useRootStore();

    // track the models
    const [addModal, setAddModal] = useState(false);
    const [profileImgModal, setProfileImgModal] = useState(false);

    // get the keys
    const getUserAccessKeys = useAPI(['getUserAccessKeys']);

    // ### ---> old working control for new access key only
    // const { control, reset, setValue, handleSubmit, watch } =
    //     useForm<CreateAccessKeyForm>({
    //         defaultValues: {
    //             TOKENNAME: '',
    //             TOKENDESCRIPTION: '',
    //             ACCESSKEY: '',
    //             SECRETKEY: '',
    //         },
    //     });

    // ### ---> adding user info etc to same control, might have to break out to new control or state vars
    const { control, reset, setValue, handleSubmit, watch } =
        useForm<CreateAccessKeyForm>({
            defaultValues: {
                TOKENNAME: '',
                TOKENDESCRIPTION: '',
                ACCESSKEY: '',
                SECRETKEY: '',
                FIRSTNAME: '',
                LASTNAME: '',
                USERNAME: '',
                EMAIL: '',
            },
        });

    const ACCESSKEY = watch('ACCESSKEY');
    const SECRETKEY = watch('SECRETKEY');

    // track if we can create a key
    const isCreated = ACCESSKEY && SECRETKEY ? true : false;

    /**
     * Delete an accesskey
     * @param accessKey - delete an access key
     */
    const createAccessKey = async (data: CreateAccessKeyForm) => {
        try {
            const output = await monolithStore.createUserAccessKey(
                data.TOKENNAME,
                data.TOKENDESCRIPTION || '',
            );

            // update the values
            setValue('ACCESSKEY', output.ACCESSKEY);
            setValue('SECRETKEY', output.SECRETKEY);

            // add a new one
            notification.add({
                color: 'success',
                message: 'Successfully created key',
            });
        } catch (e) {
            if (e instanceof Error) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }
        }
    };

    /**
     * Delete an accesskey
     * @param accessKey - delete an access key
     */
    const deleteAccessKey = async (accessKey: string) => {
        try {
            const response = await monolithStore.deleteUserAccessKeys(
                accessKey,
            );

            if (!response) {
                throw new Error('Error deleting key');
            }

            // refresh the keys
            getUserAccessKeys.refresh();

            // add a new one
            notification.add({
                color: 'success',
                message: 'Successfully deleted key',
            });
        } catch (e) {
            if (e instanceof Error) {
                notification.add({
                    color: 'error',
                    message: e.message,
                });
            }
        }
    };

    /**
     * Callback that is triggered when the add modal closes
     */
    const closeModel = () => {
        // close it
        setAddModal(false);

        // a new key was added refresh the current keys
        if (isCreated) {
            getUserAccessKeys.refresh();
        }

        // reset the form
        reset({});
    };

    const closeProfileEditModel = () => {
        setProfileImgModal(false);
    };

    const profileEditSubmit = () => {
        alert('submit edits');
    };

    /**
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied code',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy code',
            });
        }
    };

    if (
        getUserAccessKeys.status === 'INITIAL' ||
        getUserAccessKeys.status === 'LOADING'
    ) {
        return <LoadingScreen.Trigger description="Getting access keys" />;
    }

    return (
        <>
            {/* ### ---> test stack for profileImgModal */}

            <ShadowedStack direction="row" alignItems={'center'}>
                {/* ### ---> need to add a table or grid here - does semoss-ui use Grid? */}
                <Grid container spacing={3}>
                    <GridItem sm={4}>
                        <Typography variant="h6">
                            <strong>Edit profile picture</strong>
                        </Typography>
                    </GridItem>

                    {/* <GridItem sm={0.75}>
                    </GridItem> */}

                    <GridItem sm={3}>
                        <ProfileImagePlaceholder />
                        <Button
                            variant="text"
                            // startIcon={<EditRounded />}
                            sx={{
                                textAlign: 'right',
                                fontWeight: '800',
                                marginLeft: '15px',
                            }}
                            onClick={() => {
                                setProfileImgModal(true);
                            }}
                        >
                            Upload
                        </Button>
                    </GridItem>
                </Grid>
            </ShadowedStack>

            <ShadowedStack>
                <Grid
                    container
                    spacing={3}
                    style={{ alignItems: 'flex-start', paddingRight: '25px' }}
                >
                    <GridItem sm={4}>
                        <Typography variant="h6">
                            <strong>Edit profile information</strong>
                        </Typography>
                    </GridItem>

                    {/* <GridItem sm={0.75}>
                    </GridItem> */}

                    <GridItem sm={8}>
                        <form
                            onSubmit={profileEditSubmit}
                            style={{ width: '100%' }}
                        >
                            <Stack
                                direction="row"
                                spacing={2}
                                style={{ marginBottom: '15px' }}
                            >
                                <Controller
                                    name={'FIRSTNAME'}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="First Name"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                // disabled={isCreated}
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                                inputProps={{ maxLength: 255 }}
                                                fullWidth={false}
                                                style={{ width: '50%' }}
                                            ></TextField>
                                        );
                                    }}
                                />

                                <Controller
                                    name={'LASTNAME'}
                                    control={control}
                                    rules={{ required: false }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Last Name"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                // disabled={isCreated}
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                                inputProps={{ maxLength: 500 }}
                                                fullWidth={false}
                                                style={{ width: '50%' }}
                                            ></TextField>
                                        );
                                    }}
                                />
                            </Stack>

                            <Stack
                                direction="row"
                                style={{ marginBottom: '15px' }}
                            >
                                <Controller
                                    name={'USERNAME'}
                                    control={control}
                                    rules={{ required: false }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Username"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                // disabled={isCreated}
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                                inputProps={{ maxLength: 500 }}
                                                fullWidth={true}
                                                // style={{width: "50%"}}
                                            ></TextField>
                                        );
                                    }}
                                />
                            </Stack>

                            <Stack
                                direction="row"
                                style={{ marginBottom: '15px' }}
                            >
                                <Controller
                                    name={'EMAIL'}
                                    control={control}
                                    rules={{ required: false }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                label="Email"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                // disabled={isCreated}
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                                inputProps={{ maxLength: 500 }}
                                                fullWidth={true}
                                                // style={{width: "50%"}}
                                            ></TextField>
                                        );
                                    }}
                                />
                            </Stack>

                            <Stack direction="row">
                                <Button
                                    variant="contained"
                                    color="primary"
                                    style={{
                                        fontWeight: '800',
                                        marginRight: '10px',
                                    }}
                                    onClick={() => {
                                        alert('Save');
                                    }}
                                >
                                    Save
                                </Button>

                                <Button
                                    variant="text"
                                    color="primary"
                                    sx={{ fontWeight: '800', color: 'black' }}
                                    onClick={() => {
                                        alert('Reset');
                                    }}
                                >
                                    Reset
                                </Button>
                            </Stack>
                        </form>
                    </GridItem>
                </Grid>
            </ShadowedStack>

            <ShadowedStack>
                <Grid container spacing={3}>
                    <GridItem sm={4}>
                        <Typography variant="h6">
                            <strong>Monolith Endpoint</strong>
                        </Typography>
                    </GridItem>

                    <GridItem sm={7}>
                        <p style={{ fontSize: '15px' }}>
                            {/* ### ---> check config for this url */}
                            https://workspace.cfg.deloitte.com/cfg-ai-demo/Monolith/api
                        </p>
                        {/* <Button
                            variant="text"
                            // startIcon={<EditRounded />}
                            sx={{ textAlign: 'right', fontWeight: '800', marginLeft: "15px" }}
                            onClick={() => {
                                setProfileImgModal(true);
                            }}
                        >
                            Upload
                        </Button> */}
                    </GridItem>

                    <GridItem sm={1} style={{ justifyContent: 'center' }}>
                        <IconButton
                            onClick={() => {
                                alert('copy');
                            }}
                        >
                            <ContentCopy />
                        </IconButton>
                    </GridItem>
                </Grid>
            </ShadowedStack>

            <ShadowedStack>
                <Stack direction="row" justifyContent={'space-between'} mb={1}>
                    <Typography variant="h6">
                        <strong>Personal Access Tokens</strong>
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        sx={{ textAlign: 'right' }}
                        onClick={() => {
                            setAddModal(true);
                        }}
                    >
                        New Key
                    </Button>
                </Stack>

                <Table.Container style={{ marginTop: '20px' }}>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <HeaderCell
                                    style={{ borderRadius: '20px 0 0 0' }}
                                >
                                    <strong>Name</strong>
                                </HeaderCell>
                                {/* <HeaderCell> */}
                                <HeaderCell>
                                    <strong>Description</strong>
                                </HeaderCell>
                                {/* <HeaderCell> */}
                                <HeaderCell>
                                    <strong>Date Created</strong>
                                </HeaderCell>
                                {/* <HeaderCell> */}
                                <HeaderCell>
                                    <strong>Last Used Created</strong>
                                </HeaderCell>
                                {/* <HeaderCell> */}
                                <HeaderCell
                                    style={{ borderRadius: '0 20px 0 0' }}
                                >
                                    <strong>Access Key</strong>
                                </HeaderCell>
                                {/* <HeaderCell>&nbsp;</HeaderCell> */}
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {getUserAccessKeys.status === 'SUCCESS' &&
                            getUserAccessKeys.data.length !== 0
                                ? getUserAccessKeys.data.map((k, idx) => {
                                      return (
                                          <Table.Row key={idx}>
                                              <Table.Cell>
                                                  {k.TOKENNAME}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  {k.TOKENDESCRIPTION || ''}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  {k.DATECREATED}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  {k.LASTUSED}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  {k.ACCESSKEY}
                                              </Table.Cell>
                                              <Table.Cell>
                                                  <Stack
                                                      direction="row"
                                                      spacing={1}
                                                  >
                                                      <IconButton
                                                          title="Copy"
                                                          onClick={() => {
                                                              copy(k.ACCESSKEY);
                                                          }}
                                                      >
                                                          <ContentCopyOutlined />
                                                      </IconButton>

                                                      <IconButton
                                                          title="Delete"
                                                          onClick={() => {
                                                              deleteAccessKey(
                                                                  k.ACCESSKEY,
                                                              );
                                                          }}
                                                      >
                                                          <Delete />
                                                      </IconButton>
                                                  </Stack>
                                              </Table.Cell>
                                          </Table.Row>
                                      );
                                  })
                                : null}
                        </Table.Body>
                    </Table>
                </Table.Container>
                {getUserAccessKeys.status === 'SUCCESS' &&
                    getUserAccessKeys.data.length === 0 && (
                        <MessageDiv style={{ margin: '75px auto 85px' }}>
                            No Personal Access Tokens to display at this time
                            <br />
                            Click <strong>New Key</strong> to create a new
                            Personal Access Token
                        </MessageDiv>
                    )}
            </ShadowedStack>

            <Modal open={addModal} onClose={() => closeModel()}>
                <Modal.Title>Generate Key</Modal.Title>
                <Modal.Content>
                    <form onSubmit={handleSubmit(createAccessKey)}>
                        <Stack direction="column" spacing={2}>
                            <Alert severity="info" variant="outlined">
                                Note: Your private key will only be generated
                                once
                            </Alert>

                            <Controller
                                name={'TOKENNAME'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            required
                                            label="Name"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            disabled={isCreated}
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                            inputProps={{ maxLength: 255 }}
                                        ></TextField>
                                    );
                                }}
                            />

                            <Controller
                                name={'TOKENDESCRIPTION'}
                                control={control}
                                rules={{ required: false }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label="Description"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            disabled={isCreated}
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                            inputProps={{ maxLength: 500 }}
                                        ></TextField>
                                    );
                                }}
                            />

                            <Stack direction="row" justifyContent={'start'}>
                                <Button
                                    disabled={isCreated}
                                    type="submit"
                                    variant={'outlined'}
                                    color="primary"
                                >
                                    Generate
                                </Button>
                            </Stack>
                            {isCreated && (
                                <>
                                    <Stack direction="column" spacing={1}>
                                        <Typography variant={'subtitle2'}>
                                            Access Key
                                        </Typography>
                                        <StyledCodeBlock>
                                            <StyledCodeContent>
                                                {ACCESSKEY}
                                            </StyledCodeContent>
                                            <Button
                                                size={'medium'}
                                                variant="outlined"
                                                startIcon={
                                                    <ContentCopyOutlined
                                                        color={'inherit'}
                                                    />
                                                }
                                                onClick={() => copy(ACCESSKEY)}
                                            >
                                                Copy
                                            </Button>
                                        </StyledCodeBlock>
                                    </Stack>
                                    <Stack direction="column" spacing={1}>
                                        <Typography variant={'subtitle2'}>
                                            Secret Key
                                        </Typography>
                                        <StyledCodeBlock>
                                            <StyledCodeContent>
                                                {SECRETKEY}
                                            </StyledCodeContent>
                                            <Button
                                                size={'medium'}
                                                variant="outlined"
                                                startIcon={
                                                    <ContentCopyOutlined
                                                        color={'inherit'}
                                                    />
                                                }
                                                onClick={() => copy(SECRETKEY)}
                                            >
                                                Copy
                                            </Button>
                                        </StyledCodeBlock>
                                    </Stack>
                                </>
                            )}
                        </Stack>
                    </form>
                </Modal.Content>
                <Modal.Actions>
                    <Button variant="text" onClick={() => closeModel()}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>

            {/* ### ---> test modal */}
            <Modal open={profileImgModal} onClose={() => closeModel()}>
                <Modal.Title>Upload Profile Picture</Modal.Title>
                <Modal.Content>
                    <Stack
                        direction="row"
                        spacing={2}
                        style={{ marginBottom: '15px', alignItems: 'center' }}
                    >
                        <ProfileImagePlaceholder />
                        <span>Current avatar</span>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={2}
                        style={{ marginBottom: '15px' }}
                    >
                        <form
                            onSubmit={profileEditSubmit}
                            style={{ width: '750px' }}
                        >
                            <Controller
                                name={'PLACEHOLDER'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label="Placeholder"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            // disabled={isCreated}
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                            inputProps={{ maxLength: 255 }}
                                            fullWidth={true}
                                            // style={{width: "50%"}}
                                        ></TextField>
                                    );
                                }}
                            />
                        </form>
                    </Stack>
                    {/* <Button variant="text" onClick={() => closeModel()}>
                        Close
                    </Button> */}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="contained"
                        onClick={() => {
                            alert('save');
                        }}
                    >
                        Save
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    );
};

// To-Do for ticket 144...

// ---------------------------

// My Profile page needs to be updated with the following items:
//  Dependent on another branch hold off on this: Edit Profile Picture container **will require a crop window after upload, design team is working on building this out in future
//  Edit Profile Information container with input/editable fields <-- [?] does this mean a modal
//  Display of Monolith Endpoint and ability to copy
//  Update current access key table to sit within a container as shown in designs and update styling accordingly
//  Update the generate key modals according to the designs

// ---------------------------

// Generate Key modal may be working
// need to test with correct user permissions
// need to check for second stage of modal -- where Access Key and Secret Key are both shown with copy icon

// Add Edit profile picture container -- save for later [?]
// profile picture img
// Upload blue link / text-only button
// open profile pic edit modal
// hide / save for later

// Add Edit profile information container
// input fields for First Name and Last Name
// input for Username
// input for Email
// Blue button for Save
// black text-only button for Reset
// do we have a editProfileInfo reactor [?]

// Add a Monolith Endpoint container
// displays enpoint text with copy / clipboard icon
// do we already have access to this info from existing reactor calls [?]

// separate modal for -- Upload Profile Picture -- waiting on this [?]
// text input for Name edit [?]
// update image tool -- waiting on this still [?]

// separate modal for -- Edit Access Key
// uneditable display for Access Key: ...
// editable text input for Name*
// editable text input for Description
// blue Save button
// do we have an editAccessKey reactor [?]
