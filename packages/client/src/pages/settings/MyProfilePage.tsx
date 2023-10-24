import {
    Add,
    Delete,
    ContentCopyOutlined,
    EditRounded,
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
} from '@semoss/ui';

import { useAPI, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { useState } from 'react';

const ProfileImagePlaceholder = styled('span')(({ theme }) => ({
    display: 'block',
    width: '50px',
    height: '50px',
    backgroundColor: '#999',
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
}

export const MyProfilePage = () => {
    const notification = useNotification();
    const { monolithStore } = useRootStore();

    // track the models
    const [addModal, setAddModal] = useState(false);
    const [profileImgModal, setProfileImgModal] = useState(false);

    // get the keys
    const getUserAccessKeys = useAPI(['getUserAccessKeys']);

    const { control, reset, setValue, handleSubmit, watch } =
        useForm<CreateAccessKeyForm>({
            defaultValues: {
                TOKENNAME: '',
                TOKENDESCRIPTION: '',
                ACCESSKEY: '',
                SECRETKEY: '',
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

            <Stack direction="row" alignItems={'center'}>
                {/* ### ---> need to add a table or grid here - does semoss-ui use Grid? */}
                <Typography variant="h6">
                    <strong>Edit profile picture</strong>
                </Typography>

                <ProfileImagePlaceholder />

                <Button
                    variant="text"
                    // startIcon={<EditRounded />}
                    sx={{ textAlign: 'right' }}
                    onClick={() => {
                        setProfileImgModal(true);
                    }}
                >
                    Upload
                </Button>
            </Stack>

            <Stack direction="row" justifyContent={'space-between'} mb={1}>
                <Typography variant="h6">
                    <strong>Access Keys</strong>
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    sx={{ textAlign: 'right' }}
                    onClick={() => {
                        setAddModal(true);
                    }}
                >
                    Add New
                </Button>
            </Stack>

            <Table.Container>
                <Table>
                    <Table.Head>
                        <Table.Row>
                            <Table.Cell>
                                <strong>Name</strong>
                            </Table.Cell>
                            <Table.Cell>
                                <strong>Description</strong>
                            </Table.Cell>
                            <Table.Cell>
                                <strong>Date Created</strong>
                            </Table.Cell>
                            <Table.Cell>
                                <strong>Last Used Created</strong>
                            </Table.Cell>
                            <Table.Cell>
                                <strong>Access Key</strong>
                            </Table.Cell>
                            <Table.Cell>&nbsp;</Table.Cell>
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {getUserAccessKeys.status === 'SUCCESS' &&
                        getUserAccessKeys.data.length !== 0
                            ? getUserAccessKeys.data.map((k, idx) => {
                                  return (
                                      <Table.Row key={idx}>
                                          <Table.Cell>{k.TOKENNAME}</Table.Cell>
                                          <Table.Cell>
                                              {k.TOKENDESCRIPTION || ''}
                                          </Table.Cell>
                                          <Table.Cell>
                                              {k.DATECREATED}
                                          </Table.Cell>
                                          <Table.Cell>{k.LASTUSED}</Table.Cell>
                                          <Table.Cell>{k.ACCESSKEY}</Table.Cell>
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

            <Modal open={addModal} onClose={() => closeModel()}>
                <Modal.Title>Generate Access Key</Modal.Title>
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
                    <ProfileImagePlaceholder />
                    {/* <form onSubmit={handleSubmit(createAccessKey)}>
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
                    </form> */}
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => closeProfileEditModel()}
                    >
                        Close
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
