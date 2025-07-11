import { useEffect, useMemo, useState } from 'react';

import {
    Autocomplete,
    Box,
    Button,
    Stack,
    styled,
    Switch,
    TextField,
    ToggleTabsGroup,
    Typography,
    useNotification,
} from '@semoss/ui';
import {
    useBlocks,
    useBlocksPixel,
    useFrameHeaders,
    BlockComponent,
} from '@semoss/renderer';

import { useBlockSettings } from '@/hooks';
import { SizeSettings } from '../../shared';

const StyledStack = styled(Stack)(() => ({
    '>.MuiBox-root': {
        width: '90%',
        margin: 'auto',
    },
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    minHeight: '42px',
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: 'center',
    padding: '0px 3px',
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    '>.MuiTabs-scroller': {
        display: 'flex',
        justifyContent: 'space-around',
        '.MuiTabs-flexContainer': {
            flex: 1,
        },

        '>.MuiTabs-flexContainer': {
            width: '100%',
            justifyContent: 'space-around',
        },
    },
}));
const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '38px',
    padding: '8px 16px',

    '&.MuiTab-root': {
        borderRadius: theme.shape.borderRadius,
        width: '30%',
        padding: '4px 8px',
    },
    '&.Mui-selected': {
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
    },
}));

const StyledContainer = styled('div')(() => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
}));

const StyledSubSection = styled('div')(() => ({
    display: 'flex',
    padding: '8px 16px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    alignSelf: 'stretch',
}));

const StyleHorizontalSection = styled('div')(() => ({
    display: 'flex',
    padding: '8px 16px',
    alignItems: 'center',
    gap: '8px',
    alignSelf: 'stretch',
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '143%',
    letterSpacing: '0.17px',
    alignSelf: 'stretch',
}));

const DATA = {
    displayType: ['Checklist', 'Dropdown', 'Multiselect', 'Slider'],
    frame: ['Frame 1', 'Frame 2', 'Frame 3'],
    colors: [
        'primary',
        'secondary',
        'error',
        'warning',
        'info',
        'success',
        'inherit',
    ],
    sizes: ['small', 'medium', 'large'],
};
export const VisualizationFilterMenu: BlockComponent = ({ id }) => {
    const { data, setData } = useBlockSettings(id);
    const [selectedTab, setSelectedTab] = useState('Data');

    // Initial state for the local state of the component
    const initialState: Record<string, any> = {
        showPanelTitle: false,
        searchable: false,
        multipleSelection: false,
        displayType: '',
        frame: '',
        column: '',
        filterLabel: '',
        sliderSensitivity: 0,
        listOptions: [],
        selectedValues: [],
        color: 'secondary',
        size: 'medium',
    };

    const [localState, setLocalState] =
        useState<Record<string, any>>(initialState);
    const notification = useNotification();
    const getFrames = useBlocksPixel<string[]>('GetFrames();', { data: [] });
    const options = getFrames.status === 'SUCCESS' ? getFrames.data : [];
    const frameHeaders = useFrameHeaders(localState.frame);

    const columnNames = useMemo(() => {
        return frameHeaders?.data?.list?.map((item) => item.alias) || [];
    }, [frameHeaders]);

    // Effect to initialize local state from block data
    useEffect(() => {
        setLocalState({
            showPanelTitle: !!data.showPanelTitle,
            searchable: !!data.searchable,
            multipleSelection: !!data.multipleSelection,
            displayType: data.displayType ?? '',
            frame: data.frame ?? '',
            column: data.column ?? '',
            filterLabel: data.filterLabel ?? '',
            sliderSensitivity: data.sliderSensitivity ?? 0,
            listOptions: data.listOptions ?? [],
            selectedValues: data.selectedValues ?? [],
            color: data.color ?? '',
            size: data.size ?? '',
        });
    }, [data, id]);

    const { state } = useBlocks();
    // This function updates a specific field in the local state of the component.
    // It takes two parameters: `field`, which is the name of the field to update,
    // and `value`, which is the new value to assign to that field.
    const updateField = (field, value) => {
        setLocalState((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    /**
     * Handles changes to fields in the local state of the component.
     *
     * @param field The name of the field that was changed.
     * @param _ The event object from the onChange event.
     * @param value The new value of the field.
     */
    const handleOnChange = (field) => (_, value) => {
        let updatedValue = value;
        if (value === null || value === undefined) {
            updatedValue = '';
        }

        /**
         * If the field that was changed is the displayType, then
         * we need to reset some other fields as well.
         */
        if (field === 'displayType') {
            setLocalState((prev) => ({
                ...prev,
                /**
                 * Set the displayType to the new value.
                 */
                displayType: updatedValue,
                /**
                 * Reset the filterLabel field to an empty string.
                 */
                filterLabel: '',
                /**
                 * Reset the sliderSensitivity field to an empty string.
                 */
                sliderSensitivity: '',
            }));
        } else {
            /**
             * If the field that was changed is not the displayType, then
             * we can just update the field with the new value.
             */
            updateField(field, updatedValue);
        }
    };

    /**
     * This function is a higher order function that takes a field name
     * and returns a function that will update the local state with
     * the new value of that field.
     *
     * @param field The name of the field to update in the local state.
     * @returns A function that takes an event object and updates the local state.
     */
    const handleSwitchChange =
        (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
            const checked = event.target.checked;

            setLocalState((prevState) => {
                const updatedState = {
                    ...prevState,
                };
                updatedState[field] = checked;
                return updatedState;
            });
        };

    const isApplyDisabled =
        !localState.displayType || !localState.frame || !localState.column;

    /**
     * Updates the block's data store with the current local state
     */
    const handleUpdate = async (): Promise<void> => {
        if (!localState.frame || !localState.column) {
            return;
        }

        try {
            const response = await state.runSideEffect(
                `META | Frame(${localState.frame}) | Select(${localState.column}).as([${localState.column}])|Group(${localState.column})|Sort(${localState.column}) | Offset(0) | Limit(1000) | Collect(1000);`,
            );

            const values = (
                response?.pixelReturn?.[0]?.output as {
                    data?: { values?: any[] };
                }
            )?.data?.values;

            if (!values?.length) {
                setLocalState((prev) => ({ ...prev, listOptions: [] }));

                notification.add({
                    color: 'error',
                    message:
                        'Invalid response or errors found while fetching options.',
                });
                return;
            }

            const options = values.map((item: any) => String(item[0]));

            setLocalState((prev) => {
                const updatedState = {
                    ...prev,
                    listOptions: options,
                    selectedValues: [],
                    filterLabel:
                        prev.filterLabel && prev.filterLabel.trim() !== ''
                            ? prev.filterLabel
                            : prev.column
                            ? `Filter of ${prev.column}`
                            : '',
                };

                Object.entries(updatedState).forEach(([key, value]) => {
                    setData(key, value);
                });

                return updatedState;
            });
        } catch (error) {
            console.error('Error during handleUpdate:', error);
        }
    };

    /**
     * Resets the current local state
     */
    const handleReset = () => {
        setLocalState(initialState);
    };

    return (
        <StyledStack>
            <StyledToggleTabsGroup
                variant="fullWidth"
                value={selectedTab}
                style={{
                    width: '100% !important',
                }}
                onChange={(e: React.SyntheticEvent, val: string) => {
                    setSelectedTab(val);
                }}
            >
                <StyledToggleTabsGroupItem label="Data" value={'Data'} />
                <StyledToggleTabsGroupItem label="Tools" value={'Tools'} />
            </StyledToggleTabsGroup>
            <StyledContainer>
                {selectedTab === 'Data' && (
                    <>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Select Display Type
                            </StyledTypography>
                            <Autocomplete
                                options={DATA.displayType}
                                value={localState.displayType}
                                onChange={handleOnChange('displayType')}
                                size="small"
                                fullWidth
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Select Frame
                            </StyledTypography>
                            <Autocomplete
                                options={options}
                                value={localState.frame}
                                onChange={handleOnChange('frame')}
                                size="small"
                                fullWidth={true}
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Select Column
                            </StyledTypography>
                            <Autocomplete
                                options={columnNames}
                                value={localState.column}
                                onChange={handleOnChange('column')}
                                size="small"
                                fullWidth={true}
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                        {localState.displayType === 'Dropdown' && (
                            <StyledSubSection>
                                <StyledTypography variant="body2">
                                    Display Filter Label
                                </StyledTypography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    value={
                                        localState.filterLabel ||
                                        (localState.column
                                            ? `Filter of ${localState.column}`
                                            : '')
                                    }
                                    onChange={(e) =>
                                        updateField(
                                            'filterLabel',
                                            e.target.value,
                                        )
                                    }
                                />
                            </StyledSubSection>
                        )}

                        {localState.displayType === 'Slider' && (
                            <StyledSubSection>
                                <StyledTypography variant="body2">
                                    Slider Sensitivity
                                </StyledTypography>
                                <TextField
                                    size="small"
                                    fullWidth
                                    type="number"
                                    value={localState.sliderSensitivity}
                                    onChange={(e) =>
                                        updateField(
                                            'sliderSensitivity',
                                            e.target.value,
                                        )
                                    }
                                />
                            </StyledSubSection>
                        )}
                        <StyleHorizontalSection>
                            <Switch
                                checked={localState.showPanelTitle}
                                onChange={handleSwitchChange('showPanelTitle')}
                                size="medium"
                                color="secondary"
                            />
                            <StyledTypography
                                variant="body2"
                                sx={{ alignSelf: 'center' }}
                            >
                                Show Panel Title
                            </StyledTypography>
                        </StyleHorizontalSection>
                        <StyleHorizontalSection
                            style={{
                                display:
                                    localState.displayType === 'Slider'
                                        ? 'none'
                                        : 'flex',
                            }}
                        >
                            <Switch
                                checked={localState.searchable}
                                onChange={handleSwitchChange('searchable')}
                                size="medium"
                                color="secondary"
                            />
                            <StyledTypography
                                variant="body2"
                                sx={{ alignSelf: 'center' }}
                            >
                                Searchable
                            </StyledTypography>
                        </StyleHorizontalSection>
                        <StyleHorizontalSection
                            style={{
                                display:
                                    localState.displayType === 'Multiselect' ||
                                    localState.displayType === 'Slider'
                                        ? 'none'
                                        : 'flex',
                            }}
                        >
                            <Switch
                                checked={localState.multipleSelection}
                                onChange={handleSwitchChange(
                                    'multipleSelection',
                                )}
                                size="medium"
                                color="secondary"
                            />
                            <StyledTypography
                                variant="body2"
                                sx={{ alignSelf: 'center' }}
                            >
                                Allow Multiple Selection
                            </StyledTypography>
                        </StyleHorizontalSection>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                mt: 2,
                                alignItems: 'center',
                                width: '100%',
                                gap: 2,
                                pr: 2,
                                position: 'absolute',
                                bottom: 16,
                                left: 0,
                                right: 0,
                                zIndex: 1000,
                            }}
                        >
                            <Button
                                variant="text"
                                onClick={handleReset}
                                sx={{ color: 'secondary' }}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="contained"
                                onClick={handleUpdate}
                                disabled={isApplyDisabled}
                            >
                                Update
                            </Button>
                        </Box>
                    </>
                )}
                {selectedTab === 'Tools' && (
                    <>
                        <Box
                            sx={{
                                width: '100%',
                                padding: '8px 16px',
                                color: '#666666',
                            }}
                        >
                            <SizeSettings
                                id={id}
                                label="Height"
                                path="style.height"
                            />
                        </Box>
                        <Box
                            sx={{
                                width: '100%',
                                padding: '8px 16px',
                                color: '#666666',
                            }}
                        >
                            <SizeSettings
                                id={id}
                                label="Width"
                                path="style.width"
                            />
                        </Box>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Select Button Color
                            </StyledTypography>
                            <Autocomplete
                                options={DATA.colors}
                                value={localState.color || null}
                                onChange={(event, value) => {
                                    setData('color', value);
                                    setLocalState((prev) => ({
                                        ...prev,
                                        color: value,
                                    }));
                                }}
                                size="small"
                                fullWidth={true}
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                        <StyledSubSection>
                            <StyledTypography variant="body2">
                                Select Button Size
                            </StyledTypography>
                            <Autocomplete
                                options={DATA.sizes}
                                value={localState.size || null}
                                onChange={(event, value) => {
                                    setData('size', value);
                                    setLocalState((prev) => ({
                                        ...prev,
                                        size: value,
                                    }));
                                }}
                                size="small"
                                fullWidth={true}
                                multiple={false}
                                renderInput={(params) => (
                                    <TextField {...params} size="small" />
                                )}
                            />
                        </StyledSubSection>
                    </>
                )}
            </StyledContainer>
        </StyledStack>
    );
};
