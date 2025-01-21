import { Button, Select, styled, Switch } from '@semoss/ui';
import { useEffect, useMemo, useState } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BAR_CHART_DATA, LINE_CHART_DATA } from '../../Visualization.constants';
import { useBlockSettings } from '@/hooks';
import { computed } from 'mobx';
import { getValueByPath } from '@/utility';
import { PathValue } from '@/types';

const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

export const ToggleTrendline = ({ options, updateChart, chartType, id }) => {
    const [toggleTrendlines, setToggleTrendlines] = useState('');
    const { data, setData } = useBlockSettings<any>(id);
    const [value, setValue] = useState(data.option);
    const trendLineOptions = [
        { label: 'Smooth', value: 'smooth' },
        { label: 'Exact', value: 'exact' },
        { label: 'Step(Start)', value: 'step_start' },
        { label: 'Step(Middle)', value: 'step_middle' },
        { label: 'Step(End)', value: 'step_end' },
    ];
    const path = 'option';
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
    useEffect(() => {
        setValue(computedValue);
    }, [computedValue]);
    useEffect(() => {
        if (BAR_CHART_DATA.JSONVALUE.includes(chartType)) {
            let seriesIndex = options['series'].findIndex(
                (op) =>
                    LINE_CHART_DATA.JSONVALUE.includes(op.type) &&
                    op.hasOwnProperty('toggleTrendLineObject'),
            );
            if (seriesIndex > -1) {
                const trendLineOptions = options['series'][seriesIndex];
                if (trendLineOptions.smooth) {
                    setToggleTrendlines('smooth');
                }
                if (
                    trendLineOptions.smooth === false &&
                    (!trendLineOptions.hasOwnProperty('step') ||
                        trendLineOptions.step === false)
                ) {
                    setToggleTrendlines('exact');
                }
                if (
                    trendLineOptions.hasOwnProperty('step') &&
                    trendLineOptions.step !== false
                ) {
                    if (trendLineOptions.step === 'start') {
                        setToggleTrendlines('step_start');
                    } else if (trendLineOptions.step === 'middle') {
                        setToggleTrendlines('step_middle');
                    } else {
                        setToggleTrendlines('step_end');
                    }
                }
            }
        }
    }, []);
    function handleToggleTrendLine(e) {
        setToggleTrendlines((prevTrendLine) => {
            return e.target.value;
        });
    }
    function getFilteredSeriesIndex() {
        let index = [];
        let seriesAvailable: any[] = data.option['series'].filter((item) =>
            BAR_CHART_DATA.JSONVALUE.includes(item.type),
        );
        seriesAvailable.forEach((item, seriesIndex) => {
            index.push(seriesIndex);
        });
        return index;
    }
    function updateChartData(trendLinesSelected) {
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let optionUpdated = option;
        const filteredSeries = getFilteredSeriesIndex();
        if (trendLinesSelected != '') {
            filteredSeries.forEach((item) => {
                const displayPositionIndex = item;
                const lineAlreadyExists = option['series'].findIndex(
                    (opt) =>
                        opt.hasOwnProperty('toggleTrendLineObject') &&
                        LINE_CHART_DATA.JSONVALUE.includes(opt.type) &&
                        (opt.hasOwnProperty('sourceObjectIndex')
                            ? opt.sourceObjectIndex === displayPositionIndex
                            : true),
                );
                let trendLinesData = {};
                if (['smooth', 'exact'].includes(trendLinesSelected)) {
                    trendLinesData = {
                        ...trendLinesData,
                        ['smooth']:
                            trendLinesSelected === 'smooth' ? true : false,
                    };
                }
                if (trendLinesSelected.startsWith('step')) {
                    trendLinesData = {
                        ...trendLinesData,
                        ['step']: trendLinesSelected.split('_')[1] ?? false,
                    };
                }
                if (lineAlreadyExists >= 0 && displayPositionIndex >= 0) {
                    option['series'][lineAlreadyExists] = {
                        ...option['series'][lineAlreadyExists],
                        ...trendLinesData,
                        ['data']:
                            option['series'][displayPositionIndex]['data'],
                    };
                    console.log(option['series'], 'line exists');
                }

                if (displayPositionIndex > -1 && lineAlreadyExists == -1) {
                    let toggleLineData = {
                        ...trendLinesData,
                        data:
                            option['series'][displayPositionIndex]['data'] ||
                            [],
                        type: 'line',
                        toggleTrendLineObject: true,
                        sourceObjectIndex: displayPositionIndex,
                    };

                    option['series'] = [
                        // ...option['series'].slice(0, displayPositionIndex + 1),
                        // toggleLineData,
                        // ...option['series'].slice(displayPositionIndex + 1),
                        ...option['series'],
                        toggleLineData,
                    ];
                    console.log(option['series'], 'line not exists');
                }
            });
            runStateUpdate(option);
        } else {
            let displayPositionData = option['series'].filter(
                (item) =>
                    item.type === 'line' &&
                    item.hasOwnProperty('toggleTrendLineObject'),
            );
            runDisplayPositionData(displayPositionData);
            // removeLineObject();
        }
        optionUpdated = option;
        // runStateUpdate(optionUpdated);
    }
    function runDisplayPositionData(displayPositionData) {
        let option = typeof value === 'string' ? JSON.parse(value) : value;
        let seriesOption = option['series'];
        seriesOption.forEach((seriesItem, seriesIndex) => {
            if (
                seriesItem.type === 'line' &&
                seriesItem.hasOwnProperty('toggleTrendLineObject')
            ) {
                let lineData = [];
                seriesItem['data'].forEach((seriesData) => {
                    lineData.push(null);
                });
                option['series'][seriesIndex]['data'] = lineData;
            }
        });
        runStateUpdate(option);
        removeLineObject();
    }
    function removeLineObject() {
        setTimeout(() => {
            let option = typeof value === 'string' ? JSON.parse(value) : value;
            let displayPositionData = option['series'].filter(
                (item) =>
                    !(
                        item.type === 'line' &&
                        item.hasOwnProperty('toggleTrendLineObject')
                    ),
            );
            let displayPositionIndex = option['series'].findIndex(
                (item) =>
                    item.type === 'line' &&
                    item.hasOwnProperty('toggleTrendLineObject'),
            );
            option['series'] = displayPositionData;
            runStateUpdate(option);
        }, 300);
    }
    function runStateUpdate(updatedOption) {
        setTimeout(() => {
            try {
                setData('option', updatedOption as PathValue<any, typeof path>);
            } catch (e) {
                console.log(e);
            }
        }, 300);
    }
    const trendlineData = (
        <div style={{ width: '100%', display: 'block' }}>
            <div
                style={{
                    width: '100%',
                }}
            >
                <label htmlFor="showTrendLine">Trendlines Toggle</label>
                <StyledSelect
                    onChange={handleToggleTrendLine}
                    id="showTrendLine"
                    label="Trendline Toggle"
                    value={toggleTrendlines}
                >
                    <Select.Item value={''} key="-1">
                        No Trendline
                    </Select.Item>
                    {trendLineOptions.map((trendOption, index) => {
                        return (
                            <Select.Item value={trendOption.value} key={index}>
                                {trendOption.label}
                            </Select.Item>
                        );
                    })}
                </StyledSelect>
            </div>
            <div
                style={{
                    width: '100%',
                    paddingTop: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-around',
                }}
            >
                <Button
                    type="button"
                    color="primary"
                    onClick={() => updateChartData(toggleTrendlines)}
                >
                    Update TrendLine
                </Button>
            </div>
        </div>
    );
    return (
        // <CustomAccordianBlock
        //     accordianExpanded={false}
        //     accordianSummaryProps={<ExpandMoreIcon />}
        //     accordianSummary={'Toggle Trendline'}
        //     accordianDetails={trendlineData}
        // />
        <>{trendlineData}</>
    );
};
