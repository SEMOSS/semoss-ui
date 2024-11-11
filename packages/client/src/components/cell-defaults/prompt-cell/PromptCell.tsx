import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Stack,
    TextField,
    Button,
    Typography,
    useNotification,
    Checkbox,
    Tooltip,
} from '@semoss/ui';
import { ActionMessages, CellComponent, CellDef } from '@/stores';
import { useBlocks, useRootStore } from '@/hooks';
import { Add } from '@mui/icons-material';

export interface PromptCellDef extends CellDef<'prompt'> {
    widget: 'prompt';
    parameters: {
        id: string;
        prompt: string;
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
    const id = cell.parameters.id;
    const prompt = cell.parameters.prompt;
    const [boundStateCheck, setBoundStateCheck] = useState(true);

    useEffect(() => {
        //fetchAllModels();
    }, []);

    // const fetchAllModels = async () => {
    //     const pixel = `MyEngines(engineTypes=["MODEL"])`;
    //     const res = await monolithStore.runQuery(pixel);

    //     const modelled = res.pixelReturn[0].output.map((model) => {
    //         return {
    //             name: model.database_name,
    //             id: model.database_id,
    //         };
    //     });
    //     setAllModels(modelled);
    // };

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

    console.log('test');

    return (
        <StyledStack direction="row" spacing={1}>
            <TextField
                value={prompt}
                label={'Prompt'}
                multiline={true}
                rows={2}
                fullWidth
                onChange={(e) => {
                    handleChange(e.target.value, 'parameters.prompt');
                }}
            />
            <Stack direction="row" sx={{ paddingLeft: '10px' }}>
                <Tooltip title={'Use bound state'}>
                    <StyledCheckbox
                        checked={boundStateCheck}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const value = e.target.checked;
                            setBoundStateCheck(value);
                        }}
                    />
                </Tooltip>
            </Stack>
        </StyledStack>
    );
});
