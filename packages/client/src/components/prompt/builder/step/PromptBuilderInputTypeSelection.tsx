import React, { useCallback, useEffect, useState } from 'react';
import { Token } from '../../prompt.types';
import { InfoOutlined } from '@mui/icons-material';

import {
    styled,
    AutocompleteTwo,
    Grid,
    Stack,
    Fade,
    TextField,
    Tooltip,
    Typography,
} from '@semoss/ui';
import { PromptReadonlyInputToken } from '../../shared/token';
import {
    INPUT_TYPES,
    INPUT_TYPE_DATABASE,
    INPUT_TYPE_DISPLAY,
    INPUT_TYPE_HELP_TEXT,
    INPUT_TYPE_VECTOR,
} from '../../prompt.constants';

const HelpTextIcon = styled(InfoOutlined)(({ theme }) => ({
    color: theme.palette.grey[400],
    cursor: 'pointer',
}));

export const PromptBuilderInputTypeSelection = (props: {
    inputToken: Token;
    inputType: string | null;
    inputTypeMeta: string | null;
    cfgLibraryVectorDbs: {
        loading: boolean;
        ids: Array<string>;
        display: object;
    };
    cfgLibraryDatabases: {
        loading: boolean;
        ids: Array<string>;
        display: object;
    };
    setInputType: (
        inputTokenIndex: number,
        inputType: string,
        inputTypeMeta: string | null,
    ) => void;
    setInputLabel: (inputTokenIndex: number, inputLabel: string) => void;
    userPrompt: string;
    modelId: string;
    setBuilderValue: (builderStepKey: string, value: string) => void;
    LlmInputLabel: string;
    isLLMVersionSelected: boolean;
}) => {
    const [inputLabelText, setInputLabelText] = useState(props.LlmInputLabel);

    const showMetaAutocomplete =
        props.inputType === INPUT_TYPE_VECTOR ||
        props.inputType === INPUT_TYPE_DATABASE;

    const getMetaSelectorLoading = (): boolean => {
        switch (props.inputType) {
            case INPUT_TYPE_VECTOR:
                return props.cfgLibraryVectorDbs.loading;
            case INPUT_TYPE_DATABASE:
                return props.cfgLibraryDatabases.loading;
            default:
                return false;
        }
    };

    const getMetaSelectorOptions = (): Array<string> => {
        switch (props.inputType) {
            case INPUT_TYPE_VECTOR:
                return props.cfgLibraryVectorDbs.ids;
            case INPUT_TYPE_DATABASE:
                return props.cfgLibraryDatabases.ids;
            default:
                return [];
        }
    };

    const getMetaSelectorDisplay = (value: string): string => {
        switch (props.inputType) {
            case INPUT_TYPE_VECTOR:
                return props.cfgLibraryVectorDbs.display[value] ?? '';
            case INPUT_TYPE_DATABASE:
                return props.cfgLibraryDatabases.display[value] ?? '';
            default:
                return '';
        }
    };

    const getMetaSelectorLabel = (): string => {
        switch (props.inputType) {
            case INPUT_TYPE_VECTOR:
                return 'Knowledge Repository';
            case INPUT_TYPE_DATABASE:
                return 'Database';
            default:
                return '';
        }
    };

    // Handle input label change for textfield
    const handleInputChange = useCallback((e) => {
        const newValue = e.target.value;
        setInputLabelText(newValue);
        props.setInputLabel(props.inputToken.index, newValue);
    }, [props.setInputLabel, props.inputToken.index]);

    // Setting TextField label as LLM input label if it exists
    useEffect(() => {
        if (props.LlmInputLabel && props.LlmInputLabel.trim() !== '') {
            setInputLabelText(props.LlmInputLabel);
            handleInputChange({ target: { value: props.LlmInputLabel } });
        }
    }, [props.LlmInputLabel, handleInputChange]);

    return (
        <Grid
            sx={{
                justifyContent: 'space-between',
                alignItems: 'start',
            }}
            container
        >
            <Grid item>
                <PromptReadonlyInputToken tokenKey={props.inputToken.key} />
            </Grid>
            <Grid item xs={9} md={6}>
                <Stack spacing={2}>
                    <TextField
                        label="Input Label"
                        value={inputLabelText}
                        variant="outlined"
                        onChange={handleInputChange}
                    />
                    <AutocompleteTwo
                        fullWidth
                        disableClearable
                        id="input-token-autocomplete"
                        options={INPUT_TYPES}
                        value={props.inputType || ''}
                        getOptionLabel={(option) => INPUT_TYPE_DISPLAY[option]}
                        onChange={(_, newInputType: string) => {
                            props.setInputType(
                                props.inputToken.index,
                                newInputType,
                                null,
                            );
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Input Type"
                                variant="outlined"
                            />
                        )}
                    />
                    <Fade in={showMetaAutocomplete}>
                        <span>
                            <Stack direction="row" alignItems="center">
                                <AutocompleteTwo
                                    fullWidth
                                    disableClearable
                                    size="small"
                                    id="meta-autocomplete"
                                    loading={getMetaSelectorLoading()}
                                    options={getMetaSelectorOptions()}
                                    value={props.inputTypeMeta ?? ''}
                                    getOptionLabel={getMetaSelectorDisplay}
                                    onChange={(_, newMetaValue: string) => {
                                        props.setInputType(
                                            props.inputToken.index,
                                            props.inputType,
                                            newMetaValue,
                                        );
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label={getMetaSelectorLabel()}
                                            variant="outlined"
                                        />
                                    )}
                                />
                                <Tooltip
                                    title={
                                        <React.Fragment>
                                            <Typography variant="body2">
                                                {
                                                    INPUT_TYPE_HELP_TEXT[
                                                        props.inputType
                                                    ]
                                                }
                                            </Typography>
                                        </React.Fragment>
                                    }
                                    arrow
                                >
                                    <HelpTextIcon fontSize="small" />
                                </Tooltip>
                            </Stack>
                        </span>
                    </Fade>
                </Stack>
            </Grid>
        </Grid>
    );
};
