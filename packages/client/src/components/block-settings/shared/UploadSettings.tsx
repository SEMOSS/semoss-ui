import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { TextField } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { BaseSettingSection } from '../BaseSettingSection';
import { upload } from '@/api';

interface UploadSettingsProps<D extends BlockDef = BlockDef> {
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
     * Path to use as a restriction on uploads
     * Ex: extensions we want to limit
     */
    restrictPath?: Paths<Block<D>['data'], 4>;
}

export const UploadSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label = '',
        path,
        restrictPath,
    }: UploadSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const { state } = useBlocks();

        // track the value
        const [value, setValue] = useState('');

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return '';
                }

                const v = getValueByPath(data, path);
                if (typeof v === 'undefined') {
                    return '';
                } else if (typeof v === 'string') {
                    return v;
                }

                return JSON.stringify(v);
            });
        }, [data, path]).get();

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        /**
         * Sync the data on change
         */
        const onChange = async (file: File) => {
            if (!file) {
                return;
            }

            try {
                // upload the file
                const uploadedFiles = await upload(
                    [file],
                    state.insightId,
                    '',
                    '',
                );

                // ignore if false is returned
                if (!uploadedFiles) {
                    return;
                }

                // get the location.
                const { fileLocation } = uploadedFiles[0];
                if (!fileLocation) {
                    throw new Error('Missing File Location');
                }

                // clear out he old timeout
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }

                timeoutRef.current = setTimeout(() => {
                    try {
                        setData(
                            path,
                            fileLocation as PathValue<D['data'], typeof path>,
                        );
                    } catch (e) {
                        console.log(e);
                    }
                }, 300);
            } catch (e) {
                console.error(e);
            }
        };

        return (
            <BaseSettingSection label={label}>
                <TextField
                    fullWidth
                    onChange={(e) => {
                        const files = (e.target as HTMLInputElement).files;

                        // upload the new file on change
                        onChange(files[0]);
                    }}
                    type={'file'}
                    inputProps={{ accept: data[restrictPath] }}
                    size="small"
                    variant="outlined"
                    autoComplete="off"
                />
            </BaseSettingSection>
        );
    },
);
