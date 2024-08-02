import {
    Typography,
    styled,
    IconButton,
    Button,
    Stack,
    Grid,
    TextField,
} from '@semoss/ui';
import { usePixel, useRootStore } from '@/hooks';
import { useEffect, useState, useReducer } from 'react';
import {
    PlayArrowRounded,
    UploadRounded,
    CloseOutlined,
    Add,
} from '@mui/icons-material';

const StyleMainContentContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    backgroundColor: '#EDEDED',
    borderRadius: '8px',
    padding: '24px',
    overflowY: 'scroll',
    position: 'relative',
}));

const StyledGoalContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: '16px 24px 16px 24px',
}));

const StyledListItemContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    backgroundColor: '#D9D9D9',
    borderRadius: '8px',
    padding: '16px 24px 16px 24px',
    marginTop: '10px',
    marginLeft: '0px !important',
}));

const StyledListItemAction = styled('div')(({ theme }) => ({
    paddingLeft: '24px',
}));

const StyledOuterGrid = styled(Grid)(() => ({
    width: '100% !important',
    marginLeft: '0 !important',
}));

const StyledTaskExecutionGrid = styled(Grid)(() => ({
    width: '100% !important',
    marginLeft: '0 !important',
}));

const StyledTaskExecutionContainer = styled('div')(({ theme }) => ({
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    padding: '16px 24px 16px 24px',
    marginTop: '10px',
    marginLeft: '0px !important',
}));

//TEST DATA SECTION
const TASK = {
    task: 'Soldier Service Level Information', // App Description
    app: {
        variables: {
            DB: {
                to: 'database--820',
                type: 'database',
                isInput: true,
            },
            soldier_name: {
                to: 'input--2178',
                type: 'block',
                isInput: true,
            },
            service_level_info: {
                to: 'pull_soldier_details',
                type: 'cell',
                cellId: '21756',
                isOutput: true,
            },
            soldier_service_number: {
                to: 'input--9821',
                type: 'block',
                isInput: true,
            },
            soldier_branch_of_service: {
                to: 'input--9821',
                type: 'block',
                isInput: true,
            },
            soldier_date_of_service: {
                to: 'input--9821',
                type: 'block',
                isInput: true,
            },
            json: {
                to: 'JSON--7633',
                type: 'JSON',
            },
            array: {
                to: 'array--4834',
                type: 'array',
            },
        },
        dependencies: {
            'database--820': '61b2d7c0-5dd4-4ea9-bc6e-9f39f2ae8d7a',
            'string--75': 'This is a string variable',
            'model--1476': '001510f8-b86e-492e-a7f0-41299775e7d9',
            'JSON--7633': {
                a: 'this is a label for a',
            },
            'array--4834': [1, 2],
        },
    },
};

const TASK_2 = {
    task: 'Check soldiers eligibility based on service level info', // App Description
    app: {}, // We allow user to create app with Drag and Drop. To take in service level info
};

const list_of_tasks = [TASK, TASK_2];
//END OF TEST DATA SECTION

export const AIConductorTasklist = (props) => {
    const { prompt } = props;
    const { configStore, monolithStore } = useRootStore();
    // const [state, dispatch] = useReducer(reducer, initialState);
    // const { taskList } = state;
    const [taskList, setTaskList] = useState([]);
    const [taskToExecute, setTaskToExecute] = useState<any>({});
    const [taskInputKeys, setTaskInputKeys] = useState([]);

    //Make service call using prompt
    useEffect(() => {
        //Send prompt to backendAPI
        if (prompt != null && prompt != '') {
            //handle return response
            setTaskList(list_of_tasks);
        }
    }, [prompt]);

    const removeListItem = (toRemove) => {
        setTaskList(taskList.filter((a) => a.task !== toRemove.task));
    };

    const executeTask = (task, i) => {
        task.index = i + 1;
        if (task.app && task.app.variables) {
            setTaskInputKeys(Object.keys(task.app.variables));
        }
        setTaskToExecute(task);
    };

    return (
        <StyleMainContentContainer>
            <Grid
                container
                spacing={1}
                justifyContent="space-between"
                alignItems="center"
            >
                <Grid item xs={prompt ? 11 : 12}>
                    <StyledGoalContainer>
                        {prompt ? (
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                spacing={0.5}
                                minHeight="32px"
                            >
                                <Typography variant={'body1'}>Goal:</Typography>
                                <Typography align={'left'} variant={'body1'}>
                                    {prompt}
                                </Typography>
                                <Button
                                    variant="outlined"
                                    color="inherit"
                                    startIcon={<PlayArrowRounded />}
                                >
                                    Run All
                                </Button>
                            </Stack>
                        ) : (
                            <Typography variant={'body1'}>
                                Define your goal and AI Conductor will help you
                                compose tasks to solve it!
                            </Typography>
                        )}
                    </StyledGoalContainer>
                </Grid>
                <Grid item xs={1}>
                    <StyledListItemAction>
                        {prompt ? (
                            <IconButton>
                                <UploadRounded />
                            </IconButton>
                        ) : null}
                    </StyledListItemAction>
                </Grid>

                {taskList && taskList.length > 0
                    ? taskList.map((task, i) => {
                          return (
                              <StyledOuterGrid
                                  key={i}
                                  container
                                  spacing={1}
                                  justifyContent="space-between"
                                  alignItems="center"
                              >
                                  <Grid item xs={11}>
                                      <StyledListItemContainer>
                                          <Stack
                                              direction="row"
                                              alignItems="center"
                                              justifyContent="space-between"
                                              spacing={0.5}
                                              minHeight="32px"
                                          >
                                              <Typography variant={'body1'}>
                                                  Task {i + 1} Added:
                                              </Typography>
                                              <Typography
                                                  align={'left'}
                                                  variant={'body1'}
                                              >
                                                  {task.task}
                                              </Typography>
                                              <IconButton
                                                  onClick={() => {
                                                      executeTask(task, i);
                                                  }}
                                              >
                                                  <PlayArrowRounded />
                                              </IconButton>
                                          </Stack>
                                      </StyledListItemContainer>
                                  </Grid>
                                  <Grid item xs={1}>
                                      <StyledListItemAction>
                                          <IconButton
                                              onClick={() => {
                                                  removeListItem(task);
                                              }}
                                          >
                                              <CloseOutlined />
                                          </IconButton>
                                      </StyledListItemAction>
                                  </Grid>
                              </StyledOuterGrid>
                          );
                      })
                    : null}
                {taskToExecute.task ? (
                    <StyledTaskExecutionGrid
                        container
                        spacing={1}
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Grid item xs={11}>
                            <StyledTaskExecutionContainer>
                                <Stack
                                    direction="row"
                                    alignItems="flex-start"
                                    justifyContent="space-between"
                                    spacing={0.5}
                                    minHeight="100px"
                                >
                                    <Typography variant={'body1'}>
                                        Executing Task {taskToExecute.index}:
                                    </Typography>
                                    <Typography
                                        align={'left'}
                                        variant={'body1'}
                                    >
                                        {taskToExecute.task}
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        color="inherit"
                                        startIcon={<Add />}
                                    >
                                        Assign Task to User
                                    </Button>
                                </Stack>
                                {taskToExecute.app && taskInputKeys.length > 0
                                    ? taskInputKeys.map((inputKey, i) => {
                                          return (
                                              <Grid item xs={12}>
                                                  {taskToExecute.app.variables[
                                                      inputKey
                                                  ].isInput &&
                                                  taskToExecute.app.variables[
                                                      inputKey
                                                  ].isInput == true ? (
                                                      <TextField
                                                          focused={false}
                                                          label={inputKey}
                                                          variant={'outlined'}
                                                          sx={{ width: '100%' }}
                                                      ></TextField>
                                                  ) : null}
                                              </Grid>
                                          );
                                      })
                                    : null}
                            </StyledTaskExecutionContainer>
                        </Grid>
                        <Grid item xs={1}>
                            <StyledListItemAction>
                                <IconButton>
                                    <CloseOutlined />
                                </IconButton>
                            </StyledListItemAction>
                        </Grid>
                    </StyledTaskExecutionGrid>
                ) : null}
            </Grid>
        </StyleMainContentContainer>
    );
};
