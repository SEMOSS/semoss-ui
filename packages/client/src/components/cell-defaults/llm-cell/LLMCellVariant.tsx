import { Variant } from '@/stores';
import {
    styled,
    Typography,
    Select,
    Stack,
    TextField,
    Slider,
} from '@semoss/ui';

const StyledTextField = styled(TextField)(({ theme }) => ({
    maxWidth: theme.spacing(9),
}));

export interface LLMCellVariantProps {
    allModels: { name: string; id: string }[];
    variantName: string;
    variant: Variant;
}

export const LLMCellVariant = (props: LLMCellVariantProps) => {
    const { allModels, variantName, variant } = props;

    const handleModelChange = (value) => {
        // TODO
    };

    const handleModelParamsChange = (value, name) => {
        // TODO
    };

    return (
        <Stack gap={2} direction="column">
            <Typography variant="subtitle2">
                {variantName.toLowerCase() === 'default'
                    ? 'Default Variant'
                    : `Variant ${variantName}`}
            </Typography>

            <Stack gap={1} direction="column">
                <Typography variant="body2">Select Model</Typography>

                <Select
                    value={variant.model.id}
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
                </Select>
            </Stack>

            <Stack gap={1} direction="column">
                <Typography variant="body2">Top P</Typography>

                <Stack gap={2} direction="row" justifyContent="center">
                    <Slider
                        onChange={(e) =>
                            handleModelParamsChange(e.target.value, 'topP')
                        }
                        value={variant.model.topP}
                        min={0}
                        max={1}
                        step={0.1}
                        marks={[
                            { value: 0, label: '0' },
                            { value: 1, label: '1' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <StyledTextField
                        type="number"
                        onChange={(e) =>
                            handleModelParamsChange(e.target.value, 'topP')
                        }
                        value={variant.model.topP}
                    />
                </Stack>
            </Stack>

            <Stack gap={1} direction="column">
                <Typography variant="body2">Temperature</Typography>

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
                        marks={[
                            { value: 0, label: '0' },
                            { value: 1, label: '1' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <StyledTextField
                        type="number"
                        onChange={(e) =>
                            handleModelParamsChange(
                                e.target.value,
                                'temperature',
                            )
                        }
                        value={variant.model.temperature}
                    />
                </Stack>
            </Stack>

            <Stack gap={1} direction="column">
                <Typography variant="body2">Token Length</Typography>

                <Stack gap={2} direction="row" justifyContent="center">
                    <Slider
                        onChange={(e) =>
                            handleModelParamsChange(e.target.value, 'length')
                        }
                        value={variant.model.length}
                        min={0}
                        max={1}
                        step={0.1}
                        marks={[
                            { value: 0, label: '0' },
                            { value: 1024, label: '1024' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <StyledTextField
                        type="number"
                        onChange={(e) =>
                            handleModelParamsChange(e.target.value, 'length')
                        }
                        value={variant.model.length}
                    />
                </Stack>
            </Stack>
        </Stack>
    );
};
