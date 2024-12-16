import { observer } from 'mobx-react-lite';
import { useBlock, useFrame, useBlocks } from '@/hooks';
import { useCallback } from 'react';
import { BlockComponent } from '@/stores';
import { styled } from '@mui/material';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { EchartVisualizationBlockDef } from '../../EchartVisualizationBlock';

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
    const { data, attrs } = useBlock<EchartVisualizationBlockDef>(id);
    const { state } = useBlocks();

    // get the frame
    const frame = useFrame(data.frame.name, {
        selector: state.getVisualizationBlockSelector(id),
    });

    //format the frame option data for echart
    const formatDataPoints = useCallback(
        (resultData: unknown) => {
            // debugger;
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
            return resultData;
        },
        [frame.data.values],
    );

    if (typeof data.option === 'string') {
        // if it's a string, it's either invalid json or a query output that needs to be parsed
        // try to parse, and show error otherwise
        try {
            const lineOptions = JSON.parse(data.option);
            return (
                <StyledChartContainer {...attrs}>
                    <ReactECharts option={lineOptions} />
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
                <ReactECharts option={formatedOption} />
            </StyledChartContainer>
        );
    }
});
