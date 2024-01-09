import { useState } from 'react';
import { Autocomplete } from '@mui/material';
import { Collapse, Grid, TextField, Typography } from '@semoss/ui';
import { PromptReadonlyInputToken } from '../../shared';
import {
    VECTOR_SEARCH_CUSTOM,
    VECTOR_SEARCH_FULL_CONTEXT,
} from '../../prompt.constants';

export const PromptBuilderVectorSearchSelection = (props: {
    vectorDisplay: string;
    searchOptions: Array<{ display: string; value: string; type: string }>;
    searchStatement: string;
    setSearchStatement: (statement: string) => void;
}) => {
    const [vectorSearchType, setVectorSearchType] = useState<string>(
        VECTOR_SEARCH_FULL_CONTEXT,
    );

    return (
        <>
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
                    <Typography variant="body1">
                        {props.vectorDisplay}
                    </Typography>
                </Grid>
                <Grid item xs={8} md={4}>
                    <Autocomplete
                        disableClearable
                        id="input-token-autocomplete"
                        options={props.searchOptions.map(
                            (searchOption) => searchOption.type,
                        )}
                        value={vectorSearchType}
                        getOptionLabel={(searchType) => {
                            const propSearchOption = props.searchOptions.find(
                                (option) => option.type === searchType,
                            );
                            return propSearchOption?.display ?? '';
                        }}
                        onChange={(_, newSearchType: string) => {
                            if (newSearchType !== VECTOR_SEARCH_CUSTOM) {
                                const propOption = props.searchOptions.find(
                                    (option) => option.type == newSearchType,
                                );
                                const value = propOption?.value ?? '';
                                props.setSearchStatement(value);
                            } else {
                                props.setSearchStatement('');
                            }
                            setVectorSearchType(newSearchType);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Search"
                                variant="standard"
                            />
                        )}
                        renderOption={(renderProps, searchType) => {
                            const propOption = props.searchOptions.find(
                                (option) => option.type == searchType,
                            );
                            const display = propOption?.display ?? '';

                            if (
                                display !== 'Full Context' &&
                                display !== 'Custom'
                            ) {
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
            <Collapse in={vectorSearchType === VECTOR_SEARCH_CUSTOM}>
                <Grid
                    sx={{
                        justifyContent: 'end',
                        alignItems: 'center',
                        marginY: 2,
                    }}
                    container
                    direction="row"
                >
                    <Grid item xs={8} md={4}>
                        <TextField
                            value={props.searchStatement}
                            onChange={(e) =>
                                props.setSearchStatement(e.target.value)
                            }
                            variant="outlined"
                            size="small"
                            rows={4}
                            fullWidth
                            multiline
                            label="Custom Vector Search"
                        />
                    </Grid>
                </Grid>
            </Collapse>
        </>
    );
};
