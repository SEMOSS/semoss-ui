import { Autocomplete } from '@mui/material';
import { Grid, TextField, Typography } from '@semoss/ui';

export const PromptBuilderKnowledgeRepositorySearchSelection = (props: {
    knowledgeRepositoryDisplay: string;
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
                <Typography variant="body1">
                    {props.knowledgeRepositoryDisplay}
                </Typography>
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
                        const propOption = props.searchOptions.find(
                            (option) => option.value == searchOption,
                        );
                        return propOption?.display;
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
                />
            </Grid>
        </Grid>
    );
};
