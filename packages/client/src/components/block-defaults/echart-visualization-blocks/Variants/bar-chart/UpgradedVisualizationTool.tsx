import { useEffect, useRef, useState } from 'react';
import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { List, styled } from '@semoss/ui';
// import { ListItemButton } from "@semoss/ui/dist/components/List/ListItemButton";
// import { ListItemIcon } from "@semoss/ui/dist/components/List/ListItemIcon";
// import { ListItemText } from "@semoss/ui/dist/components/List/ListItemText";
import ImageIcon from '@mui/icons-material/Image';
import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { EchartVisualizationBlockDef } from '../../VisualizationBlock';
import ColourByValue from './ColourByValue';
import { EditXAxis } from './Edit-X-Axis';
import { BAR_CHART_DATA } from '../../Visualization.constants';
import { EditYAxis } from './Edit-Y-Axis';
import { CustomizeValueLabels } from './CustomizeValueLabels';
import { ChartStyling } from './ChartStyling';
import { ToggleTrendline } from './ToggleTrendline';
import { VisualizationStyles } from './VisualizationStyles';
import { BarChartProperties } from './BarChartProperties';
import { CustomTooltip } from '../PieChart/CustomTooltip';
import { ToogleDonut } from '../PieChart/ToggleDonut';
import { PieTitle } from '../PieChart/PieTitle';
import { PieValueLabel } from '../PieChart/PieValueLabel';
import { SizeSettings } from '@/components/block-settings/shared';
import { PieLegend } from '../PieChart/PieLegend';

interface UpgradedVisualizationToolProps {
    id: string;
}

const StyledListItem = styled(ListItem)(({}) => ({
    display: 'contents !important',
}));

export const UpgradedVisualizationTool =
    observer<UpgradedVisualizationToolProps>(({ id }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const [selectedList, setSelectedList] = useState('');
        let mountedRef = useRef({ componentMounted: false });
        useEffect(() => {
            mountedRef.current.componentMounted = true;
            return () => {
                mountedRef.current.componentMounted = false;
            };
        }, []);
        function updateChart() {}
        return (
            <>
                <List style={{ width: '100%' }}>
                    {data.variation === 'echart-bar-graph' && (
                        <ListItem disablePadding>
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'colourpalette'
                                            ? ''
                                            : 'colourpalette',
                                    )
                                }
                                selected={selectedList === 'colourpalette'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'colourpalette'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Colour Palette" />
                                <InfoOutlined />
                            </ListItemButton>
                        </ListItem>
                    )}
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-bar-graph' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'colourbyvalue'
                                            ? ''
                                            : 'colourbyvalue',
                                    )
                                }
                                selected={selectedList === 'colourbyvalue'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'colourbyvalue'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Colour By Value" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'colourbyvalue' && (
                            <ColourByValue id={id} updateChart={updateChart} />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-bar-graph' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'editxaxis'
                                            ? ''
                                            : 'editxaxis',
                                    )
                                }
                                selected={selectedList === 'editxaxis'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'editxaxis'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Edit X Axis" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'editxaxis' && (
                            <EditXAxis
                                id={id}
                                option={data.option}
                                updateChart={updateChart}
                                chartType={BAR_CHART_DATA.JSONVALUE[0]}
                            />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-bar-graph' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'edityaxis'
                                            ? ''
                                            : 'edityaxis',
                                    )
                                }
                                selected={selectedList === 'edityaxis'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'edityaxis'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Edit Y Axis" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'edityaxis' && (
                            <EditYAxis
                                id={id}
                                option={data.option}
                                updateChart={updateChart}
                                chartType={BAR_CHART_DATA.JSONVALUE[0]}
                            />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-bar-graph' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'valuelabel'
                                            ? ''
                                            : 'valuelabel',
                                    )
                                }
                                selected={selectedList === 'valuelabel'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'valuelabel'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Value Label" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'valuelabel' && (
                            <CustomizeValueLabels
                                id={id}
                                option={data.option}
                                chartType={BAR_CHART_DATA.JSONVALUE[0]}
                                updateChart={updateChart}
                            />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-bar-graph' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'barstyle'
                                            ? ''
                                            : 'barstyle',
                                    )
                                }
                                selected={selectedList === 'barstyle'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'barstyle'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Bar Style" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'barstyle' && (
                            <VisualizationStyles
                                id={id}
                                option={data.option}
                                chartType={BAR_CHART_DATA.JSONVALUE[0]}
                                updateChart={updateChart}
                            />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-bar-graph' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'trendlines'
                                            ? ''
                                            : 'trendlines',
                                    )
                                }
                                selected={selectedList === 'trendlines'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'trendlines'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Trendlines" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'trendlines' && (
                            <ToggleTrendline
                                id={id}
                                options={data.option}
                                updateChart={updateChart}
                                chartType={BAR_CHART_DATA.JSONVALUE[0]}
                            />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'sizing' ? '' : 'sizing',
                                )
                            }
                            selected={selectedList === 'sizing'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'sizing'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Sizing" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'sizing' && (
                            // <BarChartProperties
                            //     id={id}
                            //     mountedStatus={
                            //         mountedRef.current.componentMounted
                            //     }
                            // />
                            <>
                                <SizeSettings
                                    id={id}
                                    label="Height"
                                    path="style.height"
                                />
                                <SizeSettings
                                    id={id}
                                    label="Width"
                                    path="style.width"
                                />
                            </>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-pie-chart' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'tooltip' ? '' : 'tooltip',
                                    )
                                }
                                selected={selectedList === 'tooltip'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'tooltip'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Tooltip" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'tooltip' && (
                            <CustomTooltip id={id} path={'option'} />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-pie-chart' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'legend' ? '' : 'legend',
                                    )
                                }
                                selected={selectedList === 'legend'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'legend'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Legend" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'legend' && (
                            <PieLegend id={id} path={'option'} />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-pie-chart' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'donutToggle'
                                            ? ''
                                            : 'donutToggle',
                                    )
                                }
                                selected={selectedList === 'donutToggle'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'donutToggle'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Donut - Toggle" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'donutToggle' && (
                            <ToogleDonut id={id} path={'option'} />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-pie-chart' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'title' ? '' : 'title',
                                    )
                                }
                                selected={selectedList === 'title'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'title'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Chart Title" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'title' && (
                            <PieTitle id={id} path={'option'} />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        {data.variation === 'echart-pie-chart' && (
                            <ListItemButton
                                onClick={(e) =>
                                    setSelectedList((prevList) =>
                                        prevList === 'valueLabel'
                                            ? ''
                                            : 'valueLabel',
                                    )
                                }
                                selected={selectedList === 'valueLabel'}
                            >
                                <ListItemIcon>
                                    <ImageIcon
                                        fontSize="large"
                                        color={
                                            selectedList === 'valueLabel'
                                                ? 'primary'
                                                : 'disabled'
                                        }
                                    />
                                </ListItemIcon>
                                <ListItemText primary="Value Label" />
                                <InfoOutlined />
                            </ListItemButton>
                        )}
                        {selectedList === 'valueLabel' && (
                            <PieValueLabel id={id} path={'option'} />
                        )}
                    </StyledListItem>
                </List>
            </>
        );
    });
