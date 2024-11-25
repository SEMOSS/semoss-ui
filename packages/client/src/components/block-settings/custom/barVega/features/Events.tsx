import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    TextField,
    Container,
    Stack,
    styled,
    Checkbox,
    Slider,
    Button,
} from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';

const RowContainer = styled(Container)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    gap: theme.spacing(2),
}));

interface EventsSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const Events = observer(
    <D extends BlockDef = BlockDef>({ id, path }: EventsSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState('');

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const reinitializeStates = (state) => {};

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

        // update the value whenever the computed one changes
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);

        return (
            <Stack direction="column">
                <RowContainer sx={{ display: 'flex' }}>
                    <Button>Brush data</Button>
                </RowContainer>
            </Stack>
        );
    },
);
