import { Button, Select, styled, Switch } from '@semoss/ui';
import { useEffect, useState } from 'react';
import CustomAccordianBlock from './CustomAccordianBlock';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { BAR_CHART_DATA, LINE_CHART_DATA } from '../../Echart.constants';

const StyledSelect = styled(Select)(() => ({
    width: '100%',
}));

export const ToggleTrendline = ({ options, updateChart, chartType }) => {
    const [toggleTrendlines, setToggleTrendlines] = useState('');
    const trendLineOptions = [
        { label: 'Smooth', value: 'smooth' },
        { label: 'Exact', value: 'exact' },
        { label: 'Step(Start)', value: 'step_start' },
        { label: 'Step(Middle)', value: 'step_middle' },
        { label: 'Step(End)', value: 'step_end' },
    ];
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
                    onClick={() => updateChart(toggleTrendlines)}
                >
                    Update TrendLine
                </Button>
            </div>
        </div>
    );
    return (
        <CustomAccordianBlock
            accordianExpanded={false}
            accordianSummaryProps={<ExpandMoreIcon />}
            accordianSummary={'Toggle Trendline'}
            accordianDetails={trendlineData}
        />
    );
};
