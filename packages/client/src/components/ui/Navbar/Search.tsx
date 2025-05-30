import { useState } from 'react';
import { usePixel } from '@/hooks';
import {
    Box,
    Chip,
    List,
    Popper,
    Paper,
    Divider,
    Typography,
} from '@semoss/ui';
import Autocomplete from '@mui/material/Autocomplete';
import { useNavigate } from 'react-router-dom';

// Dummy data for illustration
const categories = ['All', 'Catalogs', 'Apps', 'Teams', 'Settings'];
const recentSearches = [
    // { label: 'Project Alpha' },
    // { label: 'Project Beta' },
    // { label: 'Dashboard 2024' },
];

function CustomPopper(props) {
    return <Popper {...props} placement="bottom-start" />;
}

const Search = ({ renderInput }) => {
    // TODO: navigation should be done through callback
    const navigate = useNavigate();

    const [inputValue, setInputValue] = useState('');
    const [open, setOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    let data = [];

    const result = usePixel(`
        MyEngineProject(metaKeys = ${JSON.stringify(
            [],
        )}, metaFilters=[{}], filterWord=[${inputValue}], type=['APP'], sub_type=[{}], onlyPortals=[true]);
        `);
    if (result.data !== null && Array.isArray(result.data)) {
        data = result.data.map((x) => {
            return { ...x, label: x.project_name, id: x.project_id };
        });
    }
    const handleInputChange = (event, newInputValue) => {
        setInputValue(newInputValue);
    };

    const handleCategoryToggle = (category) => {
        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category],
        );
    };

    return (
        <Autocomplete
            freeSolo
            open={open}
            onOpen={() => setOpen(true)}
            // onBlur={() => setOpen(false)}
            onClose={() => setOpen(false)}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            options={
                !inputValue?.trim()
                    ? recentSearches.filter((option) =>
                          option.label
                              .toLowerCase()
                              .includes(inputValue.toLowerCase()),
                      )
                    : data
            }
            PopperComponent={CustomPopper}
            getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.label
            }
            renderInput={renderInput}
            renderOption={(props, option) => (
                <List.Item sx={{ padding: 0 }} key={option.label}>
                    <List.ItemButton
                        onClick={() => {
                            navigate(`app/${option.id}`);
                        }}
                    >
                        {typeof option === 'string' ? option : option.label}{' '}
                        {option.database_id}
                    </List.ItemButton>
                </List.Item>
            )}
            noOptionsText={'No results found'}
            renderGroup={(params) => <>{params.children}</>}
            PaperComponent={({ children }) => (
                <Paper>
                    {inputValue === '' ? (
                        <Box sx={{ p: 2 }}>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                                I'm Searching for
                            </Typography>
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 1,
                                    flexWrap: 'wrap',
                                    mb: 2,
                                }}
                            >
                                {categories.map((category) => {
                                    const isSelected =
                                        selectedCategories.includes(category);
                                    return (
                                        <Chip
                                            key={category}
                                            label={category}
                                            size="small"
                                            sx={{
                                                backgroundColor: isSelected
                                                    ? '#C4C4C4'
                                                    : 'unset',
                                                border: isSelected
                                                    ? '1px solid #C4C4C4'
                                                    : '1px solid #E0E0E0',
                                                color: isSelected
                                                    ? '#ffffff'
                                                    : '#000',
                                            }}
                                            clickable
                                            onClick={() =>
                                                handleCategoryToggle(category)
                                            }
                                        />
                                    );
                                })}
                            </Box>
                            <Divider sx={{ borderColor: '#DDE1E6' }} />
                            <Typography
                                variant="subtitle2"
                                sx={{ mb: 1, color: '#9E9E9E' }}
                            >
                                Recents
                            </Typography>
                            {recentSearches.map(({ label }) => (
                                <Box key={label} sx={{ mb: 0.5 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ cursor: 'pointer' }}
                                    >
                                        {label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        children
                    )}
                </Paper>
            )}
        />
    );
};

export default Search;
