import React from 'react';
import { Box, Typography, LinearProgress, Stack } from '@mui/material';

export interface ProgressStatsProps {
    title?: string;
    current?: number;
    total?: number;
    showPercentage?: boolean;
    progressColor?: string;
    size?: 'small' | 'medium' | 'large';
}

export const componentProperties = [
    {
        name: 'title',
        type: 'string',
        default: 'Progress',
        description: 'Title of the progress stats',
    },
    {
        name: 'current',
        type: 'number',
        default: 65,
        description: 'Current value',
    },
    {
        name: 'total',
        type: 'number',
        default: 100,
        description: 'Total value',
    },
    {
        name: 'showPercentage',
        type: 'boolean',
        default: true,
        description: 'Show percentage alongside the progress bar',
    },
    {
        name: 'progressColor',
        type: 'string',
        default: '#2196f3',
        description: 'Color of the progress bar',
    },
    {
        name: 'size',
        type: 'string',
        default: 'medium',
        description: 'Size of the component: small, medium, or large',
    },
];

const ProgressStats: React.FC<ProgressStatsProps> = ({
    title = 'Progress',
    current = 65,
    total = 100,
    showPercentage = true,
    progressColor = '#2196f3',
    size = 'medium',
}) => {
    const percentage = Math.round((current / total) * 100);

    const getPadding = () => {
        switch (size) {
            case 'small':
                return 1;
            case 'large':
                return 3;
            default:
                return 2;
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'small':
                return 'body2';
            case 'large':
                return 'h6';
            default:
                return 'body1';
        }
    };

    return (
        <Box
            p={getPadding()}
            border="1px solid"
            borderColor="divider"
            borderRadius={1}
        >
            <Stack spacing={1}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <Typography variant={getFontSize()}>{title}</Typography>
                    {showPercentage && (
                        <Typography
                            variant={getFontSize()}
                            color="text.secondary"
                        >
                            {percentage}%
                        </Typography>
                    )}
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={percentage}
                    sx={{
                        height: size === 'small' ? 4 : size === 'large' ? 8 : 6,
                        '& .MuiLinearProgress-bar': {
                            backgroundColor: progressColor,
                        },
                    }}
                />
                <Typography variant="caption" color="text.secondary">
                    {current} of {total} completed
                </Typography>
            </Stack>
        </Box>
    );
};

export default ProgressStats;
