import {
    Add,
    Delete,
    ContentCopyOutlined,
    KeyboardArrowDown,
    KeyboardArrowUp,
} from '@mui/icons-material';

import { useForm, Controller } from 'react-hook-form';
import {
    useNotification,
    styled,
    Stack,
    Table,
    IconButton,
    Button,
    Typography,
    TextField,
    Avatar,
    Paper,
    Modal,
    Grid,
    Alert,
    Collapse,
} from '@semoss/ui';

import { useAPI, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { useState } from 'react';
import { getSDKSnippet } from '@/utility';
const StyledAvatar = styled(Avatar)(({ theme }) => ({
    display: 'flex',
    alignContent: 'center',
    justifyContent: 'center',
    backgroundColor: '#975FE4',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: '40px 30px 20px 50px',
}));

const StyledAccessTokensPaper = styled(Paper)(({ theme }) => ({
    padding: '40px 30px 20px 28px',
}));

const HeaderCell = styled(Table.Cell)(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
}));

const LeftHeaderCell = styled(Table.Cell)(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
    borderRadius: '20px 0 0 0',
    textAlign: 'center',
}));

const RightHeaderCell = styled(Table.Cell)(({ theme }) => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
    borderRadius: '0 20px 0 0',
    textAlign: 'center',
}));

const MessageDiv = styled('div')(({ theme }) => ({
    textAlign: 'center',
    marginTop: '100px',
    fontSize: '13px',
    display: 'block',
    color: '#666',
    width: '100%',
    margin: '75px auto 85px',
}));

const AvatarForm = styled('form')(({ theme }) => ({
    paddingTop: '15px',
    width: '750px',
}));

const CurrentAvatarStack = styled(Stack)(({ theme }) => ({
    alignItems: 'center',
}));

const StyledTableContainer = styled(Table.Container)(({ theme }) => ({
    marginTop: '20px',
}));

const StyledGrid = styled(Grid)(({ theme }) => ({
    marginBottom: '40px',
}));

const MonolithGrid = styled(Grid)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    marginBottom: '15px',
}));

const CopyGridItem = styled(Grid)(({ theme }) => ({
    padding: 0,
    display: 'flex',
    justifyContent: 'right',
}));

const GridItem = styled(Grid)(({ theme }) => ({
    padding: 0,
}));

const CustomGridItem = styled(GridItem)(({ theme }) => ({
    padding: 0,
    zIndex: 8,
}));

const StyledCodeBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(5),
    background: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    overflowX: 'scroll',
    margin: '0px',
}));

const StyledCodeContent = styled('code', {
    shouldForwardProp: (prop) => prop !== 'maxWidth',
})<{
    /** Track if the page header is stuck */
    maxWidth?: string;
}>(({ theme, maxWidth }) => ({
    flex: 1,
    maxWidth: maxWidth ? maxWidth : 'auto',
    overflowY: 'scroll',
}));

const StyledSDKBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '40px',
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    margin: '0px',
}));

const StyledCreatedKeyContainer = styled(Stack)(({ theme }) => ({
    background: theme.palette.background.default,
    padding: theme.spacing(1),
}));

interface SaveAPIKeyForm {
    APIKEY: string;
    USERID: string;
}

interface EditUserInfoForm {
    NAME: string;
    USERNAME: string;
    EMAIL: string;
    USERID?: string | undefined;
}

export const JiraProfilePage = () => {
    const notification = useNotification();
    const { configStore, monolithStore } = useRootStore();
    const { email, id, name, admin, loggedIn } = configStore.store.user;

    // track the models
    const [addModal, setAddModal] = useState(false);

    // get the keys
    const getSavedApiKeys = useAPI(['getSavedApiKeys']);

    // NATIVE Login USERID must match Username
    const logins = configStore.store.config.logins;
    const nativeLogin = logins['NATIVE'];

    const { control, reset, setValue, handleSubmit, watch } =
        useForm<SaveAPIKeyForm>({
            defaultValues: {
                APIKEY: '',
                USERID: '',
            },
        });

    const SaveAPIKey = async (data: SaveAPIKeyForm) => {
        try {
            console.log('Saving API Key', data);
            const output = await monolithStore.saveUserApiKey(
                data.APIKEY,
                data.USERID,
            );

            // add a new one
            notification.add({
                color: 'success',
                message: 'Successfully Saved key',
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
            getSavedApiKeys.refresh();

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
        // if (isCreated) {
        getSavedApiKeys.refresh();
        //}

        // reset the form
        reset({});
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
        getSavedApiKeys.status === 'INITIAL' ||
        getSavedApiKeys.status === 'LOADING'
    ) {
        return <LoadingScreen.Trigger description="Getting access keys" />;
    }

    return (
        <Stack gap={3} className="my-profile-page">
            <StyledAccessTokensPaper>
                <Stack direction="row" justifyContent={'space-between'} mb={1}>
                    <Typography variant="h6">Personal Access Tokens</Typography>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setAddModal(true);
                        }}
                        data-testid={'my-profile-new-key-btn'}
                    >
                        New Key
                    </Button>
                </Stack>

                <StyledTableContainer>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <LeftHeaderCell align={'left'}>
                                    Name
                                </LeftHeaderCell>
                                <HeaderCell align={'left'}>
                                    Description
                                </HeaderCell>
                                <HeaderCell align={'left'}>
                                    Date Created
                                </HeaderCell>
                                <HeaderCell align={'left'}>
                                    Last Used Created
                                </HeaderCell>
                                <HeaderCell align={'left'}>
                                    Access Key
                                </HeaderCell>
                                <RightHeaderCell>&nbsp;</RightHeaderCell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {getSavedApiKeys.status === 'SUCCESS' &&
                            getSavedApiKeys.data.length !== 0
                                ? getSavedApiKeys.data.map((k, idx) => {
                                      return (
                                          <Table.Row key={idx}>
                                              <Table.Cell align={'left'}>
                                                  {k.TOKENNAME}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.TOKENDESCRIPTION || ''}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.DATECREATED}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.LASTUSED}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.ACCESSKEY}
                                              </Table.Cell>
                                              <Table.Cell align={'right'}>
                                                  <IconButton
                                                      title="Copy"
                                                      onClick={() => {
                                                          copy(k.ACCESSKEY);
                                                      }}
                                                      data-testid={
                                                          'my-profile-access-key-copy-btn'
                                                      }
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
                                                      data-testid={
                                                          'my-profile-access-key-delete-btn'
                                                      }
                                                  >
                                                      <Delete />
                                                  </IconButton>
                                              </Table.Cell>
                                          </Table.Row>
                                      );
                                  })
                                : null}
                        </Table.Body>
                    </Table>
                </StyledTableContainer>
                {getSavedApiKeys.status === 'SUCCESS' &&
                    getSavedApiKeys.data.length === 0 && (
                        <MessageDiv>
                            No Personal Access Tokens to display at this time
                            <br />
                            Click New Key to create a new Personal Access Token
                        </MessageDiv>
                    )}
            </StyledAccessTokensPaper>

            <Modal open={addModal} onClose={() => closeModel()} maxWidth="lg">
                <Modal.Title>Generate Key</Modal.Title>
                <Modal.Content>
                    <Stack sx={{ width: '800px' }} spacing={4}>
                        <form
                            onSubmit={handleSubmit(SaveAPIKey)}
                            className="my-profile-page__generate-key-form"
                        >
                            <Stack direction="column" spacing={2}>
                                {/* <Alert severity="info">
                                    Note: Your private key will only be
                                    generated once
                                </Alert> */}

                                <Controller
                                    name={'APIKEY'}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                required
                                                label="API Key"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                //disabled={isCreated}
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                                inputProps={{ maxLength: 255 }}
                                            ></TextField>
                                        );
                                    }}
                                />

                                <Controller
                                    name={'USERID'}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                required
                                                label="User Id"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
                                                //disabled={isCreated}
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
                                        //disabled={isCreated}
                                        type="submit"
                                        variant={'outlined'}
                                        color="primary"
                                        data-testid={
                                            'my-profile-page-generate-btn'
                                        }
                                    >
                                        Save
                                    </Button>
                                </Stack>
                            </Stack>
                        </form>
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Button variant="text" onClick={() => closeModel()}>
                        Close
                    </Button>
                </Modal.Actions>
            </Modal>
        </Stack>
    );
};
