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

interface AxisSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>['data'], 4>;
}

export const Axis = observer(
    <D extends BlockDef = BlockDef>({ id, path }: AxisSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        // track the value
        const [value, setValue] = useState('');

        const [showXAxis, setShowXAxis] = useState<boolean>(true);
        const [showYAxis, setShowYAxis] = useState<boolean>(true);
        const [xAxisTitle, setXAxisTitle] = useState<string>('');
        const [yAxisTitle, setYAxisTitle] = useState<string>('');
        const [showXAxisTitle, setShowXAxisTitle] = useState<boolean>(true);
        const [showYAxisTitle, setShowYAxisTitle] = useState<boolean>(true);
        const [showXTicks, setShowXTicks] = useState<boolean>(true);
        const [showYTicks, setShowYTicks] = useState<boolean>(true);
        const [xAxisRotation, setXAxisRotation] = useState<number>(0);
        const [yAxisRotation, setYAxisRotation] = useState<number>(0);
        const [xPrependVal, setXPrependVal] = useState<string>('');
        const [yPrependVal, setYPrependVal] = useState<string>('');
        const [xAppendVal, setXAppendVal] = useState<string>('');
        const [yAppendVal, setYAppendVal] = useState<string>('');
        const [xFontSize, setXFontSize] = useState<number>(12);
        const [yFontSize, setYFontSize] = useState<number>(12);
        const [xTitleFontSize, setXTitleFontSize] = useState<number>(12);
        const [yTitleFontSize, setYTitleFontSize] = useState<number>(12);

        // track the ref to debounce the input
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

        const reinitializeStates = (state) => {
            setShowXAxis(state.showXAxis ?? true);
            setShowYAxis(state.showYAxis ?? true);
            setXAxisTitle(state.xAxisTitle ?? '');
            setYAxisTitle(state.yAxisTitle ?? '');
            setShowXAxisTitle(state.showXAxisTitle ?? true);
            setShowYAxisTitle(state.showYAxisTitle ?? true);
            setShowXTicks(state.showXTicks ?? true);
            setShowYTicks(state.showYTicks ?? true);
            setXAxisRotation(state.xAxisRotation ?? 0);
            setYAxisRotation(state.yAxisRotation ?? 0);
            setXPrependVal(state.xPrependVal ?? '');
            setYPrependVal(state.yPrependVal ?? '');
            setXAppendVal(state.xAppendVal ?? '');
            setYAppendVal(state.yAppendVal ?? '');
            setXFontSize(state.xFontSize ?? 12);
            setYFontSize(state.yFontSize ?? 12);
            setXTitleFontSize(state.xTitleFontSize ?? 12);
            setYTitleFontSize(state.yTitleFontSize ?? 12);
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
                if (state && state.hasOwnProperty('axis')) {
                    reinitializeStates(state['axis']);
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

        const handleShowAxisLine = (axis: string, canShow: boolean) => {
            if (axis === 'x') {
                setShowXAxis(canShow);
            } else if (axis === 'y') {
                setShowYAxis(canShow);
            }
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`]['axis'] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`]['axis'],
                domain: canShow,
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                showXAxis: axis === 'x' ? canShow : showXAxis,
                showYAxis: axis === 'y' ? canShow : showYAxis,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const editAxisTitle = (axis: string, title: string) => {
            if (axis === 'x') {
                setXAxisTitle(title);
            }
            if (axis === 'y') {
                setYAxisTitle(title);
            }
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`]['axis'] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`]['axis'],
                title: title,
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                xAxisTitle: axis === 'x' ? title : xAxisTitle,
                yAxisTitle: axis === 'y' ? title : yAxisTitle,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleShowAxisTitle = (axis: string, canShow: boolean) => {
            if (axis === 'x') {
                if (!canShow) setXAxisTitle('');
                setShowXAxisTitle(canShow);
            }
            if (axis === 'y') {
                if (!canShow) setYAxisTitle('');
                setShowYAxisTitle(canShow);
            }
            // insert the new value
            let tempValue = JSON.parse(value);
            if (!canShow)
                tempValue['layer'][0]['encoding'][`${axis}`]['title'] = '';
            else if (xAxisTitle && axis === 'x')
                tempValue['layer'][0]['encoding'][`${axis}`]['title'] =
                    xAxisTitle;
            else if (yAxisTitle && axis === 'y')
                tempValue['layer'][0]['encoding'][`${axis}`]['title'] =
                    yAxisTitle;
            else delete tempValue['layer'][0]['encoding'][`${axis}`]['title'];

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                showXAxisTitle: axis === 'x' ? canShow : showXAxisTitle,
                showYAxisTitle: axis === 'y' ? canShow : showYAxisTitle,
            };
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };
        const handleTitleFontSize = (axis: string, fontSize: number) => {
            if (axis === 'x') setXTitleFontSize(fontSize);
            if (axis === 'y') setYTitleFontSize(fontSize);
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`]['axis'] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`]['axis'],
                titleFontSize: fontSize,
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                xTitleFontSize: axis === 'x' ? fontSize : xTitleFontSize,
                yTitleFontSize: axis === 'y' ? fontSize : yTitleFontSize,
            };
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };
        const handleShowAxisTicks = (axis: string, canShow: boolean) => {
            if (axis === 'x') setShowXTicks(canShow);
            if (axis === 'y') setShowYTicks(canShow);
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`]['axis'] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`]['axis'],
                ticks: canShow,
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                showXTicks: axis === 'x' ? canShow : showXTicks,
                showYTicks: axis === 'y' ? canShow : showYTicks,
            };
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleAxisRotation = (axis: string, rotation: number) => {
            if (axis === 'x') setXAxisRotation(rotation);
            if (axis === 'y') setYAxisRotation(rotation);
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`]['axis'] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`]['axis'],
                labelAngle: rotation,
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                xAxisRotation: axis === 'x' ? rotation : xAxisRotation,
                yAxisRotation: axis === 'y' ? rotation : yAxisRotation,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handlePrependValue = (axis: string, text: string) => {
            if (axis === 'x') setXPrependVal(text);
            if (axis === 'y') setYPrependVal(text);
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`]['axis'] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`]['axis'],
                labelExpr: `'${text}'+datum.value+'${
                    axis === 'x' ? xAppendVal ?? '' : yAppendVal ?? ''
                }'`,
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                xPrependVal: axis === 'x' ? text : xPrependVal,
                yPrependVal: axis === 'y' ? text : yPrependVal,
            };
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleAppendValue = (axis: string, text: string) => {
            if (axis === 'x') setXAppendVal(text);
            if (axis === 'y') setYAppendVal(text);
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`]['axis'] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`]['axis'],
                labelExpr: `'${
                    axis === 'x' ? xPrependVal ?? '' : yPrependVal ?? ''
                }'+datum.value+'${text}'`,
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                xAppendVal: axis === 'x' ? text : xAppendVal,
                yAppendVal: axis === 'y' ? text : yAppendVal,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleFontSize = (axis: string, fontSize: number) => {
            if (axis === 'x') setXFontSize(fontSize);
            if (axis === 'y') setYFontSize(fontSize);
            // insert the new value
            let tempValue = JSON.parse(value);
            tempValue['layer'][0]['encoding'][`${axis}`]['axis'] = {
                ...tempValue['layer'][0]['encoding'][`${axis}`]['axis'],
                labelFontSize: fontSize,
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                xFontSize: axis === 'x' ? fontSize : xFontSize,
                yFontSize: axis === 'y' ? fontSize : yFontSize,
            };
            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        return (
            <Stack direction="column">
                <RowContainer sx={{ display: 'flex' }}>
                    <Checkbox
                        label={'Show X Axis'}
                        checked={showXAxis}
                        onChange={() => handleShowAxisLine('x', !showXAxis)}
                    />
                    <Checkbox
                        label={'Show Y Axis'}
                        checked={showYAxis}
                        onChange={() => handleShowAxisLine('y', !showYAxis)}
                    />
                </RowContainer>
                <RowContainer sx={{ display: 'flex' }}>
                    <Checkbox
                        label={'Show X Title'}
                        checked={showXAxisTitle}
                        onChange={() =>
                            handleShowAxisTitle('x', !showXAxisTitle)
                        }
                    />
                    <Checkbox
                        label={'Show Y Title'}
                        checked={showYAxisTitle}
                        onChange={() =>
                            handleShowAxisTitle('y', !showYAxisTitle)
                        }
                    />
                </RowContainer>
                <RowContainer sx={{ display: 'flex' }}>
                    <TextField
                        label="X Title"
                        value={xAxisTitle ? xAxisTitle : ''}
                        onChange={(e) => editAxisTitle('x', e.target.value)}
                        disabled={!showXAxisTitle}
                    />
                    <TextField
                        label="Y Title"
                        value={yAxisTitle ? yAxisTitle : ''}
                        onChange={(e) => editAxisTitle('y', e.target.value)}
                        disabled={!showYAxisTitle}
                    />
                </RowContainer>
                <RowContainer>
                    <TextField
                        type="number"
                        label="Font Size X Title"
                        value={xTitleFontSize ?? 12}
                        onChange={(e) =>
                            handleTitleFontSize('x', Number(e.target.value))
                        }
                    />
                    <TextField
                        type="number"
                        label="Font Size Y Title"
                        value={yTitleFontSize ?? 12}
                        onChange={(e) =>
                            handleTitleFontSize('y', Number(e.target.value))
                        }
                    />
                </RowContainer>
                <RowContainer sx={{ display: 'flex' }}>
                    <Checkbox
                        label={'Show X Tick'}
                        checked={showXTicks}
                        onChange={() => handleShowAxisTicks('x', !showXTicks)}
                    />
                    <Checkbox
                        label={'Show Y Tick'}
                        checked={showYTicks}
                        onChange={() => handleShowAxisTicks('y', !showYTicks)}
                    />
                </RowContainer>
                <RowContainer>
                    <Slider
                        onChange={(e) =>
                            handleAxisRotation('x', e.target.value)
                        }
                        min={0}
                        max={360}
                        marks={[
                            { value: 0, label: '0 d' },
                            { value: 360, label: '360 d' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                    <Slider
                        onChange={(e) =>
                            handleAxisRotation('y', e.target.value)
                        }
                        min={0}
                        max={360}
                        marks={[
                            { value: 0, label: '0 Deg' },
                            { value: 360, label: '360 Deg' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                </RowContainer>
                <RowContainer sx={{ display: 'flex' }}>
                    <TextField
                        label="Prepend X Value"
                        value={xPrependVal ?? ''}
                        onChange={(e) =>
                            handlePrependValue('x', e.target.value)
                        }
                    />
                    <TextField
                        label="Append X Value"
                        value={xAppendVal ?? ''}
                        onChange={(e) => handleAppendValue('x', e.target.value)}
                    />
                </RowContainer>
                <RowContainer sx={{ display: 'flex' }}>
                    <TextField
                        label="Prepend Y Value"
                        value={yPrependVal ?? ''}
                        onChange={(e) =>
                            handlePrependValue('y', e.target.value)
                        }
                    />
                    <TextField
                        label="Append Y Value"
                        value={yAppendVal ?? ''}
                        onChange={(e) => handleAppendValue('y', e.target.value)}
                    />
                </RowContainer>
                <RowContainer>
                    <TextField
                        type="number"
                        label="Font Size X"
                        value={xFontSize ?? 12}
                        onChange={(e) =>
                            handleFontSize('x', Number(e.target.value))
                        }
                    />
                    <TextField
                        type="number"
                        label="Font Size Y"
                        value={yFontSize ?? 12}
                        onChange={(e) =>
                            handleFontSize('y', Number(e.target.value))
                        }
                    />
                </RowContainer>
            </Stack>
        );
    },
);
