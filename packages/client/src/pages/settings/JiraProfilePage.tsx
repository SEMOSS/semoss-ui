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
import { useState, useEffect } from 'react';

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

const StyledTableContainer = styled(Table.Container)(({ theme }) => ({
    marginTop: '20px',
}));

const GridItem = styled(Grid)(({ theme }) => ({
    padding: 0,
}));

interface SaveAPIKeyForm {
    APIKEY: string;
    USERID: string;
    URL: string;
}

export const JiraProfilePage = () => {
    const notification = useNotification();
    const { configStore, monolithStore } = useRootStore();

    // track the models
    const [addModal, setAddModal] = useState(false);

    const [savedApiKeys, setSavedApiKeys] = useState([]);

    // get the keys
    //const getSavedApiKeys = useAPI(['getSavedApiKeys']);

    const { control, reset, setValue, handleSubmit, watch } =
        useForm<SaveAPIKeyForm>({
            defaultValues: {
                APIKEY: '',
                USERID: '',
                URL: '',
            },
        });

    useEffect(() => {
        getSavedApiKeysQuery();
    }, []); // Empty dependency array ensures the call is made only once when the component mounts

    const getSavedApiKeysQuery = async () => {
        const pixel = `META | JiraGet()`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output;
                //setSavedApiKeys((current)=>[...current,{URL: 'https://example.com', DATECREATED: '2023-10-01', LASTUSED: '2023-10-02', USERID: '12345'}]); // Mock data for testing
                if (type.indexOf('ERROR') === -1 && output.length > 0) {
                    // notification.add({
                    //     color: 'success',
                    //     message: 'Successfully inserted Jira credentials.',
                    // });
                    setSavedApiKeys(output);
                } else {
                    throw new Error(response.errors[0]);
                }
            })
            .catch((error) => {
                console.error('Error making pixel call:', error);
            });
    };
    const SaveAPIKey = async (data: SaveAPIKeyForm) => {
        const pixel = `META | JiraInsert(username="${data.USERID}",apikey="${data.APIKEY}",url="${data.URL}")`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output.Success;
                if (type.indexOf('ERROR') === -1 && output === true) {
                    notification.add({
                        color: 'success',
                        message: 'Successfully inserted Jira credentials.',
                    });

                    getSavedApiKeysQuery();
                } else {
                    throw new Error(response.errors[0]);
                }
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    message: error.message,
                });
            });
        // try {
        //     console.log('Saving API Key', data);
        //     const output = await monolithStore.saveUserApiKey(
        //         data.APIKEY,
        //         data.USERID,
        //     );

        //     getSavedApiKeys.refresh();

        //     // add a new one
        //     notification.add({
        //         color: 'success',
        //         message: 'Successfully Saved key',
        //     });
        // } catch (e) {
        //     if (e instanceof Error) {
        //         notification.add({
        //             color: 'error',
        //             message: e.message,
        //         });
        //     }
        // }
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
            //getSavedApiKeys.refresh();

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

    // if (
    //     getSavedApiKeys.status === 'INITIAL' ||
    //     getSavedApiKeys.status === 'LOADING'
    // ) {
    //     return <LoadingScreen.Trigger description="Getting access keys" />;
    // }

    return (
        <Stack gap={3} className="my-jira-profile-page">
            <StyledAccessTokensPaper>
                <Stack direction="row" justifyContent={'space-between'} mb={1}>
                    <Typography variant="h6">Personal Access Tokens</Typography>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setAddModal(true);
                        }}
                        data-testid={'my-jira-profile-new-key-btn'}
                    >
                        Save Key
                    </Button>
                </Stack>

                <StyledTableContainer>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <LeftHeaderCell align={'left'}>
                                    Url
                                </LeftHeaderCell>
                                <HeaderCell align={'left'}>
                                    Date Created
                                </HeaderCell>
                                <HeaderCell align={'left'}>
                                    Last Used Created
                                </HeaderCell>
                                <HeaderCell align={'left'}>UserId</HeaderCell>
                                <RightHeaderCell>&nbsp;</RightHeaderCell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {savedApiKeys.length !== 0
                                ? savedApiKeys.map((k, idx) => {
                                      return (
                                          <Table.Row key={idx}>
                                              <Table.Cell align={'left'}>
                                                  {k.url}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.dateCreated}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.lastUsed}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.userId}
                                              </Table.Cell>
                                              <Table.Cell align={'right'}>
                                                  {/* <IconButton
                                                      title="Copy"
                                                      onClick={() => {
                                                          //copy(k.ACCESSKEY);
                                                      }}
                                                      data-testid={
                                                          'my-jira-profile-access-key-copy-btn'
                                                      }
                                                  >
                                                      <ContentCopyOutlined />
                                                  </IconButton> */}
                                                  <IconButton
                                                      title="Delete"
                                                      onClick={() => {
                                                          //   deleteAccessKey(
                                                          //       k.ACCESSKEY,
                                                          //   );
                                                      }}
                                                      data-testid={
                                                          'my-jira-profile-access-key-delete-btn'
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
                {savedApiKeys.length === 0 && (
                    <MessageDiv>
                        No Personal API Keys to display at this time
                        <br />
                        Click Save Key to save a new Personal API Key
                    </MessageDiv>
                )}
            </StyledAccessTokensPaper>

            <Modal open={addModal} onClose={() => closeModel()} maxWidth="lg">
                <Modal.Title>Save Key</Modal.Title>
                <Modal.Content>
                    <Stack sx={{ width: '800px' }} spacing={4}>
                        <form
                            onSubmit={handleSubmit(SaveAPIKey)}
                            className="my-jira-profile-page__generate-key-form"
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
                                                onChange={(value) =>
                                                    field.onChange(value)
                                                }
                                                inputProps={{ maxLength: 500 }}
                                            ></TextField>
                                        );
                                    }}
                                />

                                <Controller
                                    name={'URL'}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                required
                                                label="URL"
                                                value={
                                                    field.value
                                                        ? field.value
                                                        : ''
                                                }
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
                                        type="submit"
                                        variant={'outlined'}
                                        color="primary"
                                        data-testid={
                                            'my-jira-profile-page-generate-btn'
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
