import { useMemo, useState } from 'react';
import { Builder } from '../../prompt.types';
import { StyledStepPaper } from '../../prompt.styled';
import { createFilterOptions, Autocomplete } from '@mui/material';
import {
    styled,
    Box,
    Grid,
    Stack,
    TextField,
    Typography,
} from '@/component-library';
import { PromptLibraryDialogButton } from '../../library/PromptLibraryDialogButton';
import { usePixel } from '@/hooks';
import { PromptBuilderContextTestDialogButton } from './PromptBuilderContextTestDialogButton';

type CfgLibraryEngineState = {
    loading: boolean;
    ids: string[];
    display: object;
};
const InitialCfgLibraryEngineState: CfgLibraryEngineState = {
    loading: true,
    ids: [],
    display: {},
};

const StyledContainerGrid = styled(Grid)(({ theme }) => ({
    marginTop: theme.spacing(3),
}));

export const PromptBuilderContextStep = (props: {
    builder: Builder;
    setBuilderValue: (builderStepKey: string, value: string | string[]) => void;
}) => {
    const [cfgLibraryModels, setCfgLibraryModels] = useState(
        InitialCfgLibraryEngineState,
    );
    const filter = createFilterOptions<string>();

    const isPromptLibraryDisabled =
        !props.builder.model.value || !props.builder.title.value;

    const isPromptContextTestDisabled =
        !props.builder.model.value || !props.builder.context.value;

    const myModels = usePixel<
        { app_id: string; app_name: string; tag: string }[]
    >(`MyEngines(engineTypes=['MODEL']);`);
    useMemo(() => {
        if (myModels.status !== 'SUCCESS') {
            return;
        }

        let modelIds: string[] = [];
        let modelDisplay = {};
        myModels.data.forEach((model) => {
            // embeddings models are not set up for response generation
            if (model.tag !== 'embeddings') {
                modelIds.push(model.app_id);
                modelDisplay[model.app_id] = model.app_name;
            }
        });
        setCfgLibraryModels({
            loading: false,
            ids: modelIds,
            display: modelDisplay,
        });
    }, [myModels.status, myModels.data]);

    return (
        <StyledStepPaper elevation={2} square>
            <Box>
                <Typography variant="h5">Create Prompt</Typography>
                <Typography variant="body1">
                    Construct your prompt by providing the context and inputs.
                    The context provides supplementary information so the model
                    can better understand the ask and generate a more tailored
                    response.
                </Typography>
            </Box>
            <StyledContainerGrid container direction="row">
                <Grid item xs={4}>
                    <Typography variant="body1">Prompt Details</Typography>
                </Grid>
                <Grid item xs={8}>
                    <Stack direction="column" spacing={2}>
                        <TextField
                            label="Name"
                            variant="outlined"
                            value={props.builder.title.value ?? ''}
                            onChange={(e) =>
                                props.setBuilderValue('title', e.target.value)
                            }
                        />
                        <Autocomplete
                            value={(props.builder.tags.value as string[]) ?? []}
                            fullWidth
                            multiple
                            onChange={(_, newValue) => {
                                props.setBuilderValue('tags', newValue);
                            }}
                            filterOptions={(options, params) => {
                                const filtered = filter(options, params);

                                const { inputValue } = params;
                                const isExisting = options.some(
                                    (option) => inputValue === option,
                                );
                                if (inputValue !== '' && !isExisting) {
                                    filtered.push(inputValue);
                                }

                                return filtered;
                            }}
                            options={[]}
                            renderOption={(props, option) => (
                                <li {...props}>{option}</li>
                            )}
                            freeSolo
                            renderInput={(params) => (
                                <TextField {...params} label="Tags" />
                            )}
                        />
                        <Autocomplete
                            disableClearable
                            fullWidth
                            id="model-autocomplete"
                            loading={cfgLibraryModels.loading}
                            options={cfgLibraryModels.ids}
                            value={props.builder.model.value ?? null}
                            getOptionLabel={(modelId: string) =>
                                cfgLibraryModels.display[modelId] ?? ''
                            }
                            onChange={(_, newModelId) => {
                                props.setBuilderValue(
                                    'model',
                                    newModelId as string,
                                );
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Large Language Model"
                                    variant="outlined"
                                />
                            )}
                        />
                    </Stack>
                </Grid>
            </StyledContainerGrid>
            <Stack spacing={1} mt={2}>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    paddingBottom={1}
                >
                    <Typography variant="body1">Prompt Context</Typography>
                    <PromptLibraryDialogButton
                        disabled={isPromptLibraryDisabled}
                        builder={props.builder}
                    />
                </Stack>
                <TextField
                    fullWidth
                    inputProps={{ sx: { height: '100%' } }}
                    placeholder="Enter your prompt here. For example, &#8220;Suppose you are a policy expert with 30 years of experience.&#8221;"
                    multiline
                    rows={6}
                    value={props.builder.context.value}
                    onChange={(e) =>
                        props.setBuilderValue('context', e.target.value)
                    }
                />
                <Stack direction="row">
                    <PromptBuilderContextTestDialogButton
                        disabled={isPromptContextTestDisabled}
                        llm={props.builder.model.value as string}
                        context={props.builder.context.value as string}
                    />
                </Stack>
            </Stack>
        </StyledStepPaper>
    );
};
