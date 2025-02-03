import React, { useState, useRef } from 'react';
import { BlockConfig } from '@/stores';
import {
    DynamicComponentBlockDef,
    DynamicComponentBlock,
} from './DynamicComponentBlock';
import { Extension } from '@mui/icons-material';
import { InputSettings } from '@/components/block-settings';
import { BlockDef, Block } from '@/stores';
import { Paths, PathValue } from '@/types';
import { BaseSettingSection } from '@/components/block-settings/BaseSettingSection';
import { Autocomplete } from '@mui/material';
import { TextField } from '@semoss/ui';
import { useBlockSettings } from '@/hooks';
import { PropInputSettings } from '@/components/block-settings';
// Import the generated registry
import { componentRegistry } from '../../custom-components/registry';

const COMPONENT_OPTIONS = [
    { value: 'welcome-card/index', label: 'Welcome Card' },
    { value: 'counter-box/index', label: 'Counter Box' },
];

const SettingAutocomplete = <D extends BlockDef>({
    id,
    path,
    initialValue,
    onValueChange,
}: {
    id: string;
    path: Paths<Block<D>['data'], 4>;
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
            options={componentRegistry}
            value={
                componentRegistry.find((opt) => opt.value === selectedValue) ||
                null
            }
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

export const config: BlockConfig<DynamicComponentBlockDef> = {
    widget: 'dynamic-component',
    type: 'BLOCK_TYPE_DISPLAY',
    data: {
        style: {},
        componentPath: '',
        componentProps: {},
    },
    listeners: {},
    slots: {
        content: [],
    },
    render: DynamicComponentBlock,
    icon: Extension,
    contentMenu: [
        {
            name: 'General',
            children: [
                {
                    description: 'Component',
                    render: ({ id }) => {
                        const [selectedComponent, setSelectedComponent] =
                            useState<string>('');
                        const { setData } =
                            useBlockSettings<DynamicComponentBlockDef>(id);

                        return (
                            <>
                                <BaseSettingSection label="Select Component">
                                    <SettingAutocomplete
                                        id={id}
                                        path="componentPath"
                                        label="Component"
                                        onValueChange={(value) => {
                                            setSelectedComponent(value);
                                            setData('componentProps', {});
                                        }}
                                    />
                                </BaseSettingSection>

                                {selectedComponent &&
                                    componentRegistry
                                        .find(
                                            (c) =>
                                                c.value === selectedComponent,
                                        )
                                        ?.properties?.map((prop) => (
                                            <PropInputSettings
                                                key={prop.name}
                                                id={id}
                                                label={prop.name}
                                                path="componentProps"
                                                propType={prop.type}
                                                defaultValue={prop.default}
                                                description={prop.description}
                                            />
                                        ))}
                            </>
                        );
                    },
                },
            ],
        },
    ],
    styleMenu: [],
};
