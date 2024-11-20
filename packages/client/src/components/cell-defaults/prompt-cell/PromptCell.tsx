import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    TextField,
    Button,
    useNotification,
    Checkbox,
    Tooltip,
    Select,
    FormControl,
} from '@semoss/ui';
import { ActionMessages, CellComponent, CellDef } from '@/stores';
import { useBlocks, useRootStore } from '@/hooks';
import { Add } from '@mui/icons-material';

export interface PromptCellDef extends CellDef<'prompt'> {
    widget: 'prompt';
    parameters: {
        id: string;
        prompt: string;
        boundState: boolean;
    };
}

type ModelEngine = {
    name: string;
    databaseId: string;
    topP: number;
    temperature: number;
    length: number;
};

const StyledStack = styled(Stack)(({ theme }) => ({
    width: '100%',
    marginTop: '20px',
}));

const StyledActionButtons = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(1),
}));

const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
    position: 'relative',
    width: '100%',
}));

export const PromptCell: CellComponent<PromptCellDef> = observer((props) => {
    const { state } = useBlocks();
    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const { cell } = props;
    const [id, setId] = useState(cell.parameters.id);
    const [prompt, setPrompt] = useState(cell.parameters.prompt);
    const [boundStateCheck, setBoundStateCheck] = useState(
        cell.parameters.boundState,
    );
    const [allPrompts, setAllPrompts] = useState([]);

    useEffect(() => {
        init();
    }, [allPrompts]);

    useEffect(() => {
        //pull the prompt by the id if boundState is checked
        //replace prompt
        if (id && boundStateCheck) {
            monolithStore
                .runQuery("GetPrompt('" + id + "')")
                .then((response) => {
                    const { output } = response.pixelReturn[0];
                    if (output.CONTEXT) {
                        setId(id);
                        setPrompt(output.CONTEXT);
                    }
                });
        }
    }, [boundStateCheck, id]);

    const init = () => {
        if (allPrompts.length === 0) {
            monolithStore.runQuery('ListPrompt()').then((response) => {
                const { output } = response.pixelReturn[0];
                if (output.length > 0) {
                    const promptArr = [];
                    output.map((prompt) => {
                        if (prompt.ID) {
                            promptArr.push({
                                context: prompt.CONTEXT ? prompt.CONTEXT : '',
                                created_by: prompt.CREATED_BY
                                    ? prompt.CREATED_BY
                                    : '',
                                date_created: prompt.DATE_CREATED
                                    ? prompt.DATE_CREATED
                                    : '',
                                id: prompt.ID ? prompt.ID : '',
                                intent: prompt.INTENT ? prompt.INTENT : '',
                                title: prompt.TITLE ? prompt.TITLE : '',
                                tags: prompt.tags ? prompt.tags : [],
                            });
                        }
                    });
                    setAllPrompts(promptArr);
                }
            });
        }
    };

    const handleChange = (newValue, path) => {
        if (cell.isLoading) {
            return;
        }

        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: path,
                value: newValue,
            },
        });
    };

    return (
        <div>
            <Stack direction="row" spacing={1}>
                <FormControl>
                    <Select
                        value={id ? id : ''}
                        onChange={(e) => {
                            console.log(e);
                            setId(e.target.value);
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.id',
                                    value: e.target.value,
                                },
                            });
                        }}
                    >
                        {allPrompts.map((prompt, idx) => (
                            <Select.Item
                                key={`${prompt.id}-${idx}`}
                                value={prompt.id}
                            >
                                {prompt.title}
                            </Select.Item>
                        ))}
                    </Select>
                </FormControl>
            </Stack>
            <StyledStack direction="row" spacing={1}>
                <TextField
                    value={prompt}
                    label={'Prompt'}
                    multiline={true}
                    rows={2}
                    fullWidth
                    onChange={(e) => {
                        setPrompt(e.target.value);
                        state.dispatch({
                            message: ActionMessages.UPDATE_CELL,
                            payload: {
                                queryId: cell.query.id,
                                cellId: cell.id,
                                path: 'parameters.prompt',
                                value: e.target.value,
                            },
                        });
                    }}
                />
                <Stack direction="row" sx={{ paddingLeft: '10px' }}>
                    <Tooltip
                        title={
                            'Checking this box will overwrite the prompt with what is currently stored in the database'
                        }
                    >
                        <StyledCheckbox
                            checked={boundStateCheck}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => {
                                const value = e.target.checked;
                                setBoundStateCheck(value);
                                state.dispatch({
                                    message: ActionMessages.UPDATE_CELL,
                                    payload: {
                                        queryId: cell.query.id,
                                        cellId: cell.id,
                                        path: 'parameters.boundState',
                                        value: value,
                                    },
                                });
                            }}
                        />
                    </Tooltip>
                </Stack>
            </StyledStack>
        </div>
    );
});
