import React from 'react';
import { Card, Typography } from '@mui/material';

export interface WelcomeCardProps {
    title?: string;
    subtitle?: string;
}

export const componentProperties = [
    {
        name: 'title',
        type: 'string',
        default: 'Welcome!',
        description: 'Main title of the card',
    },
    {
        name: 'subtitle',
        type: 'string',
        default: 'Have a great day',
        description: 'Subtitle text below the main title',
    },
];

const WelcomeCard: React.FC<WelcomeCardProps> = ({
    title = 'Welcome!',
    subtitle = 'Have a great day',
}) => {
    return (
        <Card
            sx={{
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                textAlign: 'center',
            }}
        >
            <Typography variant="h4" gutterBottom>
                {title}
            </Typography>
            <Typography color="textSecondary">{subtitle}</Typography>
        </Card>
    );
};

export default WelcomeCard;
