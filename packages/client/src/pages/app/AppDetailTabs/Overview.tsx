import React from 'react';
import { Box, Grid, Typography, Card, Chip, Stack } from '@semoss/ui';
import View from '../../../assets/img/ViewIcon.png';
import Download from '../../../assets/img/Downloads.png';
import Apps from '../../../assets/img/Apps.png';
import Usability from '../../../assets/img/Usability.png';
import BLOCKS_APP_2 from '@/assets/img/blocks_app_2.png';

// Statistics configuration
const stats = [
    { icon: View, label: 'Views', value: '100' },
    { icon: Download, label: 'Downloads', value: '45' },
    { icon: Apps, label: 'Apps', value: '10' },
    { icon: Usability, label: 'Usability', value: '9.5/10' },
];

// Similar Apps Data Placeholder
const similarApps = [
    {
        project_id: '1',
        project_name: 'Task Manager',
        project_description: 'Manage daily tasks efficiently',
    },
    {
        project_id: '2',
        project_name: 'Progress Tracker',
        project_description: 'Track your progress',
    },
    {
        project_id: '1',
        project_name: 'Task Manager',
        project_description: 'Manage daily tasks efficiently',
    },
    {
        project_id: '2',
        project_name: 'Progress Tracker',
        project_description: 'Track your progress',
    },
];

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

interface OverviewProps {
    appInfo: {
        markdown?: string;
    };
}
export const Overview = ({ appInfo }: OverviewProps) => {
    return (
        <Box sx={{ px: 3, py: 4, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Details
            </Typography>
            <Typography variant="body2">{appInfo?.markdown}</Typography>

            <Typography variant="h6" gutterBottom sx={{ paddingTop: '8px' }}>
                Statistics
            </Typography>

            <Grid container spacing={2} mb={4}>
                {stats.map((stat, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <Box
                            sx={{
                                border: '1px solid #ddd',
                                borderRadius: 2,
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            }}
                        >
                            <img
                                src={stat.icon}
                                alt={stat.label}
                                width={60}
                                height={60}
                                style={{ objectFit: 'contain' }}
                            />
                            <Box>
                                <Typography variant="body2">
                                    {stat.label}
                                </Typography>
                                <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                >
                                    {stat.value}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                ))}
            </Grid>

            <Typography sx={{ paddingTop: '8px' }} variant="h6" gutterBottom>
                Similar Apps
            </Typography>

            <Grid container spacing={2}>
                {similarApps.map((app) => (
                    <Grid item xs={12} sm={6} md={3} key={app.project_id}>
                        <Card
                            sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                borderRadius: 2,
                                boxShadow: 1,
                            }}
                        >
                            <Box>
                                <img
                                    src={BLOCKS_APP_2}
                                    alt="App Icon"
                                    style={{ objectFit: 'contain' }}
                                    height={300}
                                    width="100%"
                                />
                                <Typography
                                    variant="subtitle1"
                                    sx={{ padding: '8px' }}
                                    gutterBottom
                                >
                                    {app.project_name}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ padding: '8px' }}
                                    gutterBottom
                                >
                                    {app.project_description}
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};
