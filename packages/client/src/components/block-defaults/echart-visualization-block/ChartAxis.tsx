import { Button, Switch } from '@semoss/ui';
import { useState, useEffect } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BAR_CHART_DATA } from './Echart.constants';

const ChartAxis = ({ option, updateChart }) => {
    const [chartAxisState, setChartAxisState] = useState({
        xAxisZoomShow: false,
        yAxisZoomShow: false,
        showTooltip: false,
        showDisplayValues: false,
    });
    useEffect(() => {
        let chartAxisStateData = {
            xAxisZoomShow: false,
            yAxisZoomShow: false,
            showTooltip: false,
            showDisplayValues: false,
        };
        if (option['dataZoom']) {
            let xAxisPosition = option['dataZoom'].findIndex((opt) =>
                opt.hasOwnProperty('xAxisIndex'),
            );
            if (xAxisPosition > -1) {
                chartAxisStateData.xAxisZoomShow = option['dataZoom'][
                    xAxisPosition
                ].hasOwnProperty('show')
                    ? option['dataZoom'][xAxisPosition].show
                    : false;
            }
            let yAxisPosition = option['dataZoom'].findIndex((opt) =>
                opt.hasOwnProperty('yAxisIndex'),
            );
            if (yAxisPosition > -1) {
                chartAxisStateData.yAxisZoomShow = option['dataZoom'][
                    yAxisPosition
                ].hasOwnProperty('show')
                    ? option['dataZoom'][yAxisPosition].show
                    : false;
            }
        }
        if (option['tooltip']) {
            chartAxisStateData.showTooltip = option['tooltip'].hasOwnProperty(
                'show',
            )
                ? option['tooltip']['show']
                : false;
        }
        const displayPositionIndex = option['series'].findIndex((opt) =>
            BAR_CHART_DATA.JSONVALUE.includes(opt.type),
        );
        if (
            displayPositionIndex > -1 &&
            option['series'][displayPositionIndex]['label']
        ) {
            chartAxisStateData.showDisplayValues = option['series'][
                displayPositionIndex
            ]['label'].hasOwnProperty('show')
                ? option['series'][displayPositionIndex]['label']['show']
                : false;
        }
        setChartAxisState((prevState) => {
            return {
                ...prevState,
                ...chartAxisStateData,
            };
        });
    }, []);

    function updateXAxisState(axisState, axisValue) {
        setChartAxisState((prevState) => {
            return {
                ...prevState,
                [axisState]: axisValue,
            };
        });
    }

    const accordionDetails = (
        <div
            style={{
                width: '100%',
                padding: '10px',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <label>Show / Hide X-Axis Zoom</label>
                <Switch
                    checked={chartAxisState.xAxisZoomShow ?? undefined}
                    onChange={(e) =>
                        updateXAxisState(
                            'xAxisZoomShow',
                            !chartAxisState.xAxisZoomShow,
                        )
                    }
                    title="Show / Hide X-Axis Zoom"
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <label>Show / Hide Y-Axis Zoom</label>
                <Switch
                    checked={chartAxisState.yAxisZoomShow ?? undefined}
                    onChange={(e) =>
                        updateXAxisState(
                            'yAxisZoomShow',
                            !chartAxisState.yAxisZoomShow,
                        )
                    }
                    title="Show / Hide X-Axis Zoom"
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <label>Show / Hide Tooltip</label>
                <Switch
                    checked={chartAxisState.showTooltip ?? undefined}
                    onChange={(e) =>
                        updateXAxisState(
                            'showTooltip',
                            !chartAxisState.showTooltip,
                        )
                    }
                    title="Show / Hide Tooltip"
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <label>Show / Hide Display Values</label>
                <Switch
                    checked={chartAxisState.showDisplayValues ?? undefined}
                    onChange={(e) =>
                        updateXAxisState(
                            'showDisplayValues',
                            !chartAxisState.showDisplayValues,
                        )
                    }
                    title="Show / Hide Display Values"
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <Button onClick={(e) => updateChart(chartAxisState)}>
                    Execute
                </Button>
            </div>
        </div>
    );

    return (
        <CustomAccordianBlock
            accordianExpanded={false}
            accordianSummaryProps={<ExpandMoreIcon />}
            accordianSummary={'Axis Data'}
            accordianDetails={accordionDetails}
        />
    );
};

export default ChartAxis;
