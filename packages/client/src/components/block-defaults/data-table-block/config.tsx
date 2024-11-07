// config.tsx
import { useState, useRef } from 'react';
import { BlockConfig, BlockDef, Block } from '@/stores';
import { QuerySelectionSettings } from '@/components/block-settings';
import { DataTableBlock, DataTableBlockDef } from './DataTableBlock';
import { TableChart } from '@mui/icons-material';
import { buildListener } from '../block-defaults.shared';
import { BLOCK_TYPE_INPUT } from '../block-defaults.constants';
import { SwitchSettings } from '@/components/block-settings/shared/SwitchSettings';
import { Autocomplete, Typography, Stack, Button } from '@mui/material';
import { BaseSettingSection } from '@/components/block-settings/BaseSettingSection';
import { useBlockSettings } from '@/hooks';
import { Paths, PathValue } from '@/types';
import { TableHeaderSettings } from '@/components/block-settings/custom/TableHeaderSettings';
import { InputSettings } from '@/components/block-settings';
import { TextField } from '@semoss/ui';
const DATA_SOURCE_OPTIONS = [
    { label: 'Query Input', value: 'query' },
    { label: 'File Upload', value: 'file' },
];

const SettingAutocomplete = <D extends BlockDef>({
    id,
    path,
    options,
    initialValue,
    onValueChange,
}: {
    id: string;
    path: Paths<Block<D>['data'], 4>;
    options: Array<{ label: string; value: string }>;
    label: string;
    initialValue?: string;
    onValueChange?: (value: string) => void;
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
                if (onValueChange) {
                    onValueChange(newValue || '');
                }
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
        />
    );
};

export const config: BlockConfig<DataTableBlockDef> = {
    widget: 'table',
    type: BLOCK_TYPE_INPUT,
    data: {
        style: {
            margin: '8px',
        },
        rawData: '',
        displayData: [],
        headers: [],
        enablePagination: false,
        rowsPerPage: 10,
        enableSorting: false,
        enableActions: false,
        noDataText: 'No data available',
        loading: false,
        fileType: undefined,
        dataSource: undefined,
    },
    listeners: {
        onChange: [],
    },
    slots: {
        content: [],
    },
    render: DataTableBlock,
    icon: TableChart,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Headers',
                    render: ({ id }) => (
                        <TableHeaderSettings id={id} path="headers" />
                    ),
                },
                {
                    description: 'Data Source Type',
                    render: ({ id }) => {
                        const { data, setData } =
                            useBlockSettings<DataTableBlockDef>(id);
                        const [selectedFile, setSelectedFile] = useState<
                            string | null
                        >(null);
                        const [uploadKey, setUploadKey] = useState(0);

                        // Handle query data in similar way as file
                        const processQueryData = () => {
                            if (data.dataSource === 'query' && data.rawData) {
                                try {
                                    let queryOutput;

                                    // Handle both string template and direct array data
                                    if (Array.isArray(data.rawData)) {
                                        // Handle direct array case
                                        queryOutput = data.rawData;
                                    }

                                    if (
                                        Array.isArray(queryOutput) &&
                                        queryOutput.length > 0
                                    ) {
                                        // Set displayData first
                                        setData('displayData', queryOutput);

                                        // Then handle headers exactly like file upload
                                        if (!data.headers?.length) {
                                            const generatedHeaders =
                                                Object.keys(queryOutput[0]).map(
                                                    (key) => ({
                                                        display:
                                                            key
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                            key
                                                                .slice(1)
                                                                .replace(
                                                                    /_/g,
                                                                    ' ',
                                                                ),
                                                        value: key,
                                                    }),
                                                );
                                            setData(
                                                'headers',
                                                generatedHeaders,
                                            );
                                        }
                                    }
                                } catch (error) {
                                    console.error(
                                        'Error processing query data:',
                                        error,
                                    );
                                }
                            }
                        };

                        const handleDataSourceChange = () => {
                            // Clear previous data when source changes
                            setData('rawData', '');
                            setData('fileType', undefined);
                            setData('displayData', []);
                            setData('headers', []);
                            setSelectedFile(null);
                            setUploadKey((prev) => prev + 1);
                        };

                        return (
                            <Stack spacing={2}>
                                <BaseSettingSection label="Data Source">
                                    <SettingAutocomplete
                                        id={id}
                                        path="dataSource"
                                        options={DATA_SOURCE_OPTIONS}
                                        label="Select Data Source"
                                        onValueChange={handleDataSourceChange}
                                    />
                                </BaseSettingSection>

                                {data.dataSource === 'query' && (
                                    <QuerySelectionSettings
                                        id={id}
                                        label="Data Source Query"
                                        path="rawData"
                                        queryPath="output"
                                        __onChange={() => {
                                            processQueryData();
                                        }}
                                    />
                                )}

                                {data.dataSource === 'file' && (
                                    <BaseSettingSection label="File Upload">
                                        <Stack spacing={1}>
                                            <Button
                                                variant="outlined"
                                                component="label"
                                                fullWidth
                                                size="medium"
                                                style={{ minWidth: '250px' }}
                                            >
                                                {selectedFile || 'Choose File'}
                                                <input
                                                    type="file"
                                                    hidden
                                                    accept=".json,.csv"
                                                    onChange={async (e) => {
                                                        const file =
                                                            e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const content =
                                                                    await file.text();
                                                                const extension =
                                                                    file.name
                                                                        .split(
                                                                            '.',
                                                                        )
                                                                        .pop()
                                                                        ?.toLowerCase();

                                                                if (
                                                                    extension ===
                                                                        'json' ||
                                                                    extension ===
                                                                        'csv'
                                                                ) {
                                                                    let parsedData;
                                                                    if (
                                                                        extension ===
                                                                        'json'
                                                                    ) {
                                                                        parsedData =
                                                                            JSON.parse(
                                                                                content,
                                                                            );
                                                                    } else {
                                                                        // Parse CSV
                                                                        const rows =
                                                                            content
                                                                                .split(
                                                                                    '\n',
                                                                                )
                                                                                .filter(
                                                                                    (
                                                                                        row,
                                                                                    ) =>
                                                                                        row.trim(),
                                                                                );
                                                                        const headers =
                                                                            rows[0]
                                                                                .split(
                                                                                    ',',
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        h,
                                                                                    ) =>
                                                                                        h.trim(),
                                                                                );
                                                                        parsedData =
                                                                            rows
                                                                                .slice(
                                                                                    1,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        row,
                                                                                    ) => {
                                                                                        const values =
                                                                                            row
                                                                                                .split(
                                                                                                    ',',
                                                                                                )
                                                                                                .map(
                                                                                                    (
                                                                                                        val,
                                                                                                    ) =>
                                                                                                        val.trim(),
                                                                                                );
                                                                                        return headers.reduce(
                                                                                            (
                                                                                                obj,
                                                                                                header,
                                                                                                index,
                                                                                            ) => {
                                                                                                obj[
                                                                                                    header
                                                                                                ] =
                                                                                                    values[
                                                                                                        index
                                                                                                    ] ||
                                                                                                    '';
                                                                                                return obj;
                                                                                            },
                                                                                            {},
                                                                                        );
                                                                                    },
                                                                                );
                                                                    }

                                                                    setSelectedFile(
                                                                        file.name,
                                                                    );
                                                                    setData(
                                                                        'rawData',
                                                                        content,
                                                                    );
                                                                    setData(
                                                                        'fileType',
                                                                        extension as
                                                                            | 'json'
                                                                            | 'csv',
                                                                    );
                                                                    setData(
                                                                        'displayData',
                                                                        parsedData,
                                                                    );

                                                                    if (
                                                                        !data
                                                                            .headers
                                                                            ?.length &&
                                                                        parsedData.length >
                                                                            0
                                                                    ) {
                                                                        const generatedHeaders =
                                                                            Object.keys(
                                                                                parsedData[0],
                                                                            ).map(
                                                                                (
                                                                                    key,
                                                                                ) => ({
                                                                                    display:
                                                                                        key
                                                                                            .charAt(
                                                                                                0,
                                                                                            )
                                                                                            .toUpperCase() +
                                                                                        key
                                                                                            .slice(
                                                                                                1,
                                                                                            )
                                                                                            .replace(
                                                                                                /_/g,
                                                                                                ' ',
                                                                                            ),
                                                                                    value: key,
                                                                                }),
                                                                            );
                                                                        setData(
                                                                            'headers',
                                                                            generatedHeaders,
                                                                        );
                                                                    }
                                                                }
                                                            } catch (error) {
                                                                console.error(
                                                                    'Error reading file:',
                                                                    error,
                                                                );
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Button>
                                            {selectedFile && (
                                                <Typography
                                                    variant="caption"
                                                    color="textSecondary"
                                                >
                                                    Selected file:{' '}
                                                    {selectedFile}
                                                </Typography>
                                            )}
                                        </Stack>
                                    </BaseSettingSection>
                                )}
                            </Stack>
                        );
                    },
                },
                {
                    description: 'No Data Text',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="No Data Text"
                            path="noDataText"
                        />
                    ),
                },
            ],
        },
        {
            name: 'Table Settings',
            children: [
                {
                    description: 'Pagination',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Pagination"
                            path="enablePagination"
                        />
                    ),
                },
                {
                    description: 'Rows Per Page',
                    render: ({ id }) => (
                        <InputSettings
                            id={id}
                            label="Rows Per Page"
                            path="rowsPerPage"
                        />
                    ),
                },
                {
                    description: 'Sorting',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Sorting"
                            path="enableSorting"
                        />
                    ),
                },
                {
                    description: 'Actions',
                    render: ({ id }) => (
                        <SwitchSettings
                            id={id}
                            label="Enable Actions"
                            path="enableActions"
                            description="Adds a delete action column"
                        />
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
