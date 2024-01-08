import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Autocomplete, TextField } from '@mui/material';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import { Checklist } from '@semoss/ui';

interface PageSelectionSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     * Settings label
     */
    label: string;
}

/**
 * Specifically for selecting a query for to associate with loading/disabled/etc
 */
export const PageSelectionSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        label,
    }: PageSelectionSettingsProps<D>) => {
        const { data, setData } = useBlockSettings(id);
        const { state } = useBlocks();

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // available pages for checklist
        const pages = computed(() => {
            const pages: {
                route: string;
                name: string;
                id: string;
                label: string;
            }[] = [];
            for (const b in state.blocks) {
                const block = state.blocks[b];

                // check if it is a page widget
                if (block.widget === 'page') {
                    // store the pages
                    pages.push({
                        id: block.id,
                        label: (block.data?.route as string) || 'home',
                        name: (block.data?.name as string) || '',
                        route: (block.data?.route as string) || '',
                    });
                }
            }

            // sort by the path
            return pages.sort((a, b) => {
                const aRoute = a.route.toLowerCase(),
                    bRoute = b.route.toLowerCase();

                if (aRoute < bRoute) {
                    return -1;
                }
                if (aRoute > bRoute) {
                    return 1;
                }
                return 0;
            });
        }).get();

        /**
         * Sync the data on change
         */
        const onChange = (value) => {
            // clear out the old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(path, value as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <BaseSettingSection
                label={label}
                direction={'column'}
                alignItems={'flex-start'}
            >
                <Checklist
                    getKey={(option) => option.id}
                    onChange={onChange}
                    options={pages}
                    checked={data.pages}
                />
            </BaseSettingSection>
        );
    },
);
