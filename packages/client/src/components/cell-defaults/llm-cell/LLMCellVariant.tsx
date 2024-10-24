import { ActionMessages } from '@/stores';
import { Close } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Typography,
    Select,
    Stack,
    TextField,
    Slider,
    IconButton,
} from '@semoss/ui';
import { useBlocks } from '@/hooks';

const StyledContent = styled('div')(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
    borderRadius: theme.spacing(1.5),
    minWidth: '326px',
}));

const StyledModelLabel = styled(Stack)(({ theme }) => ({
    marginBottom: theme.spacing(1),
    height: '34px',
}));

const StyledSelect = styled(Select)(({ theme }) => ({
    width: '100%',
}));

const StyledField = styled('div')(({ theme }) => ({
    paddingBottom: theme.spacing(1),
    wdith: '100%',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    maxWidth: theme.spacing(9),
}));

export interface LLMCellVariantProps {
    allModels: { name: string; id: string }[];
    variantName: string;
    cell: any;
}

export const LLMCellVariant = observer((props: LLMCellVariantProps) => {
    const { allModels, variantName, cell } = props;
    const variant = cell.parameters.variants[variantName];
    const { state } = useBlocks();
    const isDefault = variantName.toLowerCase() === 'default';

    const handleModelChange = (id) => {
        const match = allModels.find((model) => model.id === id);
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: `parameters.variants.${variantName}.model`,
                value: {
                    ...variant.model,
                    id: id,
                    name: match.name,
                },
            },
        });
    };

    const handleModelParamsChange = (value, name) => {
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: `parameters.variants.${variantName}.model.${name}`,
                value: value,
            },
        });
    };

    const handleDeleteVariant = () => {
        const variantsCopy = { ...cell.parameters.variants };
        delete variantsCopy[variantName];
        state.dispatch({
            message: ActionMessages.UPDATE_CELL,
            payload: {
                queryId: cell.query.id,
                cellId: cell.id,
                path: `parameters.variants`,
                value: variantsCopy,
            },
        });
    };

    return (
        <StyledContent>
            <StyledModelLabel
                alignItems="center"
                gap={1}
                justifyContent="space-between"
                direction="row"
            >
                <Typography color="secondary" variant="body2">
                    {isDefault
                        ? 'Select Default Variant Model'
                        : `Select Variant ${variantName.toUpperCase()} Model`}
                </Typography>

                {!isDefault && (
                    <IconButton size="small" onClick={handleDeleteVariant}>
                        <Close />
                    </IconButton>
                )}
            </StyledModelLabel>

            <StyledField>
                <StyledSelect
                    value={variant.model.id}
                    size="small"
                    onChange={(e) => {
                        handleModelChange(e.target.value);
                    }}
                >
                    {allModels.map((model, idx) => (
                        <Select.Item
                            key={`${model.name}-${idx}`}
                            value={model.id}
                        >
                            {model.name}
                        </Select.Item>
                    ))}
                </StyledSelect>
            </StyledField>

            <StyledField>
                <Typography color="secondary" variant="body2">
                    Top P
                </Typography>

                <Stack gap={2} direction="row" justifyContent="center">
                    <Slider
                        onChange={(e) =>
                            handleModelParamsChange(e.target.value, 'topP')
                        }
                        value={variant.model.topP}
                        min={0}
                        max={1}
                        step={0.1}
                        size="small"
                        marks={[
                            { value: 0, label: '0' },
                            { value: 1, label: '1' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <StyledTextField
                        type="number"
                        size="small"
                        onChange={(e) =>
                            handleModelParamsChange(e.target.value, 'topP')
                        }
                        value={variant.model.topP}
                    />
                </Stack>
            </StyledField>

            <StyledField>
                <Typography color="secondary" variant="body2">
                    Temperature
                </Typography>

                <Stack gap={2} direction="row" justifyContent="center">
                    <Slider
                        onChange={(e) =>
                            handleModelParamsChange(
                                e.target.value,
                                'temperature',
                            )
                        }
                        value={variant.model.temperature}
                        min={0}
                        max={1}
                        step={0.1}
                        size="small"
                        marks={[
                            { value: 0, label: '0' },
                            { value: 1, label: '1' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <StyledTextField
                        type="number"
                        size="small"
                        onChange={(e) =>
                            handleModelParamsChange(
                                e.target.value,
                                'temperature',
                            )
                        }
                        value={variant.model.temperature}
                    />
                </Stack>
            </StyledField>

            <StyledField>
                <Typography color="secondary" variant="body2">
                    Token Length
                </Typography>

                <Stack gap={2} direction="row" justifyContent="center">
                    <Slider
                        onChange={(e) =>
                            handleModelParamsChange(e.target.value, 'length')
                        }
                        value={variant.model.length}
                        min={0}
                        max={1024}
                        step={1}
                        size="small"
                        marks={[
                            { value: 0, label: '0' },
                            { value: 1024, label: '1024' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <StyledTextField
                        type="number"
                        size="small"
                        onChange={(e) =>
                            handleModelParamsChange(e.target.value, 'length')
                        }
                        value={variant.model.length}
                    />
                </Stack>
            </StyledField>
        </StyledContent>
    );
});
