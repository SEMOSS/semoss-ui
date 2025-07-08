import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

import * as echarts from 'echarts/core';
import { ScatterChart, LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { type EChartsOption } from 'echarts';

// UI
import { Box, List, Stack, styled, Table, Typography } from '@semoss/ui';
import { Timelapse } from '@mui/icons-material';

echarts.use([
    ScatterChart,
    LineChart,
    GridComponent,
    TooltipComponent,
    CanvasRenderer,
]);

/** One chat‑log entry */
export interface ChatLog {
    time: string | Date;
    type: string; // e.g. USER_TEXT | RESPONSE_TEXT
    label: string; // short label for timeline bubble
    result: string; // long text shown in table (ellipsis)
    responsetime?: string; // optional latency value
    logId?: string; // optional unique id
}

interface Props {
    logs: ChatLog[];
    height?: number; // height of timeline chart
}

type ScatterPoint = any;

const EventHistory: React.FC<Props> = ({ logs, height = 260 }) => {
    const option: EChartsOption = useMemo(() => {
        if (!logs?.length) return {};

        // chronological order (old → new)
        const sorted = [...logs].sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
        );

        /* colour mapping per event type */
        const colour: Record<string, string> = {
            USER_TEXT: '#3498db',
            RESPONSE_TEXT: '#2ecc71',
        };

        /* scatter points */
        const events: ScatterPoint[] = sorted.map((l, idx) => ({
            value: [new Date(l.time), idx],
            symbolSize: 22,
            itemStyle: {
                color: colour[l.type] ?? '#8e44ad',
                borderColor: '#2635ff',
                borderWidth: 2,
            },
            label: {
                show: true,
                formatter: () => l.label,
                fontSize: 10,
                color: '#000',
                position: 'right' as const,
                padding: [0, 4],
            },
            tooltip: {
                formatter: () =>
                    `<b>${l.label}</b><br/>${l.type}<br/>${new Date(
                        l.time,
                    ).toLocaleString()}<br/>${l.result}`,
            },
        }));

        const first = sorted[0].time;
        const last = sorted[sorted.length - 1].time;
        const laneCount = sorted.length;

        /* final chart option */
        return {
            animation: false,
            tooltip: {
                trigger: 'item',
                borderRadius: 4,
                extraCssText: 'max-width:400px; white-space:pre-wrap;',
            },
            grid: [
                { top: 0, left: 60, right: 30, height: 36 },
                { top: 60, left: 60, right: 30, bottom: 50 },
            ],
            xAxis: [
                {
                    type: 'time',
                    gridIndex: 0,
                    axisLabel: { show: false },
                    splitLine: { show: false },
                    axisTick: { length: 6 },
                },
                {
                    type: 'time',
                    gridIndex: 1,
                    splitArea: {
                        show: true,
                        interval: 1,
                        areaStyle: { color: ['rgba(0,0,0,0.03)', '#ffffff'] },
                    },
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { formatter: '{HH}:{mm}:{ss}' },
                },
            ],
            yAxis: [
                { type: 'value', gridIndex: 0, show: false, min: 0, max: 1 },
                {
                    type: 'category',
                    gridIndex: 1,
                    inverse: true,
                    data: new Array(laneCount).fill(' '),
                    axisLine: { show: false },
                    axisTick: { show: false },
                    axisLabel: { show: false },
                },
            ],
            series: [
                // ruler baseline
                {
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: [
                        [first, 0],
                        [last, 0],
                    ],
                    lineStyle: { color: '#1956ff', width: 4 },
                    symbol: 'none',
                },
                // rails
                {
                    type: 'line',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: [
                        [first, -1],
                        [first, laneCount],
                    ],
                    lineStyle: { color: '#1956ff', width: 4 },
                    symbol: 'none',
                },
                {
                    type: 'line',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: [
                        [last, -1],
                        [last, laneCount],
                    ],
                    lineStyle: { color: '#1956ff', width: 4 },
                    symbol: 'none',
                },
                // events
                {
                    type: 'scatter',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    data: events,
                    zlevel: 2,
                },
            ],
        } satisfies EChartsOption;
    }, [logs]);

    return (
        <Stack spacing={4} sx={{ width: '100%' }}>
            <Typography variant="h6" align="center">
                Event History
            </Typography>

            <ReactECharts
                option={option}
                style={{ width: '100%', height }}
                lazyUpdate
                notMerge
            />

            <ActivityLogList logs={logs} />
        </Stack>
    );
};

const ActivityLogList: React.FC<{ logs: ChatLog[] }> = ({ logs }) => {
    if (!logs?.length) return null;

    return (
        <Stack spacing={2} sx={{ pb: 4 }}>
            <Typography variant="h6" align="center">
                Logs
            </Typography>
            <List>
                {logs.map((l, i) => (
                    <ActivityLogListItem log={l} key={l.logId ?? i} />
                ))}
            </List>
        </Stack>
    );
};

/* coloured dot */
const StyledBox = styled(Box)(({ theme }) => ({
    width: 10,
    height: 10,
    backgroundColor: '#4856ff',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: theme.spacing(1),
}));

/* Single row */
const ActivityLogListItem: React.FC<{ log: ChatLog }> = ({ log }) => {
    if (!log) return null;

    const time = new Date(log.time).toLocaleString();

    return (
        <Table.Row sx={{ '& > td': { py: 1.2, px: 1.5 } }}>
            <Table.Cell>
                <StyledBox />
            </Table.Cell>

            <Table.Cell>
                <Typography variant="subtitle2">Activity</Typography>
            </Table.Cell>

            <Table.Cell>{log.type}</Table.Cell>
            <Table.Cell>{log.label}</Table.Cell>

            <Table.Cell sx={{ maxWidth: 320 }}>
                <Typography
                    variant="body2"
                    sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        cursor: 'help',
                        backgroundColor: 'black',
                        color: 'white',
                        padding: '2px 4px',
                        borderRadius: '4px',
                    }}
                    title={log.result}
                >
                    {log.result}
                </Typography>
            </Table.Cell>

            <Table.Cell>{log.responsetime ?? '-'}</Table.Cell>

            <Table.Cell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Timelapse fontSize="small" color="disabled" />
                    {time}
                </Box>
            </Table.Cell>
        </Table.Row>
    );
};

export default EventHistory;
