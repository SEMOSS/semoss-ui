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

interface AxisSettingsProps<D extends BlockDef = BlockDef> {
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

export const Axis = observer(
    <D extends BlockDef = BlockDef>({
        id,
        path,
        value,
        setValue,
    }: AxisSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);

        //local states
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

        useEffect(() => {
            if (value) {
                const json: PathValue<D['data'], typeof path> =
                    JSON.parse(value);
                let state = json['_state'];
                if (state && state.hasOwnProperty('axis')) {
                    reinitializeStates(state['axis']);
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

            // update axis properties
            tempValue['layer'][0]['encoding'] = {
                ...tempValue['layer'][0]['encoding'],
                x: {
                    ...tempValue['layer'][0]['encoding']['x'],
                    axis: {
                        ...tempValue['layer'][0]['encoding']['x']['axis'],
                        domain: showXAxis,
                        title: showXAxisTitle ? xAxisTitle : '',
                        titleFontSize: xTitleFontSize,
                        ticks: showXTicks,
                        labelAngle: xAxisRotation,
                        labelExpr: `'${xPrependVal}'+datum.value+'${xAppendVal}'`,
                        labelFontSize: xFontSize,
                    },
                },
                y: {
                    ...tempValue['layer'][0]['encoding']['y'],
                    axis: {
                        ...tempValue['layer'][0]['encoding']['y']['axis'],
                        domain: showYAxis,
                        title: showYAxisTitle ? yAxisTitle : '',
                        titleFontSize: yTitleFontSize,
                        ticks: showYTicks,
                        labelAngle: yAxisRotation,
                        labelExpr: `'${yPrependVal}'+datum.value+'${yAppendVal}'`,
                        labelFontSize: yFontSize,
                    },
                },
            };

            tempValue['_state']['axis'] = {
                ...tempValue['_state']['axis'],
                showXAxis: showXAxis,
                showYAxis: showYAxis,
                xAxisTitle: xAxisTitle,
                yAxisTitle: yAxisTitle,
                showXAxisTitle: showXAxisTitle,
                showYAxisTitle: showYAxisTitle,
                xTitleFontSize: xTitleFontSize,
                yTitleFontSize: yTitleFontSize,
                showXTicks: showXTicks,
                showYTicks: showYTicks,
                xAxisRotation: xAxisRotation,
                yAxisRotation: yAxisRotation,
                xPrependVal: xPrependVal,
                yPrependVal: yPrependVal,
                xAppendVal: xAppendVal,
                yAppendVal: yAppendVal,
                xFontSize: xFontSize,
                yFontSize: yFontSize,
            };

            // set the value
            setValue(JSON.stringify(tempValue));
            dispatchData(tempValue);
        };

        const handleShowAxisLine = (axis1: string, canShow: boolean) => {
            if (axis1 === 'x') {
                setShowXAxis(canShow);
            } else if (axis1 === 'y') {
                setShowYAxis(canShow);
            }
        };

        const editAxisTitle = (axis: string, title: string) => {
            if (axis === 'x') {
                setXAxisTitle(title);
            }
            if (axis === 'y') {
                setYAxisTitle(title);
            }
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
        };
        const handleTitleFontSize = (axis: string, fontSize: number) => {
            if (axis === 'x') setXTitleFontSize(fontSize);
            if (axis === 'y') setYTitleFontSize(fontSize);
        };
        const handleShowAxisTicks = (axis: string, canShow: boolean) => {
            if (axis === 'x') setShowXTicks(canShow);
            if (axis === 'y') setShowYTicks(canShow);
        };

        const handleAxisRotation = (axis: string, rotation: number) => {
            if (axis === 'x') setXAxisRotation(rotation);
            if (axis === 'y') setYAxisRotation(rotation);
        };

        const handlePrependValue = (axis: string, text: string) => {
            if (axis === 'x') setXPrependVal(text);
            if (axis === 'y') setYPrependVal(text);
        };

        const handleAppendValue = (axis: string, text: string) => {
            if (axis === 'x') setXAppendVal(text);
            if (axis === 'y') setYAppendVal(text);
        };

        const handleFontSize = (axis: string, fontSize: number) => {
            if (axis === 'x') setXFontSize(fontSize);
            if (axis === 'y') setYFontSize(fontSize);
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
                <Button onClick={handleExcecute}>Excecute</Button>
            </Stack>
        );
    },
);
