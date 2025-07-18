import { useMemo, useState } from 'react';
import ReactECharts from 'echarts-for-react';

import * as echarts from 'echarts/core';
import { ScatterChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  LegendComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { type EChartsOption } from 'echarts';

// UI
import {
  Box,
  Checkbox,
  FormControlLabel,
  Stack,
  Table,
  Tooltip,
  Typography,
  styled,
} from '@semoss/ui';
import { Timelapse } from '@mui/icons-material';

echarts.use([
  ScatterChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  LegendComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

/* ---------- types ---------- */

export interface ChatLog {
  createdDate: string;
  activityType: string;
  type: string;
  result: {
    request?: string;
    response?: string;
    engine: string;
  };
  responseTime?: string;
}

interface Props {
  logs: ChatLog[];
  height?: number;
}

type ScatterPoint = any;

const EventHistory: React.FC<Props> = ({ logs, height = 260 }) => {
  const [showZoomSlider, setShowZoomSlider] = useState(true);

  const option: EChartsOption = useMemo(() => {
    if (!logs?.length) return {};
    // Generate colors for each unique log type
    const colors = logs.reduce((acc, log) => {
      if(log.type && !acc.hasOwnProperty(log.type)) {
        acc[log.type] = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
      }
      return acc;
    },{});
    // Create a map to track seen timestamps and adjust for duplicates
    const seen = new Map<number, number>();
    const events: ScatterPoint[] = logs.map((l, idx) => {
        const base = new Date(l.createdDate).getTime();
        const dup = seen.get(base) ?? 0;
        seen.set(base, dup + 1);
        const adjusted = new Date(base + dup * 1000);

        return {
          value: [adjusted, idx],
          symbolSize: 22,
          itemStyle: {
            color: colors[l.type] || '#2635ff',
            borderColor: '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: () => l.type,
            fontSize: 10,
            color: '#000',
            position: 'right' as const,
            padding: [0, 4],
          },
          tooltip: {
            formatter: () =>
              `<b>${l.type}</b><br/>${l.activityType}<br/>${adjusted.toLocaleString()}<br/>${l.result?.request || l.result?.response}`,
          },
        };
      });

    const first = events[0]?.value[0];
    const last = events[events.length - 1]?.value[0];
    const laneCount = events.length;

    return {
      animation: false,
      tooltip: {
        trigger: 'item',
        borderRadius: 4,
        extraCssText: 'max-width:400px; white-space:pre-wrap;',
      },
      dataZoom: showZoomSlider
        ? [
            { type: 'slider', xAxisIndex: [0, 1], start: 0, end: 100 },
            { type: 'inside', xAxisIndex: [0, 1], start: 0, end: 100 },
            { type: 'slider', yAxisIndex: 1, left: 0, start: 0, end: 100 },
          ]
        : [],
      grid: [
        { top: 0, left: 60, right: 30, height: 36 },
        { top: 60, left: 60, right: 30, bottom: 80 },
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
        {
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: first && last ? [[first, 0], [last, 0]] : [],
          lineStyle: { color: '#1956ff', width: 4 },
          symbol: 'none',
        },
        {
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: first ? [[first, -1], [first, laneCount]] : [],
          lineStyle: { color: '#1956ff', width: 4 },
          symbol: 'none',
        },
        {
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: last ? [[last, -1], [last, laneCount]] : [],
          lineStyle: { color: '#1956ff', width: 4 },
          symbol: 'none',
        },
        {
          type: 'scatter',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: events,
          zlevel: 2,
        },
      ],
    } satisfies EChartsOption;
  }, [logs, showZoomSlider]);


  return (
    <Stack sx={{ width: '100%' }}>
      {/* title */}
      <Typography variant="h6" align="center">
        Event History
      </Typography>

      {/* chart */}
      <div id="event-chart" style={{ width: '100%' }}>
        <ReactECharts option={option} style={{ width: '100%', height }} lazyUpdate notMerge />
      </div>

      {/* controls */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          marginTop: 0
        }}
      >
        <FormControlLabel
          control={
            <Checkbox checked={showZoomSlider} onChange={() => setShowZoomSlider((v) => !v)} />
          }
          label="Zoom Slider"
        />
      </Box>

      {/* logs */}
      <ActivityLogList logs={logs} />
    </Stack>
  );
};

const ActivityLogList: React.FC<{ logs: ChatLog[] }> = ({ logs }) => {
  if (!logs?.length) return null;

  return (
    <Stack>
      <Typography variant="h6" align="center">
        Logs
      </Typography>

      <Table.Container>
        <Table size="small">
          <Table.Head>
            <Table.Row>
              <Table.Cell>Activity</Table.Cell>
              <Table.Cell>Type</Table.Cell>
              <Table.Cell>Category</Table.Cell>
              <Table.Cell>Description</Table.Cell>
              <Table.Cell>Latency</Table.Cell>
              <Table.Cell>Timestamp</Table.Cell>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {logs.map((log, idx) => (
              <ActivityLogRow key={idx} log={log} />
            ))}
          </Table.Body>
        </Table>
      </Table.Container>
    </Stack>
  );
};

const ActivityLogRow: React.FC<{ log: ChatLog }> = ({ log }) => {
  const time = new Date(log.createdDate).toLocaleString();
  const resTime = Math.round(Number(log.responseTime));
  const label = log.type === 'user_text' ? log.result.request : log.result.response;

  return (
    <Table.Row>
      <Table.Cell>
        <Typography variant="subtitle2" fontWeight={600}>
          {log.activityType}
        </Typography>
      </Table.Cell>

      <Table.Cell>{log.type}</Table.Cell>
      <Table.Cell>{log.result.engine}</Table.Cell>

      <Table.Cell sx={{ maxWidth: 320, backgroundColor: '#f5f5f5', padding: 1 }}>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              cursor: 'help',
            }}
            title={label}
          >
            {label}
          </Typography>
      </Table.Cell>

      <Table.Cell>{resTime ? `${resTime} ms` : '-'}</Table.Cell>

      <Table.Cell>
        <Stack direction="row" spacing={1} alignItems="center">
          <Timelapse fontSize="small" color="disabled" />
          <Typography variant="body2">{time}</Typography>
        </Stack>
      </Table.Cell>
    </Table.Row>
  );
};

export default EventHistory;