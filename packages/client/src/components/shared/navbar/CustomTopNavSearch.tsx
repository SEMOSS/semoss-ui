import React from 'react';

import { TextField, InputAdornment, styled } from '@semoss/ui';
import { Search } from './Search';
import { MenuRounded, Search as SearchIcon } from '@mui/icons-material';

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    alignSelf: 'center',
    '& .MuiOutlinedInput-root': {
        padding: '0px 12px',
        borderRadius: '8px',
        border: '1px solid  #C4C4C4',
    },
    '& .MuiOutlinedInput-root > input': {
        paddingLeft: '0px',
        paddingRight: '0px',
    },
}));

export const CustomTopNavSearch = () => {
    return (
        <Search
            renderInput={(params) => (
                <StyledTextField
                    {...params}
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    label=""
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            height: '40px !important',
                            border: 'none',
                            '& input': {
                                height: '40px !important',
                            },
                        },
                    }}
                />
            )}
        />
    );
};
