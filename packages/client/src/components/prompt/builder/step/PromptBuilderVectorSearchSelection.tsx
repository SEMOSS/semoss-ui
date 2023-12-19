import { Autocomplete } from '@mui/material';
import { Grid, TextField, Typography } from '@semoss/ui';
import { PromptReadonlyInputToken } from '../../shared';

export const PromptBuilderVectorSearchSelection = (props: {
    vectorDisplay: string;
    searchOptions: Array<{ display: string; value: string }>;
    searchStatement: string;
    setSearchStatement: (statement: string) => void;
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
                <Typography variant="body1">{props.vectorDisplay}</Typography>
            </Grid>
            <Grid item xs={8} md={4}>
                <Autocomplete
                    disableClearable
                    id="input-token-autocomplete"
                    options={props.searchOptions.map(
                        (searchOption) => searchOption.value,
                    )}
                    value={props.searchStatement ?? ''}
                    getOptionLabel={(searchOption) => {
                        const propSearchOption = props.searchOptions.find(
                            (option) => option.value === searchOption,
                        );
                        return propSearchOption?.display ?? '';
                    }}
                    onChange={(_, newSearchStatement: string) => {
                        props.setSearchStatement(newSearchStatement);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Search"
                            variant="standard"
                        />
                    )}
                    renderOption={(renderProps, searchOption) => {
                        const propOption = props.searchOptions.find(
                            (option) => option.value == searchOption,
                        );
                        const display = propOption?.display ?? '';

                        if (searchOption !== '') {
                            return (
                                <li {...renderProps}>
                                    <PromptReadonlyInputToken
                                        tokenKey={display}
                                    />
                                </li>
                            );
                        } else {
                            return <li {...renderProps}>{display}</li>;
                        }
                    }}
                />
            </Grid>
        </Grid>
    );
};
