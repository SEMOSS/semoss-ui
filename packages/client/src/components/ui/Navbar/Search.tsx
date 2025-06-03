import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { usePixel, useRootStore } from '@/hooks';
import {
    Box,
    // Chip,
    List,
    Popper,
    Paper,
    Divider,
    Typography,
    Card,
    Grid,
} from '@semoss/ui';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import NorthEastIcon from '@mui/icons-material/NorthEast';
import { useNavigate } from 'react-router-dom';

// Dummy data for illustration
const categories = [
    { name: 'All', type: 'All' },
    { name: 'Catalogs', type: 'Engine' },
    { name: 'Apps', type: 'App' },
    { name: 'Teams', type: 'Team' },
    { name: 'Settings', type: 'Settings' },
];
const recentSearches = [
    // { label: 'Project Alpha' },
    // { label: 'Project Beta' },
    // { label: 'Dashboard 2024' },
];

const CatalogItem = ({
    title,
    description = 'Sample description',
    icon = '',
}) => (
    <Card
        sx={{
            marginBottom: '5px',
            width: '100%',
            boxShadow: 'none',
            backgroundColor: 'transparent',
            '&:hover': {
                boxShadow: 'none',
                backgroundColor: 'transparent',
            },
            '& :last-child': {
                paddingBottom: 0,
            },
        }}
    >
        <Card.Content
            sx={{
                padding: '5px 16px',
                margin: 0,
                '&.MuiCardContent-root:last-child': {
                    paddingBottom: 0,
                },
            }}
        >
            <Grid
                container
                alignItems="center"
                justifyContent={'space-between'}
            >
                <Grid item xs={1}>
                    {/* <img
                        src={icon}
                        alt={`${title} icon`}
                        style={{ width: '40px', height: '40px' }}
                    /> */}
                    <span style={{ width: '40px', height: '40px' }}>image</span>
                </Grid>
                <Grid item xs={9}>
                    <Typography
                        variant="h6"
                        sx={{ fontSize: '14px', color: '#212121' }}
                    >
                        {title}
                    </Typography>
                    <Typography
                        variant="body2"
                        sx={{ color: 'rgba(0, 0, 0, 0.60)', fontSize: '12px' }}
                    >
                        {description}
                    </Typography>
                </Grid>
                <Grid item xs={2} container justifyContent="flex-end">
                    {/* <IconButton>
                        <CallMadeIcon />
                    </IconButton> */}
                    <NorthEastIcon sx={{ color: 'rgba(0, 0, 0, 0.54)' }} />
                </Grid>
            </Grid>
        </Card.Content>
    </Card>
);

function CustomPopper(props) {
    return <Popper {...props} placement="bottom-start" />;
}

interface SearchProps {
    renderInput: (params: any) => React.ReactNode;
}

const Search = observer(({ renderInput }: SearchProps) => {
    // TODO: navigation should be done through callback
    const navigate = useNavigate();
    const { configStore } = useRootStore();
    const searchValue = configStore.store.globalSearch || '';
    const [open, setOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    let data = [];
    const isAll = selectedCategories.some(
        (category) => category.name === 'All',
    );
    const result = usePixel(`
        MyEngineProject(metaKeys = ${JSON.stringify(
            [],
        )}, metaFilters=[{}], filterWord=[${searchValue}], type=[${
        isAll ? '' : selectedCategories.map((x) => x.type)
    }], sub_type=[], onlyPortals=[true]);
        `);
    if (result.data !== null && Array.isArray(result.data)) {
        data = result.data.map((x) => {
            return {
                ...x,
                label: x.project_name || x.app_name,
                id: x.project_id || x.app_id,
            };
        });
    }
    const handleInputChange = (event, newInputValue) => {
        configStore.setGlobalSearch(newInputValue);
    };

    const handleCategoryToggle = (category) => {
        setSelectedCategories((prev) =>
            prev.some((c) => c.name === category.name)
                ? prev.filter((c) => c.name !== category.name)
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
            inputValue={searchValue}
            onInputChange={handleInputChange}
            options={
                !searchValue?.trim()
                    ? recentSearches.filter((option) =>
                          option.label
                              .toLowerCase()
                              .includes(searchValue.toLowerCase()),
                      )
                    : data
            }
            PopperComponent={CustomPopper}
            getOptionKey={(option) => option.id || option.label}
            getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.label
            }
            renderInput={renderInput}
            renderOption={(props, option) => (
                <List.Item
                    sx={{ padding: 0, flexDirection: 'column' }}
                    key={option.label}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            marginBottom: 0,
                            width: '100%',
                            fontSize: '14px',
                            padding: '0 16px',
                            color: '#666666',
                        }}
                    >
                        Group Label
                        {/* {option.label} */}
                    </Typography>
                    <List.ItemButton
                        sx={{
                            width: '100%',
                            padding: 0,
                            // '&:hover': {
                            //     backgroundColor: 'transparent', // No background on hover
                            //     color: 'inherit', // No color change on hover
                            // },
                        }}
                        onClick={() => {
                            navigate(`app/${option.id}`);
                        }}
                    >
                        {/* {typeof option === 'string' ? option : option.label}{' '}
                        {option.database_id} */}
                        <CatalogItem
                            title={option.label}
                            description={option.description}
                        />
                    </List.ItemButton>
                </List.Item>
            )}
            noOptionsText={'No results found'}
            renderGroup={(params) => <>{params.children}</>}
            PaperComponent={({ children }) => (
                <Paper>
                    {!searchValue ? (
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
                                    const { name } = category;
                                    const isSelected = selectedCategories.some(
                                        (c) => c.name === name,
                                    );
                                    return (
                                        <Chip
                                            key={name}
                                            label={name}
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
                                            onMouseDown={(e) =>
                                                e.preventDefault()
                                            }
                                            onClick={() => {
                                                handleCategoryToggle(category);
                                            }}
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
});

export default Search;
