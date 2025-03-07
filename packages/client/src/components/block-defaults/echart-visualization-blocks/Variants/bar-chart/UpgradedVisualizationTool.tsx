import { useState } from 'react';
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
import { EchartVisualizationBlockDef } from '../../EchartVisualizationBlock';
import { LineTitle } from '../LineChart/LineTitle';
import { XAxisStyling } from '../LineChart/XAxisStyling';
import { LineTooltip } from '../LineChart/LineTooltip';
import { Line } from '../LineChart';
import { LineLegend } from '../LineChart/LineLegend';
import { LineStyling } from '../LineChart/LineStyling';
import { ColorPalatteSettings } from '@/components/block-settings/shared/ColorPalletSetting';
//import { LineValueLabel } from '../LineChart/LineValueLabel';
import { CustomizeValueLabels } from '../LineChart/LineValueLabel';
import { YAxisStyling } from '../LineChart/YAxisStyling';
import { BAR_CHART_DATA, LINE_CHART_DATA } from '../../Visualization.constants';
import { SizeSettings } from '../LineChart/ChartStyling';

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
        function updateChart() {}
        return (
            <>
                <List style={{ width: '100%' }}>
                    <StyledListItem disablePadding>
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
                        {selectedList === 'colourpalette' && (
                            <ColorPalatteSettings
                                id={id}
                                path="option.color"
                                onColorPalatteSelected={(option, color) => {}}
                            />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'lineTitle' ? '' : 'lineTitle',
                                )
                            }
                            selected={selectedList === 'lineTitle'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'lineTitle'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Line Title" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'lineTitle' && (
                            <LineTitle id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'xAxisStyling'
                                        ? ''
                                        : 'xAxisStyling',
                                )
                            }
                            selected={selectedList === 'xAxisStyling'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'xAxisStyling'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="X Axis Styling" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'xAxisStyling' && (
                            <XAxisStyling id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'yAxisStyling'
                                        ? ''
                                        : 'yAxisStyling',
                                )
                            }
                            selected={selectedList === 'yAxisStyling'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'yAxisStyling'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Y Axis Styling" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'yAxisStyling' && (
                            <YAxisStyling id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
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
                            <ListItemText primary="Tooptip" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'tooltip' && (
                            <LineTooltip id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'lineLegend'
                                        ? ''
                                        : 'lineLegend',
                                )
                            }
                            selected={selectedList === 'lineLegend'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'lineLegend'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Legend" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'lineLegend' && (
                            <LineLegend id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'lineValueLabel'
                                        ? ''
                                        : 'lineValueLabel',
                                )
                            }
                            selected={selectedList === 'lineValueLabel'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'lineValueLabel'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Value Label" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'lineValueLabel' && (
                            // <LineValueLabel id={id} path="option" />
                            <CustomizeValueLabels
                                id={id}
                                option={data.option}
                                chartType={LINE_CHART_DATA.JSONVALUE[0]}
                                path="option"
                            ></CustomizeValueLabels>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'lineStyling'
                                        ? ''
                                        : 'lineStyling',
                                )
                            }
                            selected={selectedList === 'lineStyling'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'lineStyling'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Line Styling" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'lineStyling' && (
                            <LineStyling id={id} path="option" />
                        )}
                    </StyledListItem>
                    {/* <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'chartStyling'
                                        ? ''
                                        : 'chartStyling',
                                )
                            }
                            selected={selectedList === 'chartStyling'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'chartStyling'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Chart Styling" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'chartStyling' && (
                            <SizeSettings   id={id}
                            label={"Height"}
                            path={"style.height"} />
                        )}
                    </StyledListItem> */}
                </List>
            </>
        );
    });
