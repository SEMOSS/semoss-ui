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
    Switch,
    Typography,
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

        //local state
        const [brushEvent, setBrushEvent] = useState<boolean>(true);
        const [clickEvent, setClickEvent] = useState<boolean>(true);

        // track the value
        const [value, setValue] = useState('');

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const reinitializeStates = (state) => {
            setBrushEvent(state.brushEvent ?? true);
        };

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

        useEffect(() => {
            if (data) {
                const json: PathValue<D['data'], typeof path> =
                    JSON.parse(computedValue);
                let state = json['_state'];
                if (state && state.hasOwnProperty('events')) {
                    reinitializeStates(state['events']);
                } else {
                    json['_state'] = {};
                    setValue(JSON.stringify(json, null, 2));
                }
            }
        }, []);

        const dispatchData = (newSpec: PathValue<D['data'], typeof path>) => {
            // clear out he old timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    // set the value
                    setData(path, newSpec as PathValue<D['data'], typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const handleChange = (newVal: boolean, eventType: string) => {
            setBrushEvent(newVal);
            // insert the new value
            let tempValue = JSON.parse(value);
            if (eventType === 'brush') {
                setBrushEvent(newVal);

                if (newVal) {
                    tempValue['layer'][0]['selection'] = {
                        brush: {
                            type: 'interval',
                            encodings: ['x', 'y'],
                        },
                    };
                } else {
                    tempValue['layer'][0]['selection']['brush']['encodings'] =
                        [];
                }

                tempValue['_state']['events'] = {
                    ...tempValue['_state']['events'],
                    brushEvent: newVal,
                };
            }

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        return (
            <Stack direction="column">
                <RowContainer sx={{ display: 'flex' }}>
                    <Typography variant="body1">Brush Event</Typography>
                    <Switch
                        color="primary"
                        checked={brushEvent}
                        onChange={() => handleChange(!brushEvent, 'brush')}
                    />
                </RowContainer>
            </Stack>
        );
    },
);
