if (
    typeof window !== 'undefined' &&
    window.console &&
    typeof window.console.error === 'function'
) {
    const originalError = window.console.error;
    window.console.error = function (...args) {
        if (
            typeof args[0] === 'string' &&
            args[0].includes(
                "Cannot read properties of null (reading 'scrollTop')",
            )
        ) {
            // Suppress this specific error
            return;
        }
        originalError.apply(window.console, args);
    };
}
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
    LinearProgress,
    Snackbar,
    Alert,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { useState, useEffect } from 'react';

const StyledAccessTokensPaper = styled(Paper)(() => ({
    padding: '40px 30px 20px 28px',
}));

const HeaderCell = styled(Table.Cell)(() => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
}));

const LeftHeaderCell = styled(Table.Cell)(() => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
    borderRadius: '20px 0 0 0',
    textAlign: 'center',
}));

const RightHeaderCell = styled(Table.Cell)(() => ({
    backgroundColor: '#f3f3f3',
    borderBottom: '1px solid #ccc',
    borderRadius: '0 20px 0 0',
    textAlign: 'center',
}));

const MessageDiv = styled('div')(() => ({
    textAlign: 'center',
    marginTop: '100px',
    fontSize: '13px',
    display: 'block',
    color: '#666',
    width: '100%',
    margin: '75px auto 85px',
}));

const StyledTableContainer = styled(Table.Container)(() => ({
    marginTop: '20px',
}));

const StyledProgress = styled(LinearProgress)(() => ({
    width: '100%',
}));

interface SaveSheetDataForm {
    NAME: string;
    USERID: string;
}

export const GoogleSpreadsheetPage = () => {
    const notification = useNotification();
    const { monolithStore, configStore } = useRootStore();
    const [addModal, setAddModal] = useState(false);
    const [savedConnections, setSavedConnections] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    console.log('hello', configStore.store.config.loginDetails['GOOGLE']);

    const { control, reset, handleSubmit } = useForm<SaveSheetDataForm>({
        defaultValues: {
            NAME: '',
            USERID: '',
        },
    });

    useEffect(() => {
        getSavedSheetDatasQuery();
    }, []);

    const escapePixelString = (str: string) => {
        if (typeof str !== 'string') return '';
        return str
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'")
            .replace(/\"/g, '\\"');
    };

    const getSavedSheetDatasQuery = async () => {
        const pixel = `META | GetGoogleProfile()`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output;
                if (type.indexOf('ERROR') === -1 && output.length > 0) {
                    setSavedConnections(output);
                } else {
                    throw new Error(response.errors[0]);
                }
            })
            .catch((error) => {
                console.error('Error making pixel call:', error);
            });
    };
    const SaveSheetData = async (data: SaveSheetDataForm) => {
        const safeName = escapePixelString(data.NAME);
        const safeUserId = escapePixelString(data.USERID);
        const pixel = `META | SaveGoogleProfile(name='${safeName}', username='${safeUserId}')`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output.Success;
                if (type.indexOf('ERROR') === -1 && output === true) {
                    notification.add({
                        color: 'success',
                        message:
                            'Successfully inserted Google Spreadsheet data.',
                    });

                    getSavedSheetDatasQuery();
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

    const DeleteConnection = async (userId: string) => {
        const safeUserId = escapePixelString(userId);
        const pixel = `META | Jira(command= "delete record for userid",userid="${safeUserId}")`;
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
                        message: 'Successfully deleted the connection.',
                    });

                    getSavedSheetDatasQuery();
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

    const oauth = async (provider: string) => {
        setIsLoading(true);
        await configStore
            .oauth(provider)
            .then(async () => {
                setIsLoading(false);
                notification.add({
                    color: 'success',
                    message: `Successfully logged in`,
                });
                await configStore.initialize();
            })
            .catch((error) => {
                setIsLoading(false);
                notification.add({
                    color: 'error',
                    message: error.message,
                });
            });
    };

    return (
        <Stack gap={3} className="my-jira-profile-page">
            <StyledAccessTokensPaper>
                <Stack direction="row" justifyContent={'space-between'} mb={1}>
                    <Typography variant="h6">Sheet Connections</Typography>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setAddModal(true);
                        }}
                        data-testid={'my-jira-profile-new-key-btn'}
                    >
                        Add User
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            oauth('google');
                        }}
                        data-testid={'my-jira-profile-new-key-btn'}
                    >
                        Login google
                    </Button>
                </Stack>

                <StyledTableContainer>
                    <Table>
                        <Table.Head>
                            <Table.Row>
                                <LeftHeaderCell align={'left'}>
                                    Name
                                </LeftHeaderCell>
                                <HeaderCell align={'left'}>User Id</HeaderCell>
                                <HeaderCell align={'left'}>
                                    Date Created
                                </HeaderCell>
                                <RightHeaderCell>&nbsp;</RightHeaderCell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {savedConnections.length !== 0
                                ? savedConnections.map((k, idx) => {
                                      return (
                                          <Table.Row key={idx}>
                                              <Table.Cell align={'center'}>
                                                  {k.userName}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.userId}
                                              </Table.Cell>
                                              <Table.Cell align={'left'}>
                                                  {k.createdAt}
                                              </Table.Cell>
                                              <Table.Cell align={'right'}>
                                                  <IconButton
                                                      title="Delete"
                                                      onClick={() => {
                                                          //   DeleteAPIKey(
                                                          //       k.primaryId,
                                                          //   );
                                                          setIsDeleteModalOpen(
                                                              k.userName,
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
                {savedConnections.length === 0 && (
                    <MessageDiv>
                        No Sheet Connections to display at this time
                        <br />
                        Click Add User to save a new sheet COnnection.
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
                            onSubmit={handleSubmit(SaveSheetData)}
                            className="my-jira-profile-page__generate-key-form"
                        >
                            <Stack direction="column" spacing={2}>
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
            <Modal onClose={close} open={isDeleteModalOpen !== ''}>
                <Modal.Content>
                    <Modal.Title>Delete Job</Modal.Title>
                    <Typography variant="body1">
                        {`Are you sure you want to delete the ${isDeleteModalOpen} connection.This action is permanent.`}
                    </Typography>
                    <Modal.Actions>
                        <Button
                            variant="text"
                            onClick={() => setIsDeleteModalOpen('')}
                            data-testid={'delete-job-cancel-btn'}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={() => DeleteConnection(isDeleteModalOpen)}
                            data-testid={'delete-job-delete-btn'}
                        >
                            Delete
                        </Button>
                    </Modal.Actions>
                </Modal.Content>
            </Modal>
            {isLoading && <StyledProgress />}
        </Stack>
    );
};
