import { useState, useEffect, useMemo, useRef } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { Container, Autocomplete, TextField, styled } from '@semoss/ui';
import { BaseSettingSection } from '@/components/block-settings';
import { VegaVisualizationBlockDef } from '@/components/block-defaults/vega-visualization-block';
import { useBlockSettings, useFrameHeaders } from '@/hooks';
import { Block, BlockDef } from '@/stores';
import { Paths, PathValue } from '@/types';
import { getValueByPath } from '@/utility';

const NoPaddingContainer = styled(Container)(({ theme }) => ({
    padding: '0px!important',
}));
const RowContainer = styled(Container)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    gap: theme.spacing(2),
}));

interface FieldsSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const Fields = observer(
    <D extends BlockDef = BlockDef>({ id, path }: FieldsSettingsProps<D>) => {
        const { data, setData } =
            useBlockSettings<VegaVisualizationBlockDef>(id);
        // track the value
        const [value, setValue] = useState('');
        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        //local states
        const [xAxis, setXAxis] = useState<string>('');
        const [yAxis, setYAxis] = useState<string>('');

        // get headers associated with the selected frames
        const frameHeaders = useFrameHeaders(data.frame.name);
        const fields = frameHeaders.data.list.map((field) => field.alias) || [];

        const reinitializeStates = (state) => {
            setXAxis(state.xAxis ?? '');
            setYAxis(state.yAxis ?? '');
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
                if (state && state.hasOwnProperty('fields')) {
                    reinitializeStates(state['fields']);
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
                    setData(
                        'specJson',
                        newSpec as PathValue<D['data'], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const handleAxisChange = (newValue: string, axis: 'x' | 'y') => {
            if (axis === 'x') {
                setXAxis(newValue);
            } else if (axis === 'y') {
                setYAxis(newValue);
            }
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`],
                field: newValue,
            };

            tempValue['_state']['fields'] = {
                ...tempValue['_state']['fields'],
                xAxis: axis === 'x' ? newValue : xAxis,
                yAxis: axis === 'y' ? newValue : yAxis,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        return (
            <>
                <BaseSettingSection label="x-Axis">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={data.frame.name === ''}
                        value={xAxis}
                        options={fields}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // updata specjson value
                            handleAxisChange(value, 'x');
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select frame"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    />
                </BaseSettingSection>
                <BaseSettingSection label="y-Axis">
                    <Autocomplete
                        fullWidth
                        multiple={false}
                        disabled={data.frame.name === ''}
                        value={yAxis}
                        options={fields}
                        getOptionLabel={(option) => {
                            return option;
                        }}
                        onChange={(_, value) => {
                            // updata specjson value
                            handleAxisChange(value, 'y');
                        }}
                        freeSolo={false}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                placeholder="Select frame"
                                size="small"
                                variant="outlined"
                            />
                        )}
                    />
                </BaseSettingSection>
            </>
        );
    },
);
