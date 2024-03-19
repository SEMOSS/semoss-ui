import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Stack, TextField, useNotification } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks, usePixel, useRootStore } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { BaseSettingSection } from '../BaseSettingSection';
import { AutoAwesome } from '@mui/icons-material';
import { Autocomplete } from '@mui/material';

type CfgLibraryEngineState = {
    loading: boolean;
    ids: string[];
    display: object;
};

interface AIGenerationSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label to pass into the input
     */
    label?: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     * Placeholder text in prompt input
     */
    placeholder?: string;

    /**
     * Set path value as object instead of string
     */
    valueAsObject?: boolean;

    /**
     * Append additional context to the end of the prompt
     */
    appendPrompt?: string;
}

export const AIGenerationSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = 'AI',
        placeholder = null,
        path,
        valueAsObject = false,
        appendPrompt = '',
    }: AIGenerationSettingsProps<D>) => {
        const { setData } = useBlockSettings<D>(id);
        const { state } = useBlocks();
        const { monolithStore } = useRootStore();
        const notification = useNotification();

        const [prompt, setPrompt] = useState('');
        const [responseLoading, setResponseLoading] = useState<boolean>(false);

        const [cfgLibraryModels, setCfgLibraryModels] =
            useState<CfgLibraryEngineState>({
                loading: true,
                ids: [],
                display: {},
            });
        const [selectedModel, setSelectedModel] = useState<string>('');
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
            if (modelIds.length) {
                setSelectedModel(modelIds[0]);
            }
        }, [myModels.status, myModels.data]);

        const generateAIResponse = async () => {
            try {
                setResponseLoading(true);
                const flattenedPrompt = state.flattenVariable(prompt);
                const pixel = `LLM(engine=["${selectedModel}"],command=["<encode>${flattenedPrompt} ${appendPrompt}</encode>"], paramValues=[${JSON.stringify(
                    {
                        max_new_tokens: 4000,
                    },
                )}]);`;
                const { errors, pixelReturn } = await monolithStore.runQuery(
                    pixel,
                );

                let valueToSet = pixelReturn[0]?.output?.response;

                if (errors.length > 0 || typeof valueToSet !== 'string') {
                    throw new Error(errors.join(''));
                }

                if (valueAsObject) {
                    valueToSet = !!pixelReturn[0].output?.response
                        ? JSON.parse(
                              pixelReturn[0].output?.response
                                  .replaceAll('\\"', '"')
                                  .replaceAll('\\n', ''),
                          )
                        : undefined;
                    if (valueToSet === undefined) {
                        notification.add({
                            color: 'error',
                            message:
                                'There was an issue parsing the JSON in your response.',
                        });
                    }
                }

                setData(path, valueToSet as PathValue<D['data'], typeof path>);
            } catch (e) {
                console.error(e);

                notification.add({
                    color: 'error',
                    message: e.message,
                });
            } finally {
                setResponseLoading(false);
            }
        };

        return (
            <Stack spacing={1} padding={2} width="100%">
                <TextField
                    disabled={!cfgLibraryModels.ids.length || responseLoading}
                    fullWidth
                    multiline
                    rows={5}
                    value={prompt}
                    onChange={(e) => {
                        // sync the data on change
                        setPrompt(e.target.value);
                    }}
                    size="small"
                    variant="outlined"
                    autoComplete="off"
                    placeholder={placeholder}
                    label="AI Generator"
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <Autocomplete
                    disabled={!cfgLibraryModels.ids.length || responseLoading}
                    disableClearable
                    fullWidth
                    id="model-autocomplete"
                    loading={cfgLibraryModels.loading}
                    options={cfgLibraryModels.ids}
                    value={selectedModel}
                    size="small"
                    getOptionLabel={(modelId: string) =>
                        cfgLibraryModels.display[modelId] ?? ''
                    }
                    onChange={(_, newModelId) => {
                        setSelectedModel(newModelId);
                    }}
                    renderInput={(params) => (
                        <TextField {...params} variant="outlined" />
                    )}
                />
                <Button
                    disabled={
                        !cfgLibraryModels.ids.length || cfgLibraryModels.loading
                    }
                    loading={responseLoading}
                    variant="outlined"
                    endIcon={<AutoAwesome />}
                    onClick={generateAIResponse}
                >
                    Generate
                </Button>
            </Stack>
        );
    },
);
