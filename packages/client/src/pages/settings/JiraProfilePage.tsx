import { Add, Delete } from '@mui/icons-material';

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
    Paper,
    Modal,
    Grid,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
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

interface SaveAPIKeyForm {
    APIKEY: string;
    USERID: string;
    URL: string;
    NAME: string;
}

export const JiraProfilePage = () => {
    const notification = useNotification();
    const { monolithStore } = useRootStore();

    const [addModal, setAddModal] = useState(false);
    const [savedApiKeys, setSavedApiKeys] = useState([]);

    const { control, reset, setValue, handleSubmit, watch } =
        useForm<SaveAPIKeyForm>({
            defaultValues: {
                APIKEY: '',
                USERID: '',
                URL: '',
                NAME: '',
            },
        });

    useEffect(() => {
        getSavedApiKeysQuery();
    }, []);

    const getSavedApiKeysQuery = async () => {
        const pixel = `META | JiraGet()`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output;
                console.log('output', output);
                if (type.indexOf('ERROR') === -1 && output.length > 0) {
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
        const pixel = `META | JiraInsert(username="${data.USERID}",apikey="${data.APIKEY}",url="${data.URL}",alias="${data.NAME}")`;
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
                    setAddModal(false);
                    reset({});
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
    };

    const DeleteAPIKey = async (primaryId: string) => {
        const pixel = `META | Jira(command= "delete record for userid",userid="${primaryId}")`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output;
                if (
                    type.indexOf('ERROR') === -1 &&
                    output.includes('Record deleted succesfully by user')
                ) {
                    notification.add({
                        color: 'success',
                        message: 'Successfully deleted the API key.',
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
    };

    const closeModel = () => {
        setAddModal(false);
        reset({});
    };

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

    return (
        <Stack gap={3} className="my-jira-profile-page">
            <StyledAccessTokensPaper>
                <Stack direction="row" justifyContent={'space-between'} mb={1}>
                    <Typography variant="h6">Personal API Keys</Typography>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setAddModal(true);
                        }}
                        data-testid={'my-jira-profile-new-key-btn'}
                    >
                        Add Key
                    </Button>
                </Stack>

                <StyledTableContainer>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <LeftHeaderCell align={'left'}>
                                    Name
                                </LeftHeaderCell>
                                <HeaderCell align={'left'}>Url</HeaderCell>
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
                                                  {k.alias}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.url}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.dateCreated}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.dateLastUsed}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.userId}
                                              </Table.Cell>
                                              <Table.Cell align={'right'}>
                                                  <IconButton
                                                      title="Delete"
                                                      onClick={() => {
                                                          DeleteAPIKey(
                                                              k.primaryId,
                                                          );
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
                    <Stack
                        sx={{ width: '800px' }}
                        spacing={4}
                        style={{ paddingTop: '10px' }}
                    >
                        <form
                            onSubmit={handleSubmit(SaveAPIKey)}
                            className="my-jira-profile-page__generate-key-form"
                        >
                            <Stack direction="column" spacing={2}>
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
                                    name={'NAME'}
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => {
                                        return (
                                            <TextField
                                                required
                                                label="Name"
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
