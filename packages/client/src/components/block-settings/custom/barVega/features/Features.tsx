import { useEffect, useMemo, useRef, useState } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import {
    TextField,
    Container,
    Stack,
    Accordion,
    styled,
    Typography,
    Button,
    Checkbox,
    RadioGroup,
} from '@semoss/ui';
import { Paths, PathValue } from '@/types';
import { useBlockSettings, useBlocks } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { getValueByPath } from '@/utility';
import { ColorByValue } from '../../../shared';

const NoPaddingContainer = styled(Container)(({ theme }) => ({
    padding: '0px!important',
}));
const RowContainer = styled(Container)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    gap: theme.spacing(2),
}));
const StyledAccordion = styled(Accordion)(({ theme }) => ({
    boxShadow: 'none',
    borderRadius: '0 !important',
    border: `1px solid ${theme.palette.divider}`,
    '&:before': {
        display: 'none',
    },
    '&.Mui-expanded': {
        margin: '0',
    },
}));

interface FeaturesSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;

    value: string;

    setValue: (value: string) => void;
}

export const Features = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        value,
        setValue,
    }: FeaturesSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        //local states
        const [trendLine, setTrendLine] = useState('NoTrendLine');

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const reinitializeStates = (state) => {
            setTrendLine(state['trendLine'] ?? 'NoTrendLine');
        };

        useEffect(() => {
            if (value) {
                const json: PathValue<D['data'], typeof path> =
                    JSON.parse(value);
                let state = json['_state'];
                if (state && state.hasOwnProperty('features')) {
                    reinitializeStates(state['features']);
                }
            }
        }, [value]);

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

        const handleExcecute = () => {
            // insert the new value
            let tempValue = JSON.parse(value);
            let { field: xField, type: xType } =
                tempValue['layer'][0]['encoding']['x'];
            let { field: yField, type: yType } =
                tempValue['layer'][0]['encoding']['y'];
            let lineLayer = {};
            if (trendLine !== 'NoTrendLine') {
                lineLayer = {
                    mark: {
                        type: 'line',
                        color: 'orange',
                        interpolate: trendLine,
                        strokeWidth: 2,
                    },
                    encoding: {
                        x: { field: xField, type: xType },
                        y: { field: yField, type: yType },
                    },
                };
                const lineIndex = tempValue['layer'].findIndex(
                    (obj) => obj.mark.type === 'line',
                );
                // update trendline selection
                if (lineIndex !== -1) {
                    tempValue['layer'][lineIndex] = lineLayer;
                } else {
                    tempValue['layer'].push(lineLayer);
                }
            }

            tempValue['_state']['features'] = {
                ...tempValue['_state']['features'],
                trendLine: trendLine,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleTrendLineSelection = (selected: string) => {
            setTrendLine(selected);
        };

        return (
            <Stack>
                <Stack>
                    <Typography variant="body1">TrendLine</Typography>
                    <RadioGroup
                        value={trendLine}
                        onChange={(e) => {
                            handleTrendLineSelection(e.target.value);
                        }}
                    >
                        <RadioGroup.Item
                            value="NoTrendLine"
                            label="No Trendline"
                        />
                        <RadioGroup.Item value="monotone" label="Smooth" />
                        <RadioGroup.Item value="linear" label="Exact" />
                        <RadioGroup.Item value="step" label="Step (start)" />
                        <RadioGroup.Item
                            value="step-before"
                            label="Step (middle)"
                        />
                        <RadioGroup.Item
                            value="step-after"
                            label="Step (end)"
                        />
                    </RadioGroup>
                </Stack>
                <Button onClick={handleExcecute}>Excecute</Button>
            </Stack>
        );
    },
);
