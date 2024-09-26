/* eslint-disable no-prototype-builtins */
import React, { useState, useMemo, useEffect } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    styled,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Button,
    Stack,
    TablePagination,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Tooltip,
} from '@mui/material';
import { AutoAwesomeOutlined, FilterAlt, AddTask } from '@mui/icons-material';

// import { VectorSearchResult } from '@/types';
// import { ChatMessage, FILE_CATEGORIES } from '@/stores';
// import { useNotification, useChat } from '@/hooks';

// import { MessageSearchCard } from '@/components/message-search-results/MessageSearchCard';
// import { SingleSearchResultModal } from '@/components/message-search-results/SingleSearchResultModal';

const StyledContainer = styled(Stack)(() => ({
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledRow = styled(Stack)(() => ({
    overflowX: 'auto',
}));

const StyledTextBox = styled(Typography)({
    fontWeight: 'light',
    fontStyle: 'oblique',
    fontSize: '12px',
    color: '#bd0707',
});

// const DEFAULT_SELECTED_OPTIONS = Object.keys(FILE_CATEGORIES);

// interface MessageSearchResultsProps {
//     /** Message to render */
//     message: ChatMessage;
// }

/**
 * Parent Componet for Message Search Results
 * Renders search results and handles state changes for messages visbility, checked and categories filtered
 *
 * @param MessageSearchResultsProps
 */
export const MessageSearchResults = observer(
    // (props: MessageSearchResultsProps) => {
    (props) => {
        // const { message } = props;
        // const { results } = message.search;
        // const selectedFilter = message.search.selectedFilters;
        // const notification = useNotification();
        const [filterAnchorEle, setFilterAnchorEle] =
            useState<null | HTMLElement>(null);
        // const [focused, setFocused] = useState<VectorSearchResult | null>(null);

        const isFilterOpen = Boolean(filterAnchorEle);

        // const rowsPerPage = message.search.chunksPerPage;
        // const currentPage = message.search.currentSearchResultsPage;
        // handles the page view in the message element
        // updates the rows based on user input
        // const indexOfLastPost = (currentPage + 1) * rowsPerPage;
        // const indexOfFirstPost = indexOfLastPost - rowsPerPage;

        // const { chat } = useChat();
        // const view = chat.activeRoom.viewer;

        // filter results (based on file results & visibility)
        // const filteredResults = useMemo(() => {
        //     return computed(() => {
        // Updated calls to store visibility changes
        // for (const id in results) {
        // if (results.hasOwnProperty(id)) {
        // Current result file categories
        // const categories = results[id].file
        // ? results[id].file.fileCategories
        // : ['Other'];
        // Check if category matches selected filter
        // const isVisible = categories.some(
        // (c) => selectedFilter[c],
        // );
        // Update the mobx store visibility of the result by id and isVisible
        // message.setMessageVisibility(results[id].id, isVisible);
        //             }
        //         }
        //     }).get();
        // }, [results, selectedFilter]);

        // see if everything is checked
        // const isCheckAll = useMemo(() => {
        //     return computed(() => {
        //         for (const id in results) {
        //             if (results.hasOwnProperty(id) && results[id].rendered) {
        //                 // Return true even if it isnt visible
        //                 // TODO: Disable check button if there is nothing to toggle
        //                 if (!results[id].checked) {
        //                     return false;
        //                 }
        //             }
        //         }
        //         return true;
        //     });
        // }, [results]).get();

        // see if anything is checked
        // const isAnythingChecked = useMemo(() => {
        //     return computed(() => {
        //         for (const id in results) {
        //             if (results.hasOwnProperty(id) && results[id].rendered) {
        //                 // We only return true as long as filtered result
        //                 // is visible and checked
        //                 if (results[id].visible && results[id].checked) {
        //                     return true;
        //                 }
        //             }
        //         }
        //         return false;
        //     });
        // }, [results, filteredResults]).get();

        // see if everything is checked
        // const isFilterSelectAll = useMemo(() => {
        //     return computed(() => {
        //         for (const c in selectedFilter) {
        //             if (!selectedFilter[c]) {
        //                 return false;
        //             }
        //         }

        //         return true;
        //     });
        // }, [selectedFilter]).get();

        /**
         * Toggle select all and update the values
         */
        // const toggleSelectAll = () => {
        //     message.toggleAllChecked();
        // };

        /**
         * Toggle the checkbox
         *
         * @param id - id of the result value
         */
        // const toggleCheck = (id: string) => {
        //     message.toggleCheck(id);
        // };

        /**
         * Toggle the filter selectAll
         */
        // const toggleFilterSelectAll = () => {
        //     // update the value
        //     message.toggleFilterSelectAll(isFilterSelectAll);
        // };

        /**
         * Toggle the filter option
         *
         * @param option - option to toggle
         */
        // const toggleFilterOption = (option: string) => {
        //     message.toggleFilterOption(option);
        // };

        /**
         * Handle the current page
         *
         * @param value - page number to update to
         */
        // const handlePageChange = (
        //     event: React.ChangeEvent<unknown>,
        //     value: number,
        // ) => {
        //     message.setCurrentSearchResultsPage(value);
        // };

        /**
         * Update the rows per page
         *
         * @param event - handle how rows per change updates
         */
        // const handleChangeRowsPerPage = (
        //     event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
        // ) => {
        //     message.setRowsPerPage(parseInt(event.target.value, 10));

        //     // reset the page
        //     message.setCurrentSearchResultsPage(0);
        // };

        /**
         * Use the selected results to ask the model
         */
        // const askModel = async () => {
        //     try {
        //         if (!isAnythingChecked) {
        //             throw new Error('Nothing is checked');
        //         }

        //         // get the checked values as long as they are visible
        //         const checked = [];
        //         Object.keys(results).forEach((id) => {
        //             if (
        //                 results[id].checked &&
        //                 results[id].visible &&
        //                 results[id].rendered
        //             ) {
        //                 checked.push(results[id]);
        //             }
        //         });
        //         //asking the same question with a different results array
        //         await message.askModel(message.reasoning.prompt, checked);
        //     } catch (e) {
        //         console.error(e);
        //         notification.add({
        //             color: 'error',
        //             message:
        //                 'Error: Cannot Refine answer., please try again. If the error persists, please submit a feedback ticket below.',
        //         });
        //     }
        // };
        /**
         * Add more results into the message
         */
        // const addResults = () => {
        //     // Get current results
        //     if (results.length <= 20 && results.length > 4) {
        //         // Add 4 results per click
        //         message.incremanteRendered();
        //     }
        // };

        //resync file names
        // useEffect(() => {
        //     if (view.files.length >= 1) {
        //         message.syncFileNames();
        //     }
        // }, [view.files]);

        return (
            <Stack
                height={'100%'}
                width={'100%'}
                direction={'column'}
                overflow={'hidden'}
                spacing={1}
            >
                <StyledContainer direction={'column'} spacing={1}>
                    <Stack
                        direction={'row'}
                        spacing={1}
                        alignItems={'center'}
                        justifyContent={'space-between'}
                    >
                        <Stack
                            direction={'row'}
                            spacing={0.5}
                            alignItems={'center'}
                        >
                            <IconButton
                                aria-label="more"
                                id="filter-button"
                                aria-controls={
                                    isFilterOpen ? 'filter-menu' : undefined
                                }
                                aria-expanded={
                                    isFilterOpen ? 'true' : undefined
                                }
                                title={
                                    isFilterOpen
                                        ? 'Close Filter'
                                        : 'Open Filter'
                                }
                                aria-haspopup="true"
                                onClick={(event) =>
                                    setFilterAnchorEle(event.currentTarget)
                                }
                            >
                                <FilterAlt />
                            </IconButton>
                            <Menu
                                id="filter-menu"
                                MenuListProps={{
                                    'aria-labelledby': 'filter-button',
                                }}
                                anchorEl={filterAnchorEle}
                                open={isFilterOpen}
                                onClose={() => {
                                    setFilterAnchorEle(null);
                                }}
                            >
                                <MenuItem
                                    dense={true}
                                    title={'Select All'}
                                    // onClick={() => toggleFilterSelectAll()}
                                >
                                    <ListItemIcon>
                                        <Checkbox
                                            // checked={isFilterSelectAll}
                                            checked={true}
                                            tabIndex={-1}
                                            disableRipple
                                            inputProps={{
                                                'aria-labelledby':
                                                    'filter-select-all',
                                            }}
                                        />
                                    </ListItemIcon>
                                    <ListItemText
                                        id={'filter-select-all'}
                                        primary={'Select All'}
                                    />
                                </MenuItem>
                                <Divider />
                                {[
                                    'Option 1',
                                    'Option 2',
                                    'Option 3',
                                    'Option 4',
                                    'Option 5',
                                ].map((option) => {
                                    const labelId = `filter-category--${option}`;
                                    const isSelected = true;
                                    // const isSelected =
                                    //     selectedFilter[option];

                                    return (
                                        <MenuItem
                                            dense={true}
                                            key={option}
                                            title={
                                                isSelected
                                                    ? `Exclude ${option}`
                                                    : `Include ${option}`
                                            }
                                            // onClick={() =>
                                            //     toggleFilterOption(option)
                                            // }
                                        >
                                            <ListItemIcon>
                                                <Checkbox
                                                    checked={isSelected}
                                                    tabIndex={-1}
                                                    disableRipple
                                                    inputProps={{
                                                        'aria-labelledby':
                                                            labelId,
                                                    }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                id={labelId}
                                                primary={option}
                                            />
                                        </MenuItem>
                                    );
                                })}
                            </Menu>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            // onChange={() =>
                                            //     toggleSelectAll()
                                            // }
                                            checked={true}
                                        />
                                    }
                                    label="Select All"
                                />
                            </FormGroup>
                            {/* {isAnythingChecked ? ( */}
                            {true ? (
                                <></>
                            ) : (
                                <Typography
                                    variant="body2"
                                    fontStyle={'italic'}
                                >
                                    Select preferred results to tailor your
                                    answer.
                                </Typography>
                            )}
                        </Stack>
                        <Stack
                            direction={'row'}
                            spacing={1}
                            alignItems={'center'}
                        >
                            <Tooltip
                                title={
                                    'Select preferred results to tailor your answer.'
                                }
                                placement="top"
                            >
                                <Button
                                    disabled={
                                        // !isAnythingChecked ||
                                        // message.reasoning.isLoading
                                        false
                                    }
                                    variant={'contained'}
                                    size={'small'}
                                    startIcon={<AutoAwesomeOutlined />}
                                    // onClick={() => askModel()}
                                >
                                    Refine Answer
                                </Button>
                            </Tooltip>
                            <Tooltip
                                title={
                                    'Add additional documents to search against'
                                }
                                placement="top"
                            >
                                <Button
                                    disabled={
                                        // Object.keys(results).filter(
                                        //     (id) => results[id].rendered,
                                        // ).length === results.length
                                        false
                                    }
                                    variant={'contained'}
                                    size={'small'}
                                    startIcon={<AddTask />}
                                    // onClick={() => addResults()}
                                >
                                    Add Additional Documents
                                </Button>
                            </Tooltip>
                            <TablePagination
                                component={'div'}
                                count={
                                    // Object.keys(results).filter(
                                    //     (id) =>
                                    //         results[id].visible &&
                                    //         results[id].rendered,
                                    // ).length
                                    5
                                }
                                // page={currentPage} // ??? might need this
                                page={1}
                                labelRowsPerPage={<></>}
                                // rowsPerPage={rowsPerPage}  // ??? might need this
                                rowsPerPage={2}
                                rowsPerPageOptions={[1, 2, 3, 4, 5, 6]}
                                // onRowsPerPageChange={
                                //     handleChangeRowsPerPage
                                // }
                                // onPageChange={handlePageChange}  // ??? might need this
                                onPageChange={() => alert('onPageChange()')}
                                sx={{ borderBottom: 0 }}
                            />
                        </Stack>
                    </Stack>
                </StyledContainer>
            </Stack>
        );
    },
);
