import React from 'react';
import { Box, Typography, Alert, AlertTitle } from '@mui/material';

export interface NotificationCardProps {
    title?: string;
    message?: string;
    type?: 'error' | 'warning' | 'info' | 'success';
    showIcon?: boolean;
}

export const componentProperties = [
    {
        name: 'title',
        type: 'string',
        default: 'Notification',
        description: 'Title of the notification',
    },
    {
        name: 'message',
        type: 'string',
        default: 'This is a notification message',
        description: 'Main message of the notification',
    },
    {
        name: 'type',
        type: 'string',
        default: 'info',
        description: 'Type of notification: error, warning, info, or success',
    },
    {
        name: 'showIcon',
        type: 'boolean',
        default: true,
        description: 'Whether to show the notification icon',
    },
];

const NotificationCard: React.FC<NotificationCardProps> = ({
    title = 'Notification',
    message = 'This is a notification message',
    type = 'info',
    showIcon = true,
}) => {
    return (
        <Box p={2}>
            <Alert severity={type as any} icon={showIcon}>
                <AlertTitle>{title}</AlertTitle>
                {message}
            </Alert>
        </Box>
    );
};

export default NotificationCard;
