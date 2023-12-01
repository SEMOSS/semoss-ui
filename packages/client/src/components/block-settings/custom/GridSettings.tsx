import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { styled, MenuItem, Select, Stack, Typography } from '@semoss/ui';

import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';

interface InputSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label to pass into the input
     */
    label: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     *Default value for the property
     */
    defaultValue?: string;
}

interface GridLayoutOption {
    value: string;
    label: string;
    config: { rows: number; cols: number };
}

const StyledLabel = styled(Typography)(({ theme }) => ({
    width: theme.spacing(7),
}));

export const GridSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
    }: InputSettingsProps<D>) => {
        const gridLayouts: GridLayoutOption[] = [
            {
                value: 'layout-0',
                config: { rows: 1, cols: 2 },
                label: '1x2',
            },
            {
                value: 'layout-1',
                config: { rows: 2, cols: 2 },
                label: '2x2',
            },
            {
                value: 'layout-2',
                config: { rows: 3, cols: 3 },
                label: '3x3',
            },
            {
                value: 'layout-3',
                config: { rows: 4, cols: 4 },
                label: 'Layout 3 4x4',
            },
        ];
        const { data, setData } = useBlockSettings(id);

        // track the value
        const [value, setValue] = useState<string>(
            JSON.stringify(gridLayouts[0].value) || '',
        );

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return {
                        value: 'layout-0',
                        config: { rows: 1, cols: 2 },
                        label: '1x2',
                    };
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return {
                        value: 'layout-0',
                        config: { rows: 1, cols: 2 },
                        label: '1x2',
                    };
                } else if (typeof v === 'string') {
                    return JSON.parse(v);
                }

                return v;
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        const [selectedLayout, setSelectedLayout] = useState<
            GridLayoutOption | undefined
        >(gridLayouts[0]);

        const handleChange = (
            event: React.ChangeEvent<{ value: string | unknown }>,
        ) => {
            const newLayoutId = event.target.value as string;
            const newLayout = gridLayouts.find(
                (layout) => layout.value === newLayoutId,
            );

            // set the value
            setValue(JSON.stringify(newLayoutId));
            setSelectedLayout(newLayout);

            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(
                        path,
                        newLayout as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <Stack
                direction="row"
                alignItems={'center'}
                title={`Edit ${label}`}
            >
                <StyledLabel variant="body2" noWrap={true}>
                    Layout
                </StyledLabel>
                <Select
                    id="grid-layout-select"
                    value={value}
                    onChange={handleChange}
                    label="Grid Layout"
                >
                    {gridLayouts.map((layout) => (
                        <MenuItem key={layout.label} value={layout.value}>
                            {`Rows: ${layout.config.rows}, cols: ${layout.config.cols}`}
                        </MenuItem>
                    ))}
                </Select>
            </Stack>
        );
    },
);
