import { Token } from '../../prompt.types';
import { Autocomplete } from '@mui/material';
import { Grid, TextField } from '@semoss/ui';
import { INPUT_TYPES, INPUT_TYPE_DISPLAY } from '../../prompt.constants';
import { PromptReadonlyInputToken } from '../../shared/token';

export const PromptBuilderInputTypeSelection = (props: {
    inputToken: Token;
    inputType: string | null;
    setInputType: (inputTokenIndex: number, inputType: string) => void;
}) => {
    return (
        <Grid
            sx={{
                justifyContent: 'space-between',
                alignItems: 'center',
                marginY: 2,
            }}
            container
            direction="row"
        >
            <Grid item>
                <PromptReadonlyInputToken token={props.inputToken} />
            </Grid>
            <Grid item xs={8} md={4}>
                <Autocomplete
                    disableClearable
                    id="input-token-autocomplete"
                    options={INPUT_TYPES}
                    value={props.inputType}
                    getOptionLabel={(option) => INPUT_TYPE_DISPLAY[option]}
                    onChange={(_, newInputType: string) => {
                        props.setInputType(
                            props.inputToken.index,
                            newInputType,
                        );
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Input Type"
                            variant="standard"
                        />
                    )}
                />
            </Grid>
        </Grid>
    );
};
