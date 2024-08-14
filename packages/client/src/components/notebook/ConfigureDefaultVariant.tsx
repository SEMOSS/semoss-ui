import { useState, useEffect } from 'react';
import {
    styled,
    Typography,
    Select,
    Stack,
    Slider,
    TextField,
    Button,
    useNotification,
} from '@semoss/ui';
import { modelEngineOutput } from '../block-defaults/llm-comparison-block/LlmComparison.utility';
import { useRootStore, useBlocks } from '@/hooks';
import { Add } from '@mui/icons-material';
import { ActionMessages, Variant, VariantModel } from '@/stores';

const StyledContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    height: '100%',
    width: '100%',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    maxWidth: theme.spacing(9),
}));

const emptyModel = {
    id: '',
    name: '',
    topP: 0,
    temperature: 0,
    length: 0,
};

export const ConfigureDefaultVariant = () => {
    const { monolithStore } = useRootStore();
    const { state } = useBlocks();
    const notification = useNotification();
    const [allModels, setAllModels] = useState([]);
    const [variant, setVariant] = useState<Variant>({
        to: '',
        models: [{ ...emptyModel }],
    });

    useEffect(() => {
        fetchAllModels();

        if (state.variants['default']) {
            setVariant(state.variants['default']);
        }
    }, []);

    const fetchAllModels = async () => {
        const pixel = `MyEngines(engineTypes=["MODEL"])`;
        const res = await monolithStore.runQuery(pixel);

        const modelled = modelEngineOutput(res.pixelReturn[0].output);
        setAllModels(modelled);
    };

    const handleUpdateModel = (val: string, idx: number) => {
        const newVariant = { ...variant };
        const currModel = variant.models[idx];
        const newModel = allModels.find((model) => model.value === val);

        // Build updated model, and maintain any configured settings.
        newVariant.models[idx] = {
            id: val,
            name: newModel.database_name,
            topP: currModel.topP,
            temperature: currModel.temperature,
            length: currModel.length,
        };
        setVariant(newVariant);
    };

    const handleUpdateModelSettings = (
        key: string,
        idx: number,
        val: number,
    ) => {
        const newVariant = { ...variant };
        newVariant.models[idx][key] = val;
        setVariant(newVariant);
    };

    const handleAddModel = () => {
        const newVariant = { ...variant };
        newVariant.models.push({ ...emptyModel });
        setVariant(newVariant);
    };

    const handleDeleteModel = (idx: number) => {
        // TODO
    };

    const handleSaveVariant = () => {
        const success = state.dispatch({
            message: ActionMessages.ADD_VARIANT,
            payload: {
                id: 'default',
                variant,
            },
        });

        notification.add({
            color: success ? 'success' : 'error',
            message: success
                ? `Successfully saved your Default Variant`
                : `Unable to save your Default Variant, due to syntax or a duplicated alias`,
        });
    };

    return (
        <StyledContainer>
            <Typography variant="h5">Default Variant</Typography>

            {variant.models.map((model: VariantModel, idx: number) => (
                <Stack key={`model-${idx}`} spacing={2}>
                    <Typography variant="body2" color="secondary">
                        Select Model
                    </Typography>
                    <Select
                        value={model.id}
                        onChange={(e) => handleUpdateModel(e.target.value, idx)}
                    >
                        {allModels.map((model, idx) => (
                            <Select.Item
                                key={`option-${model.value}-${idx}`}
                                value={model.value}
                            >
                                {model.database_name}
                            </Select.Item>
                        ))}
                    </Select>

                    <Typography variant="body2" color="secondary">
                        Top P
                    </Typography>
                    <Stack gap={2} direction="row" justifyContent="center">
                        <Slider
                            onChange={(e) =>
                                handleUpdateModelSettings(
                                    'topP',
                                    idx,
                                    e.target.value,
                                )
                            }
                            value={model.topP ? model.topP : 0}
                            min={0}
                            max={1}
                            step={0.1}
                            marks={[
                                { value: 0, label: '0' },
                                { value: 1, label: '1' },
                            ]}
                            valueLabelDisplay="auto"
                            disabled={!model.id}
                        />
                        <StyledTextField
                            type="number"
                            onChange={(e) =>
                                handleUpdateModelSettings(
                                    'topP',
                                    idx,
                                    Number(e.target.value) || 0,
                                )
                            }
                            value={model.topP ? model.topP : 0}
                            disabled={!model.id}
                        />
                    </Stack>

                    <Typography variant="body2" color="secondary">
                        Temperature
                    </Typography>
                    <Stack gap={2} direction="row" justifyContent="center">
                        <Slider
                            onChange={(e) =>
                                handleUpdateModelSettings(
                                    'temperature',
                                    idx,
                                    e.target.value,
                                )
                            }
                            value={model.temperature ? model.temperature : 0}
                            min={0}
                            max={1}
                            step={0.1}
                            marks={[
                                { value: 0, label: '0' },
                                { value: 1, label: '1' },
                            ]}
                            valueLabelDisplay="auto"
                            disabled={!model.id}
                        />
                        <StyledTextField
                            type="number"
                            onChange={(e) =>
                                handleUpdateModelSettings(
                                    'temperature',
                                    idx,
                                    Number(e.target.value) || 0,
                                )
                            }
                            value={model.temperature ? model.temperature : 0}
                            disabled={!model.id}
                        />
                    </Stack>

                    <Typography variant="body2" color="secondary">
                        Token Length
                    </Typography>
                    <Stack gap={2} direction="row" justifyContent="center">
                        <Slider
                            onChange={(e) =>
                                handleUpdateModelSettings(
                                    'length',
                                    idx,
                                    e.target.value,
                                )
                            }
                            value={model.length ? model.length : 0}
                            min={0}
                            max={1024}
                            step={1}
                            marks={[
                                { value: 0, label: '0' },
                                { value: 1024, label: '1' },
                            ]}
                            valueLabelDisplay="auto"
                            disabled={!model.id}
                        />
                        <StyledTextField
                            type="number"
                            onChange={(e) =>
                                handleUpdateModelSettings(
                                    'length',
                                    idx,
                                    Number(e.target.value) || 0,
                                )
                            }
                            value={model.length ? model.length : 0}
                            disabled={!model.id}
                        />
                    </Stack>
                </Stack>
            ))}

            <Button
                onClick={handleAddModel}
                variant="text"
                startIcon={<Add />}
                disabled={variant.models.length > 2}
            >
                Add Model
            </Button>

            <div>
                <Button variant="text" color="secondary">
                    Reset
                </Button>
                <Button onClick={handleSaveVariant}>Save Variant</Button>
            </div>
        </StyledContainer>
    );
};
