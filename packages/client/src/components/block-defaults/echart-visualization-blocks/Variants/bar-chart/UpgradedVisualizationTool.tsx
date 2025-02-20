import { useState } from 'react';
import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { List, Stack, styled } from '@semoss/ui';
import ImageIcon from '@mui/icons-material/Image';
import {
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';
import { EchartVisualizationBlockDef } from '../../EchartVisualizationBlock';
import { EditXAxisScatterPlot } from '../../ScatterPlot.tsx/EditXAxisScatterPlot';
import { EditYAxisScatterPlot } from '../../ScatterPlot.tsx/EditYAxisScatterPlot';
import { TooltipScatterPlot } from '../../ScatterPlot.tsx/TooltipScatterPlot';
import { ValueLabelScatterPlot } from '../../ScatterPlot.tsx/ValueLabelScatterPlot';
import { SizeSettings } from '@/components/block-settings';
import { ScatterPlotSymbol } from '../../ScatterPlot.tsx/ScatterPlotSymbol';
import { ScatterPlotChartTitle } from '../../ScatterPlot.tsx/ScatterPlotChartTitle';
import { ColorPalatteSettings } from '@/components/block-settings/shared/ColorPalatteSettings';
import { ColorPickerSettings } from '@/components/block-settings/shared/ColorPickerSettings';

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
                            <Stack
                                width={'100%'}
                                style={{ padding: '0.95%', width: 'inherit' }}
                            >
                                <ColorPalatteSettings
                                    id={id}
                                    path="option.color"
                                />
                            </Stack>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
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
                        {selectedList === 'colourbyvalue' && (
                            <ColorPickerSettings id={id} path="option" />
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'editxaxis' ? '' : 'editxaxis',
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
                        {selectedList === 'editxaxis' && (
                            <EditXAxisScatterPlot
                                id={id}
                                path={'option'}
                            ></EditXAxisScatterPlot>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'edityaxis' ? '' : 'edityaxis',
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
                        {selectedList === 'edityaxis' && (
                            <EditYAxisScatterPlot
                                id={id}
                                path={'option'}
                            ></EditYAxisScatterPlot>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
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
                        {selectedList === 'valuelabel' && (
                            <ValueLabelScatterPlot
                                id={id}
                                path={'option'}
                            ></ValueLabelScatterPlot>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'tooltips' ? '' : 'tooltips',
                                )
                            }
                            selected={selectedList === 'tooltips'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'tooltips'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Tooltips" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'tooltips' && (
                            <TooltipScatterPlot
                                id={id}
                                path={'option'}
                            ></TooltipScatterPlot>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'resizing' ? '' : 'resizing',
                                )
                            }
                            selected={selectedList === 'resizing'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'resizing'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Resizing" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'resizing' && (
                            <Stack>
                                <SizeSettings
                                    id={id}
                                    label={'Height'}
                                    path={'style.height'}
                                ></SizeSettings>
                                <SizeSettings
                                    id={id}
                                    label={'Width'}
                                    path={'style.width'}
                                ></SizeSettings>
                            </Stack>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'symbol' ? '' : 'symbol',
                                )
                            }
                            selected={selectedList === 'symbol'}
                        >
                            <ListItemIcon>
                                <ImageIcon
                                    fontSize="large"
                                    color={
                                        selectedList === 'symbol'
                                            ? 'primary'
                                            : 'disabled'
                                    }
                                />
                            </ListItemIcon>
                            <ListItemText primary="Symbol" />
                            <InfoOutlined />
                        </ListItemButton>
                        {selectedList === 'symbol' && (
                            <ScatterPlotSymbol
                                id={id}
                                path={'option'}
                            ></ScatterPlotSymbol>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
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
                        {selectedList === 'title' && (
                            <ScatterPlotChartTitle
                                id={id}
                                path={'option'}
                            ></ScatterPlotChartTitle>
                        )}
                    </StyledListItem>
                </List>
            </>
        );
    });
