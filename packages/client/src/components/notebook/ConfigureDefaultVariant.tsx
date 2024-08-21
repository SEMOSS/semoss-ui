import { useState, useEffect } from 'react';
import { toJS } from 'mobx';
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
import { Add, Close } from '@mui/icons-material';
import { ActionMessages, Variant, VariantModel } from '@/stores';

const StyledContainer = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    height: '100%',
    width: '100%',
    overflowY: 'scroll',
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

/**
 * TODO / thoughts
 * 1. Tie the variant's config to a cell for the appropriately populated query.
 *    May want to tailor the cell's functionality to meet this feature's limitations.
 * 2. make this work for any variant (not just the default).
 * 3. Flesh out layout so that the Variant's menu and page layout can work similar to the query sheets and a user can view/edit any of their variants.
 * 4. more on (3); will the user have to re-run a variant modification similar to re-runnign a query if its changed? Maybe not, will need to figure this out.
 */
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
        const variants = toJS(state.variants);

        if (variants['default']) {
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
        const newVariant = { ...variant };
        newVariant.models.splice(idx, 1);
        setVariant(newVariant);
    };

    const handleSaveVariant = () => {
        let success = false;

        const currDefault = toJS(state.variants)['default'];
        if (!currDefault) {
            success = state.dispatch({
                message: ActionMessages.ADD_VARIANT,
                payload: {
                    id: 'default',
                    variant,
                },
            });
        } else {
            success = state.dispatch({
                message: ActionMessages.EDIT_VARIANT,
                payload: {
                    id: 'default',
                    from: currDefault,
                    to: variant,
                },
            });
        }

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

                    <div>
                        <Button
                            onClick={() => handleDeleteModel(idx)}
                            variant="text"
                            startIcon={<Close />}
                        >
                            Delete Model
                        </Button>
                    </div>
                </Stack>
            ))}

            <div>
                <Button variant="text" color="secondary">
                    Reset
                </Button>
                <Button
                    onClick={handleAddModel}
                    variant="text"
                    startIcon={<Add />}
                    disabled={variant.models.length > 2}
                >
                    Add Model
                </Button>
                <Button variant="contained" onClick={handleSaveVariant}>
                    Save Variant
                </Button>
            </div>
        </StyledContainer>
    );
};