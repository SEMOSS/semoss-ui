import { observer } from 'mobx-react-lite';
import { useBlock, useFrame, useBlocks } from '@/hooks';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { EchartVisualizationBlockDef } from '../../EchartVisualizationBlock';
import { CustomContextMenu } from './CustomContextMenu';
import { PathValue } from '@/types';
import { getValueByPath } from '@/utility';
import { computed } from 'mobx';

const StyledChartContainer = styled('div')(() => ({
    // width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));

const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '30vh',
    width: '80vh',
    color: error ? theme.palette.error.main : 'unset',
}));

export const LineBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs, setData } = useBlock<EchartVisualizationBlockDef>(id);
    const { state } = useBlocks();
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);

    // get the frame
    const frame = useFrame(data.frame.name, {
        selector: state.getVisualizationBlockSelector(id),
    });
    const [value, setValue] = useState<any>({});
    //Trying out different approach for TrendLine, work in progress
    const computedValue = useMemo(() => {
        return computed(() => {
            if (!data) {
                return '';
            }
            const v = getValueByPath(data, 'option');
            if (typeof v === 'undefined') {
                return '';
            } else if (typeof v === 'string') {
                return v;
            }
            return JSON.stringify(v, null, 2);
        });
    }, [data, 'option']).get();

    // update the value whenever the computed one changes
    useEffect(() => {
        let computedValue1 = JSON.parse(computedValue);
        if (frame.data.values.length > 0 && computedValue1) {
            let processedFrameData = formatDataPoints(data.option);
            if (processedFrameData) {
                computedValue1['series'][0]['data'] = processedFrameData;
            }
            setData('option', processedFrameData, true);
            setValue(processedFrameData);
        }
    }, [computedValue]);
    //format the frame option data for echart
    const formatDataPoints = useCallback(
        (resultData: unknown) => {
            if (frame.data.values.length > 0) {
                let valuesDataSet = JSON.parse(
                    JSON.stringify(frame.data.values),
                );
                let headersDataSet: string[] = JSON.parse(
                    JSON.stringify(frame.data.headers),
                );
                headersDataSet = headersDataSet.map((header: string) =>
                    header.replace('Average_', ''),
                );
                //format the data points to match the echart specification
                resultData['xAxis']['data'] = valuesDataSet.map((x) => x[0]);
                valuesDataSet.map((x) => x.shift());
                headersDataSet.shift();
                const yAxisListLength = resultData['series']?.length;
                for (let index = 0; index < yAxisListLength; index++) {
                    resultData['series'][index]['data'] = valuesDataSet.map(
                        (x) => {
                            return { value: x[index] };
                        },
                    );
                }
                resultData['series'] = resultData['series'].filter((x) =>
                    resultData['yAxis']['name'].includes(x.name),
                );
                valuesDataSet.map((x) => x.splice(0, yAxisListLength));
                headersDataSet.splice(0, yAxisListLength);

                if (valuesDataSet[0].length > 0) {
                    resultData['tooltip']['formatter'] = eval(
                        resultData['tooltip']['formatter'],
                    );

                    resultData['series'][0]['data'] = resultData['series'][0][
                        'data'
                    ].map((x, index) => {
                        let arr = valuesDataSet[index].map((y, idx) => {
                            return {
                                [headersDataSet[idx]]: isNaN(y)
                                    ? null
                                    : y.toFixed(1),
                            };
                        });
                        let result = arr.reduce((acc, curr) => {
                            return { ...acc, ...curr };
                        }, {});
                        return {
                            ...x,
                            ...result,
                        };
                    });
                } else {
                    delete resultData['tooltip']['formatter'];
                }
            } else {
                delete resultData['tooltip']['formatter'];
            }
            setData('option', resultData as PathValue<any, any>);
            return resultData;
        },
        [frame.data.values],
    );
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }
    const handleSelection = debounce((value: any, name: any) => {
        // update the frame
        frame.filter(`SetFrameFilter(${name}==[${value}])`);
    }, 2000);
    const echartsLoaded = (chart) => {
        chart.on('brushSelected', (params) => {
            let selectedData = params.batch[0].selected[0].dataIndex;
            const currentOption = chart.getOption();
            let labelData = currentOption.series[0].data;
            const filteredLabels = selectedData.map(
                (index) => labelData[index].label.formatter,
            );
            if (filteredLabels.length > 0) {
                handleSelection(
                    filteredLabels,
                    currentOption.series[0].label.name,
                );
            }
        });
    };
    const onClickChart = {
        contextmenu: (params) => {
            //  let currentOption = chart.getOption();
            if (params.data) {
                let labelName = data.option['series'][0]['name'];
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: params.event.event.clientX,
                              mouseY: params.event.event.clientY,
                              value: {
                                  label: labelName,
                                  value: params.data.value,
                              },
                          }
                        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                          // Other native context menus might behave different.
                          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                          null,
                );
                params.event.event.preventDefault();
            } else {
                params.event.event.preventDefault();
            }
        },
    };
    if (typeof data.option === 'string') {
        // if it's a string, it's either invalid json or a query output that needs to be parsed
        // try to parse, and show error otherwise
        try {
            const lineOptions = JSON.parse(data.option);
            return (
                <StyledChartContainer {...attrs}>
                    <ReactECharts
                        option={lineOptions}
                        onChartReady={(chart) => {
                            echartsLoaded(chart);
                        }}
                        onEvents={onClickChart}
                    />
                </StyledChartContainer>
            );
        } catch (e) {
            return (
                <StyledNoDataContainer error {...attrs}>
                    There was an issue parsing your JSON.
                </StyledNoDataContainer>
            );
        }
    } else {
        const formatedOption = data.frame.name
            ? formatDataPoints(data.option)
            : data.option;
        return (
            <StyledChartContainer {...attrs}>
                <ReactECharts
                    option={formatedOption}
                    onChartReady={(chart) => {
                        echartsLoaded(chart);
                    }}
                    onEvents={onClickChart}
                />
                <CustomContextMenu
                    id={id}
                    frame={frame}
                    contextMenu={contextMenu}
                    onClose={() => setContextMenu(null)}
                />
            </StyledChartContainer>
        );
    }
});
