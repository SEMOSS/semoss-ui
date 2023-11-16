import React from 'react';
import {
    styled,
    Paper,
    Select,
    Slider,
    Typography,
    Tooltip,
    List,
    MenuItem,
} from '@semoss/ui';
import { EditOutlined } from '@mui/icons-material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export interface Model {
    database_name?: string;
    database_id?: string;
}

const StyledSidebar = styled(Paper)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    width: '280px',
    borderRadius: '0',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    [theme.breakpoints.down('md')]: {
        position: 'absolute',
        zIndex: open ? theme.zIndex.drawer + 2 : -1,
        width: '100%',
        maxWidth: '280px',
    },
    height: '100%',
    zIndex: 2,
}));

const StyledDiv = styled('div')(({ theme }) => ({
    marginTop: theme.spacing(3),
    display: 'flex',
}));

const StyledList = styled(List)(({ theme }) => ({
    width: '100%',
    padding: '8px, 16px, 8px, 16px',
    borderRadius: theme.shape.borderRadius,
    background: 'rgba(217, 217, 217, 0.3)',
}));

export const Sidebar = ({
    modelOptions,
    selectedModel,
    setSelectedModel,
    limit,
    setLimit,
    temperature,
    setTemperature,
}) => {
    const limitTooltipText = `
    This will change the amount of documents pulled from 
    a vector database. Pulling too many documents can potentially cause your engines
    token limit to be exceeded!
    `;

    const temperatureTooltipText = `
    This changes the randomness of the LLM's output. 
    The higher the temperature the more creative and imaginative your
    answer will be.
    `;
    return (
        <StyledSidebar>
            <StyledList disablePadding>
                <List.Item>
                    <List.ItemButton>
                        <EditOutlined />
                    </List.ItemButton>
                    <List.ItemText
                        primary={
                            <Typography variant="subtitle2">
                                Adjust Configurations
                            </Typography>
                        }
                    />
                </List.Item>
            </StyledList>
            <Typography variant="body1">Select Model: </Typography>
            <Select
                onChange={(e) => setSelectedModel(e.target.value)}
                value={selectedModel}
            >
                {modelOptions.map((option, i) => {
                    return (
                        <MenuItem value={option} key={i}>
                            {option.database_name}
                        </MenuItem>
                    );
                })}
            </Select>

            <StyledDiv style={{ display: 'flex' }}>
                <Typography variant="body1">
                    Limit the queried results:{' '}
                </Typography>
                <Tooltip title={limitTooltipText}>
                    <HelpOutlineIcon
                        color="primary"
                        sx={{ fontSize: 15, marginLeft: '5px' }}
                    />
                </Tooltip>
            </StyledDiv>

            <Slider
                value={limit}
                step={1}
                min={1}
                max={10}
                marks
                valueLabelDisplay="auto"
                onChange={(event, newValue) => setLimit(newValue)}
            />

            <StyledDiv>
                <Typography variant="body1">Set Temperature: </Typography>
                <Tooltip title={temperatureTooltipText}>
                    <HelpOutlineIcon
                        color="primary"
                        sx={{ fontSize: 15, marginLeft: '5px' }}
                    />
                </Tooltip>
            </StyledDiv>

            <Slider
                value={temperature}
                step={0.1}
                min={0.1}
                max={1}
                marks
                valueLabelDisplay="auto"
                onChange={(event, newValue) => setTemperature(newValue)}
            />
        </StyledSidebar>
    );
};
