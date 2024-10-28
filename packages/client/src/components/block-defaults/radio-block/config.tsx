// config.tsx
import { useState, useRef } from 'react';
import { Block, BlockDef, BlockConfig } from '@/stores';
import { InputSettings } from '@/components/block-settings';
import { RadioBlock, RadioBlockDef } from './RadioBlock';
import RadioButtonCheckedOutlinedIcon from '@mui/icons-material/RadioButtonCheckedOutlined';
import { buildListener } from '../block-defaults.shared';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';
import { Autocomplete, Stack, Button } from '@mui/material';
import { BaseSettingSection } from '@/components/block-settings/BaseSettingSection';
import { useBlockSettings, useBlock } from '@/hooks';
import { TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';

// Define options
const SIZE_OPTIONS = [
    { label: 'Small', value: 'small' },
    { label: 'Medium', value: 'medium' },
];

const DIRECTION_OPTIONS = [
    { label: 'Row', value: 'row' },
    { label: 'Column', value: 'column' },
];

const COLOR_OPTIONS = [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Error', value: 'error' },
    { label: 'Info', value: 'info' },
    { label: 'Success', value: 'success' },
    { label: 'Warning', value: 'warning' },
    { label: 'Default', value: 'default' },
];

const LABEL_PLACEMENT_OPTIONS = [
    { label: 'Start', value: 'start' },
    { label: 'End', value: 'end' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
];

const SettingAutocomplete = <D extends BlockDef>({
    id,
    path,
    options,
    initialValue,
}: {
    id: string;
    path: Paths<Block<D>['data'], 4>;
    options: Array<{ label: string; value: string }>;
    label: string;
    initialValue?: string;
}) => {
    const { data, setData } = useBlockSettings<D>(id);
    const [selectedValue, setSelectedValue] = useState(
        data[path] || initialValue,
    );
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

    const setBlockData = (newValue: string | undefined) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        timeoutRef.current = setTimeout(() => {
            try {
                setData(path, newValue as PathValue<D['data'], typeof path>);
                setSelectedValue(newValue);
            } catch (e) {
                console.log(e);
            }
        }, 300);
    };

    return (
        <Autocomplete
            fullWidth
            options={options}
            value={options.find((opt) => opt.value === selectedValue) || null}
            onChange={(_, newValue) => {
                setBlockData(newValue?.value);
            }}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
                option.value === value.value
            }
            renderInput={(params) => (
                <TextField {...params} size="small" variant="outlined" />
            )}
            disableClearable
        />
    );
};

export const config: BlockConfig<RadioBlockDef> = {
    widget: 'radio',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            padding: '4px',
        },
        value: 'yes',
        label: 'Radio Group',
        options: [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
        ],
        size: 'medium',
        direction: 'row',
        color: 'primary',
        labelPlacement: 'end',
        required: false,
        disabled: false,
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: RadioBlock,
    icon: RadioButtonCheckedOutlinedIcon,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Options Management',
                    render: ({ id }) => {
                        const { data, setData } =
                            useBlockSettings<RadioBlockDef>(id);
                        const [numAdditionalOptions, setNumAdditionalOptions] =
                            useState<string>('');
                        const [optionLabels, setOptionLabels] =
                            useState<string>('');

                        const handleAddOptions = () => {
                            const num = parseInt(numAdditionalOptions);
                            if (num > 0 && optionLabels) {
                                const labels = optionLabels
                                    .split(',')
                                    .map((label) => label.trim());
                                const newOptions = labels
                                    .slice(0, num)
                                    .map((label) => ({
                                        label,
                                        value: label
                                            .toLowerCase()
                                            .replace(/\s+/g, '_'),
                                    }));

                                setData('options', [
                                    ...(data.options as Array<{
                                        label: string;
                                        value: string;
                                    }>),
                                    ...newOptions,
                                ]);
                                setNumAdditionalOptions('');
                                setOptionLabels('');
                            }
                        };

                        // Find the current option object for the selected value
                        return (
                            <Stack spacing={2}>
                                <BaseSettingSection label="Number of Options">
                                    <TextField
                                        fullWidth
                                        size="small"
                                        type="number"
                                        value={numAdditionalOptions}
                                        onChange={(e) =>
                                            setNumAdditionalOptions(
                                                e.target.value,
                                            )
                                        }
                                        inputProps={{ min: 1 }}
                                    />
                                </BaseSettingSection>
                                {numAdditionalOptions &&
                                    parseInt(numAdditionalOptions) > 0 && (
                                        <BaseSettingSection label="Option Labels">
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={optionLabels}
                                                onChange={(e) =>
                                                    setOptionLabels(
                                                        e.target.value,
                                                    )
                                                }
                                                helperText="Enter labels separated by commas"
                                            />
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={handleAddOptions}
                                                sx={{ mt: 1 }}
                                                style={{ height: '40px' }}
                                                fullWidth
                                            >
                                                Add Options
                                            </Button>
                                        </BaseSettingSection>
                                    )}

                                {/* Current Value Selection */}
                                <BaseSettingSection label="Selected Value">
                                    <Autocomplete
                                        value={
                                            data.options.find(
                                                (opt) =>
                                                    opt.value === data.value,
                                            ) ?? data.options[0]
                                        }
                                        options={data.options}
                                        onChange={(_, newValue) => {
                                            if (newValue) {
                                                setData(
                                                    'value',
                                                    newValue.value,
                                                );
                                            }
                                        }}
                                        getOptionLabel={(option) =>
                                            option.label
                                        }
                                        isOptionEqualToValue={(option, value) =>
                                            option.value === value.value
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                        fullWidth
                                    />
                                </BaseSettingSection>
                            </Stack>
                        );
                    },
                },
                {
                    description: 'Size',
                    render: ({ id }) => {
                        return (
                            <BaseSettingSection label="Size">
                                <SettingAutocomplete
                                    id={id}
                                    path="size"
                                    options={SIZE_OPTIONS}
                                    label="Size"
                                    initialValue="medium"
                                />
                            </BaseSettingSection>
                        );
                    },
                },
                {
                    description: 'Direction',
                    render: ({ id }) => {
                        return (
                            <BaseSettingSection label="Direction">
                                <SettingAutocomplete
                                    id={id}
                                    path="direction"
                                    options={DIRECTION_OPTIONS}
                                    label="Direction"
                                    initialValue="row"
                                />
                            </BaseSettingSection>
                        );
                    },
                },
                {
                    description: 'Color',
                    render: ({ id }) => {
                        return (
                            <BaseSettingSection label="Color">
                                <SettingAutocomplete
                                    id={id}
                                    path="color"
                                    options={COLOR_OPTIONS}
                                    label="Color"
                                    initialValue="primary"
                                />
                            </BaseSettingSection>
                        );
                    },
                },
                {
                    description: 'Label Placement',
                    render: ({ id }) => {
                        return (
                            <BaseSettingSection label="Label Placement">
                                <SettingAutocomplete
                                    id={id}
                                    path="labelPlacement"
                                    options={LABEL_PLACEMENT_OPTIONS}
                                    label="Label Placement"
                                    initialValue="end"
                                />
                            </BaseSettingSection>
                        );
                    },
                },
                {
                    description: 'Required',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Required"
                            path="required"
                        />
                    ),
                },
                {
                    description: 'Disabled',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Disabled"
                            path="disabled"
                        />
                    ),
                },
                {
                    description: 'Label',
                    render: ({ id }) => (
                        <InputSettings id={id} label="Label" path="label" />
                    ),
                },
            ],
        },
        {
            name: 'on Change',
            children: [...buildListener('onChange')],
        },
    ],
    styleMenu: [],
};
