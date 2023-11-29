import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { IconButton } from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
} from '@mui/icons-material';

interface TextStyleSettingButtonProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    /**
     * Style type
     */
    type: 'bold' | 'underlined' | 'italic';
}

const STYLE_TYPES = {
    bold: {
        label: 'Bold',
        value: 'bold',
        icon: <FormatBold />,
    },
    underlined: {
        label: 'Underlined',
        value: 'underline',
        icon: <FormatUnderlined />,
    },
    italic: {
        label: 'Italic',
        value: 'italic',
        icon: <FormatItalic />,
    },
};

export const TextStyleSettingButton = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        type,
    }: TextStyleSettingButtonProps<D>) => {
        const { data, setData } = useBlockSettings(id);

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
        const onClick = () => {
            const newValue =
                value !== STYLE_TYPES[type].value
                    ? STYLE_TYPES[type].value
                    : 'inherit';
            setValue(newValue);

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
                        newValue as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        return (
            <IconButton
                color={value == STYLE_TYPES[type].value ? 'primary' : undefined}
                size="small"
                onClick={onClick}
                title={STYLE_TYPES[type].label}
            >
                {STYLE_TYPES[type].icon}
            </IconButton>
        );
    },
);
