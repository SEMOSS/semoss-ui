import React, { useEffect } from 'react';
import { Token } from '../../prompt.types';
import { Autocomplete } from '@mui/material';
import { usePixel } from '@/hooks';
import {
    styled,
    Grid,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@semoss/ui';
import { Fade } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import {
    INPUT_TYPES,
    INPUT_TYPE_DATABASE,
    INPUT_TYPE_DISPLAY,
    INPUT_TYPE_HELP_TEXT,
    INPUT_TYPE_VECTOR,
    INPUT_TYPE_SELECT,
    SELECT_TYPE_MODELS,
    SELECT_TYPE_VECTORS,
    SELECT_TYPE_USER_INPUT,
    SELECT_TYPE_OPTIONS,
} from '../../prompt.constants';
import { PromptReadonlyInputToken } from '../../shared/token';

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
        options?: string[] | null,
    ) => void;
}) => {
    // Fetch models only when Models type is selected
    const myModels = usePixel<
        { app_id: string; app_name: string; tag: string }[]
    >(
        props.inputTypeMeta === SELECT_TYPE_MODELS
            ? `MyEngines(engineTypes=['MODEL']);`
            : null,
    );

    // Fetch vectors only when Vectors type is selected
    const myVectors = usePixel<{ app_id: string; app_name: string }[]>(
        props.inputTypeMeta === SELECT_TYPE_VECTORS
            ? `MyEngines(engineTypes=['VECTOR']);`
            : null,
    );

    // Auto-populate options when Models/Vectors are selected
    useEffect(() => {
        if (
            props.inputTypeMeta === SELECT_TYPE_MODELS &&
            myModels.status === 'SUCCESS'
        ) {
            const modelOptions = myModels.data
                .filter((model) => model.tag !== 'embeddings')
                .map((model) => model.app_name);
            props.setInputType(
                props.inputToken.index,
                INPUT_TYPE_SELECT,
                SELECT_TYPE_MODELS,
                modelOptions,
            );
        } else if (
            props.inputTypeMeta === SELECT_TYPE_VECTORS &&
            myVectors.status === 'SUCCESS'
        ) {
            const vectorOptions = myVectors.data.map(
                (vector) => vector.app_name,
            );
            props.setInputType(
                props.inputToken.index,
                INPUT_TYPE_SELECT,
                SELECT_TYPE_VECTORS,
                vectorOptions,
            );
        }
    }, [myModels.status, myVectors.status, props.inputTypeMeta]);

    const showMetaAutocomplete =
        props.inputType === INPUT_TYPE_VECTOR ||
        props.inputType === INPUT_TYPE_DATABASE ||
        props.inputType === INPUT_TYPE_SELECT;

    const getMetaSelectorLoading = (): boolean => {
        switch (props.inputType) {
            case INPUT_TYPE_VECTOR:
                return props.cfgLibraryVectorDbs.loading;
            case INPUT_TYPE_DATABASE:
                return props.cfgLibraryDatabases.loading;
            case INPUT_TYPE_SELECT:
                return props.inputTypeMeta === SELECT_TYPE_MODELS
                    ? myModels.status === 'LOADING'
                    : props.inputTypeMeta === SELECT_TYPE_VECTORS
                    ? myVectors.status === 'LOADING'
                    : false;
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
            case INPUT_TYPE_SELECT:
                return ['User Input', 'Models', 'Vectors'];
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
            case INPUT_TYPE_SELECT:
                return value;
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
            case INPUT_TYPE_SELECT:
                return 'Select Type';
            default:
                return '';
        }
    };

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
                    <Autocomplete
                        fullWidth
                        disableClearable
                        id="input-token-autocomplete"
                        options={INPUT_TYPES}
                        value={props.inputType}
                        getOptionLabel={(option) => INPUT_TYPE_DISPLAY[option]}
                        onChange={(_, newInputType: string) => {
                            props.setInputType(
                                props.inputToken.index,
                                newInputType,
                                newInputType === INPUT_TYPE_SELECT
                                    ? SELECT_TYPE_USER_INPUT
                                    : null,
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
                                <Autocomplete
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
