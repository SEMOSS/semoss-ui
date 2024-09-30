// CssEditorSettings is a dup of JsonSettings with LLM prompting and wordwrap added to the editor and ability to work with HTML as well as JSON
import { useRef, useState, useMemo, useEffect } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { getValueByPath } from '@/utility';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { Editor } from '@monaco-editor/react';

interface CssEditorSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const CssEditorSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
    }: CssEditorSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState('{}');

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

                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();

        // update the value if the computed one is diffecent from the current one
        useEffect(() => {
            if (computedValue?.length && computedValue !== value) {
                setValue(computedValue);
            }
        }, [computedValue, data]);

        /**
         * Sync the data on change
         */
        const onChange = (value: string) => {
            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            let customStyleValue = {};
            try {
                // set the value .replaceAll("'", '"')
                setValue(value);
                customStyleValue = value
                    ? JSON.parse(`${value.replaceAll(';', ',')}`)
                    : {};
                timeoutRef.current = setTimeout(() => {
                    try {
                        // set the value
                        setData(
                            path,
                            customStyleValue as PathValue<
                                D['data'],
                                typeof path
                            >,
                        );
                    } catch (e) {
                        console.log(e);
                    }
                }, 300);
            } catch (e) {
                /* empty */
            }
        };

        return (
            <>
                <Editor
                    key={id}
                    width={'100%'}
                    height={'200px'}
                    value={value}
                    language="json"
                    options={{
                        lineNumbers: 'on',
                        readOnly: false,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        lineHeight: 19,
                        overviewRulerBorder: false,
                    }}
                    onChange={(e) => {
                        onChange(e);
                    }}
                />
            </>
        );
    },
);
