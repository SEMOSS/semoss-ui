import { Token } from '../../prompt.types';
import { Autocomplete } from '@mui/material';
import { Grid, Stack, TextField, Collapse } from '@semoss/ui';
import { Fade } from '@mui/material';
import {
    INPUT_TYPES,
    INPUT_TYPE_DISPLAY,
    INPUT_TYPE_VECTOR,
} from '../../prompt.constants';
import { PromptReadonlyInputToken } from '../../shared/token';

export const PromptBuilderInputTypeSelection = (props: {
    inputToken: Token;
    inputType: string | null;
    inputTypeMeta: string | null;
    cfgLibraryVectorDbs: {
        loading: boolean;
        ids: Array<string>;
        display: object;
    };
    setInputType: (
        inputTokenIndex: number,
        inputType: string,
        inputTypeMeta: string | null,
    ) => void;
}) => {
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
                    <Fade in={props.inputType === INPUT_TYPE_VECTOR}>
                        <Autocomplete
                            fullWidth
                            disableClearable
                            size="small"
                            id="vector-autocomplete"
                            loading={props.cfgLibraryVectorDbs.loading}
                            options={props.cfgLibraryVectorDbs.ids}
                            value={props.inputTypeMeta ?? ''}
                            getOptionLabel={(vectorId: string) =>
                                props.cfgLibraryVectorDbs.display[vectorId] ??
                                ''
                            }
                            onChange={(_, newVectorId: string) => {
                                props.setInputType(
                                    props.inputToken.index,
                                    props.inputType,
                                    newVectorId,
                                );
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Knowledge Repository"
                                    variant="outlined"
                                />
                            )}
                        />
                    </Fade>
                </Stack>
            </Grid>
        </Grid>
    );
};
