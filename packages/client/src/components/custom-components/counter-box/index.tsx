import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

export interface CounterBoxProps {
    initialCount?: number;
    color?: string;
}

export const componentProperties = [
    {
        name: 'initialCount',
        type: 'number',
        default: 0,
        description: 'Starting value for the counter',
    },
    {
        name: 'color',
        type: 'string',
        default: '#1976d2',
        description: 'Color for the counter and button',
    },
];

const CounterBox: React.FC<CounterBoxProps> = ({
    initialCount = 0,
    color = '#1976d2',
}) => {
    const [count, setCount] = useState(initialCount);

    return (
        <Box
            p={3}
            border="2px solid"
            borderColor={color}
            borderRadius={1}
            textAlign="center"
        >
            <Typography variant="h3" color={color}>
                {count}
            </Typography>
            <Button
                onClick={() => setCount((prev) => prev + 1)}
                variant="contained"
                sx={{ backgroundColor: color, mt: 2 }}
            >
                Increment
            </Button>
        </Box>
    );
};

export default CounterBox;
