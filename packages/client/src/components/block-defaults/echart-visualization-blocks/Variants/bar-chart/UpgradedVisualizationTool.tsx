import { useState } from 'react';
import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { EchartVisualizationBlockDef } from '../PieChart/echartblocks';
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
                            <p>Colour By Value Component</p>
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
                            <p>Edit X Axis Component</p>
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
                            <p>Edit Y Axis Component</p>
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
                            <p>Value Labels Component</p>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
                        <ListItemButton
                            onClick={(e) =>
                                setSelectedList((prevList) =>
                                    prevList === 'barstyle' ? '' : 'barstyle',
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
                        {selectedList === 'barstyle' && (
                            <p>Bar Chart Styles Component</p>
                        )}
                    </StyledListItem>
                    <StyledListItem disablePadding>
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
                        {selectedList === 'trendlines' && (
                            <p>Trendlines component</p>
                        )}
                    </StyledListItem>
                </List>
            </>
        );
    });
