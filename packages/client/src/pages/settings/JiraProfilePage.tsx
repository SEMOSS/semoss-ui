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
    Autocomplete
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import { useState, useEffect } from 'react';
import { DeleteKeyModal } from './DeleteKeyModal';

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

interface SaveAPIKeyForm {
    APIKEY: string;
    USERID: string;
    URL: string;
    NAME: string;
    PROJECTS: string;
}

export const JiraProfilePage = () => {
    const notification = useNotification();
    const { monolithStore } = useRootStore();

    const [addModal, setAddModal] = useState(false);
    const [savedApiKeys, setSavedApiKeys] = useState([]);
    const [deleteApiKey, setDeleteApiKey] = useState({});
    const [projectsData, setProjectsData] = useState([]);

    const { getValues,control, reset, handleSubmit } = useForm<SaveAPIKeyForm>({
        defaultValues: {
            APIKEY: '',
            USERID: '',
            URL: '',
            NAME: '',
            PROJECTS: '',
        },
    });

    const escapePixelString = (str: string) => {
        if (typeof str !== 'string') return '';
        return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\"/g, '\\"');
    }

    useEffect(() => {
        getSavedApiKeysQuery();
    }, []);

    const getSavedApiKeysQuery = async () => {
        const pixel = `META | JiraGetApiKeys()`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                if (!response.pixelReturn?.length) {
                    throw new Error("Empty response from Jira Pixel call");
                }
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output;
                if (type.indexOf('ERROR') === -1 ) {
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
        const safeUserId = escapePixelString(data.USERID);
        const safeApiKey = escapePixelString(data.APIKEY);
        const safeUrl = escapePixelString(data.URL);
        const safeName = escapePixelString(data.NAME);
        const safeProject = escapePixelString(data.PROJECTS);
        const pixel = `META | JiraInsertApikey(userid="${safeUserId}",apikey="${safeApiKey}",url="${safeUrl}",keyname="${safeName}",project="${safeProject}")`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                if (!response.pixelReturn?.length) {
                    throw new Error("Empty response from Jira Pixel call");
                }
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output.success;
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

    const DeleteAPIKey = async (keyName: string) => {
        const safeKeyName = escapePixelString(keyName);
        const pixel = `META | JiraDeleteApiKey(keyname="${safeKeyName}")`;
        monolithStore
            .runQuery(pixel)
            .then((response) => {
                if (!response.pixelReturn?.length) {
                    throw new Error("Empty response from Jira Pixel call");
                }
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output.success;
                if (type.indexOf('ERROR') === -1 && output === true)
 {
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

    const getProjectsData = async () => {
        const projectDetails = getValues();
        const pixelCommand = `META | JiraGetProjects(url="${escapePixelString(projectDetails.URL)}",userid="${escapePixelString(projectDetails.USERID)}",apikey="${escapePixelString(projectDetails.APIKEY)}")`;
        monolithStore
            .runQuery(pixelCommand)
            .then((response) => {
                if (!response.pixelReturn?.length) {
                    throw new Error("Empty response from Jira Pixel call");
                }
                const type = response.pixelReturn[0].operationType;
                const output = response.pixelReturn[0].output;
                if (type.indexOf('ERROR') === -1) {
                    setProjectsData(output);
                    notification.add({
                        color: 'success',
                        message: 'Successfully fetched the projects.',
                    });
                } else {
                    throw new Error(output);
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
                                    Last Used
                                </HeaderCell>
                                <HeaderCell align={'left'}>User Id</HeaderCell>
                                <RightHeaderCell>&nbsp;</RightHeaderCell>
                            </Table.Row>
                        </Table.Head>
                        <Table.Body>
                            {savedApiKeys.length !== 0
                                ? savedApiKeys.map((k, idx) => {
                                      return (
                                          <Table.Row key={idx}>
                                              <Table.Cell align={'left'}>
                                                  {k.keyName}
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
                                                      onClick={() =>
                                                          setDeleteApiKey(k)
                                                      }
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

                                <Button
                                        type="button"
                                        variant={'outlined'}
                                        color="primary"
                                        data-testid={
                                            'my-jira-profile-page-generate-btn'
                                        }
                                        onClick={getProjectsData}
                                    >
                                        Get Projects
                                </Button>

                                <Controller
                                    name="PROJECTS"
                                    control={control}
                                    rules={{ required: true }}
                                    render={({ field }) => (
                                        <Stack spacing={1}>
                                            <Autocomplete
                                                options={projectsData || []}
                                                getOptionLabel={(option) => option}
                                                multiple={false}
                                                value={field.value}
                                                onChange={(event, newValue) => {
                                                    field.onChange(newValue);

                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        label="Projects"
                                                        fullWidth
                                                    />
                                                )}
                                            />
                                        </Stack>
                                    )}
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
            <DeleteKeyModal
                isOpen={deleteApiKey}
                close={() => {
                    setDeleteApiKey('');
                }}
                deleteJob={() => {
                    DeleteAPIKey(deleteApiKey['keyName']);
                    setDeleteApiKey('');
                }}
            />
        </Stack>
    );
};