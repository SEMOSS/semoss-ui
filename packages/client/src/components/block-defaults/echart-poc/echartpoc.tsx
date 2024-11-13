import EChartsReact, * as echarts from 'echarts-for-react';

var option;
// option = {
//     title: {
//       text: 'World Population'
//     },
//     tooltip: {
//       trigger: 'axis',
//       axisPointer: {
//         type: 'shadow'
//       }
//     },
//     legend: {},
//     grid: {
//       left: '3%',
//       right: '4%',
//       bottom: '3%',
//       containLabel: true
//     },
//     yAxis: {
//       type: 'value',
//       boundaryGap: [0, 0.01]
//     },
//     xAxis: {
//       type: 'category',
//       data: ['Brazil', 'Indonesia', 'USA', 'India', 'China', 'World']
//     },
//     dataZoom: [
//         {
//           show: true,
//           start: 0,
//           end: 100
//         },
//         {
//           type: 'inside',
//           start: 94,
//           end: 100
//         },
//         {
//           show: true,
//           yAxisIndex: 0,
//           filterMode: 'empty',
//           width: 30,
//           height: '80%',
//           showDataShadow: false,
//           left: '96%',
//         }
//       ],
//     series: [
//       {
//         name: '2011',
//         type: 'bar',
//         data: [18203, 23489, 29034, 104970, 131744, 630230]
//       },
//       {
//         name: '2012',
//         type: 'bar',
//         data: [19325, 23438, 31000, 121594, 134141, 681807]
//       }
//     ]
//   };
option = {
    title: {
        text: 'Referer of a Website',
        subtext: 'Fake Data',
        left: 'right',
        textStyle: {
            fontSize: 28,
            color: '#ff6f61',
            fontFamily: '',
            fontWeight: '800',
        },
    },
    tooltip: {
        trigger: 'item',
    },
    legend: {
        orient: 'vertical',
        left: 'left',
    },
    series: [
        {
            name: 'Access From',
            type: 'pie',
            radius: '50%',
            data: [
                { value: 1048, name: 'Search Engine' },
                { value: 735, name: 'Direct' },
                { value: 580, name: 'Email' },
                { value: 484, name: 'Union Ads' },
                { value: 300, name: 'Video Ads' },
            ],
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                },
            },
        },
    ],
};
export function EchartPOC() {
    const flag = typeof option;
    console.log('//////////////////////////////////', flag);
    console.log('Workig;');
    //const parseObject = JSON.parse(option)
    //console.log("//////////////////////////////////",parseObject);
    if (flag == 'object') {
        return <EChartsReact option={option}> </EChartsReact>;
    }
}
