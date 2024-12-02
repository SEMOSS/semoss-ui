import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useBlock, useFrame } from '@/hooks';
import { BlockComponent } from '@/stores';
import { VisualizationSpec, createClassFromSpec } from 'react-vega';
import { styled } from '@mui/material';
import { VegaVisualizationBlockDef } from '../VegaVisualizationBlock';
import { VizBlockContextMenu } from '../VizBlockContextMenu';

const StyledChartContainer = styled('div')(() => ({
    width: 'fit-content',
    minWidth: '50px',
    minHeight: '50px',
}));
const StyledNoDataContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'error',
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: '200px',
    width: '200px',
    color: error ? theme.palette.error.main : 'unset',
}));

export const Bar: BlockComponent = observer(({ id }) => {
    function debounce(fn, delay) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), delay);
        };
    }

    // get the data
    const { data, attrs } = useBlock<VegaVisualizationBlockDef>(id);

    //create context for menu
    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        value: unknown;
    } | null>(null);

    const xAxis = data.specJson['layer'][0]['encoding']['x']['field'];
    const yAxis = data.specJson['layer'][0]['encoding']['y']['field'];

    // create the selector
    const selector = `Select(${xAxis}, Average(${yAxis})).as([${xAxis}, ${yAxis}])|Group(${xAxis})|Sort(${xAxis})`;

    // get the frame
    const frame = useFrame(data.frame.name, { selector: selector });

    const handleSelection = debounce((value: any) => {
        // update the frame
        frame.filter(`SetFrameFilter(${xAxis}==[${value[xAxis]}])`);
    }, 1000);

    const formatDataPoints = (resultData: unknown) => {
        // format the data points to match the vega specification
        if (resultData['values']) {
            return resultData['values'].map((row) => ({
                [xAxis]: row[0],
                [yAxis]: row[1],
            }));
        }
    };

    const handleView = (view) => {
        // Signal for brush events
        view.addSignalListener('brush', (name, value) => {
            handleSelection(value);
        }); // Click event listener
        // view.addEventListener('click', (event, item) => {
        //     if (item && item.datum) {
        //         console.log('Clicked data:', item.datum);
        //         setValues(item.datum)
        //     }
        // });
        view.addEventListener('contextmenu', (event, item) => {
            event.preventDefault(); // Prevent default browser right-click menu
            if (item && item.datum) {
                console.log('Right-clicked data:', item.datum);
                setContextMenu(
                    contextMenu === null
                        ? {
                              mouseX: event.clientX + 2,
                              mouseY: event.clientY - 6,
                              value: { label: xAxis, value: item.datum },
                          }
                        : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                          // Other native context menus might behave different.
                          // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                          null,
                );
            }
        });
    };

    if (!xAxis || !yAxis) {
        return (
            <StyledNoDataContainer {...attrs}>
                Missing frame or required fields.
            </StyledNoDataContainer>
        );
    } else {
        // format data for vega-lite
        data.specJson['data']['values'] = formatDataPoints(frame.data);

        // if it's an object, it's valid json
        const Chart = createClassFromSpec({
            spec: data.specJson as VisualizationSpec,
        });

        return (
            <StyledChartContainer {...attrs}>
                <Chart actions={false} onNewView={handleView} />
                <VizBlockContextMenu
                    id={id}
                    frame={frame}
                    contextMenu={contextMenu}
                    onClose={() => setContextMenu(null)}
                />
            </StyledChartContainer>
        );
    }
});
