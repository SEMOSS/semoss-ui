import React, { useState, useMemo } from 'react';
import {
    Box,
    Paper,
    Typography,
    Chip,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Stack,
    styled,
} from '@mui/material';
import { ZoomIn, ZoomOut, FitScreen } from '@mui/icons-material';

// Interface Definitions
interface TraceActivity {
    createdDate: string;
    activityType: string;
    type: string;
    result: Record<string, any>;
    responseTime: string;
}

interface TimelineRange {
    start: Date;
    end: Date;
    duration: number;
}

interface TraceViewerProps {
    activities: TraceActivity[];
}

// Styled Components
const MainContainer = styled(Box)(({ theme }) => ({
    width: '100%',
    backgroundColor: theme.palette.background.default,
    display: 'flex',
    flexDirection: 'column',
}));

const TopPanel = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
}));

const BottomPanel = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    flex: 1,
    overflow: 'auto',
    borderRadius: theme.shape.borderRadius,
}));

const TimelineContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    height: 150,
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    overflow: 'hidden',
}));

const TimelineTimestamp = styled(Box)(({ theme }) => ({
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
    fontWeight: 500,
    writingMode: 'sideways-lr',
    textOrientation: 'mixed',
}));

const ActivityMarker = styled(Box)<{ bgcolor: string }>(
    ({ theme, bgcolor }) => ({
        position: 'absolute',
        width: 8,
        height: 20,
        borderRadius: 4,
        backgroundColor: bgcolor,
        cursor: 'pointer',
        transform: 'translateX(-50%)',
        transition: 'all 0.2s ease',
        '&:hover': {
            transform: 'translateX(-50%) scale(1.2)',
            boxShadow: theme.shadows[4],
        },
    }),
);

const LegendContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    width: 'fit-content',
    overflowX: 'auto',
    // make the container float right end
    marginLeft: 'auto !important',
}));

const LegendItem = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
}));

const LegendColor = styled(Box)<{ bgcolor: string }>(({ bgcolor }) => ({
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: bgcolor,
}));

const ActivityDetailsContainer = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[50],
    borderRadius: theme.shape.borderRadius,
}));

const ResultDataContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    fontSize: '0.875rem',
    fontFamily: 'monospace',
    overflow: 'auto',
    maxHeight: 240,
    whiteSpace: 'pre-wrap',
}));

const TraceViewer: React.FC<TraceViewerProps> = ({ activities }) => {
    const [selectedActivity, setSelectedActivity] =
        useState<TraceActivity | null>(null);
    const [zoomLevel, setZoomLevel] = useState<number>(1);

    const baseTimelineRange = useMemo((): TimelineRange => {
        if (activities.length === 0) {
            const now = new Date();
            return {
                start: now,
                end: new Date(now.getTime() + 1000),
                duration: 1000,
            };
        }

        const dates = activities.map(
            (activity) => new Date(activity.createdDate),
        );
        const start = new Date(Math.min(...dates.map((d) => d.getTime())));
        const end = new Date(Math.max(...dates.map((d) => d.getTime())) + 1000);

        return {
            start,
            end,
            duration: end.getTime() - start.getTime(),
        };
    }, [activities]);

    const zoomedTimelineRange = useMemo((): TimelineRange => {
        const center =
            baseTimelineRange.start.getTime() + baseTimelineRange.duration / 2;
        const zoomedDuration = baseTimelineRange.duration / zoomLevel;
        return {
            start: new Date(center - zoomedDuration / 2),
            end: new Date(center + zoomedDuration / 2),
            duration: zoomedDuration,
        };
    }, [baseTimelineRange, zoomLevel]);

    const getActivityColor = (activityType: string, type: string) => {
        const typeColorMap: Record<string, string> = {
            user_text: '#4caf50', // Green
            response_text: '#f44336', // Red
        };
        return typeColorMap[type] || '#9c27b0';
    };

    const getTimelinePosition = (activity: TraceActivity) => {
        const activityTime = new Date(activity.createdDate).getTime();
        const relativeTime = activityTime - zoomedTimelineRange.start.getTime();
        const percentage = (relativeTime / zoomedTimelineRange.duration) * 100;
        return Math.max(0, Math.min(100, percentage));
    };

    const visibleActivities = useMemo(() => {
        return activities.filter((activity) => {
            const activityTime = new Date(activity.createdDate).getTime();
            return (
                activityTime >= zoomedTimelineRange.start.getTime() &&
                activityTime <= zoomedTimelineRange.end.getTime()
            );
        });
    }, [activities, zoomedTimelineRange]);

    const generateTimelineMarkers = () => {
        const markers = [];
        const markerCount = Math.min(
            10,
            Math.max(4, Math.floor(zoomLevel * 6)),
        );
        for (let i = 0; i <= markerCount; i++) {
            const percentage = (i / markerCount) * 100;
            const time = new Date(
                zoomedTimelineRange.start.getTime() +
                    (zoomedTimelineRange.duration * i) / markerCount,
            );
            const timeString = time.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            markers.push({ percentage, time: timeString });
        }
        return markers;
    };

    const handleActivityClick = (activity: TraceActivity) => {
        setSelectedActivity(activity);
    };

    const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev * 1.2, 5));
    const handleZoomOut = () =>
        setZoomLevel((prev) => Math.max(prev / 1.2, 0.2));
    const handleFitScreen = () => setZoomLevel(1);

    const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
        // Ensure the wheel event is only handled if it's the timeline itself, not a child element
        if (!(e.currentTarget as HTMLElement).contains(e.target as Node))
            return;

        e.preventDefault();
        if (e.deltaY < 0) handleZoomIn();
        else handleZoomOut();
    };

    const legendData = useMemo(() => {
        const types = Array.from(new Set(activities.map((a) => a.type)));
        const typeColorMap: Record<string, string> = {
            user_text: '#4caf50',
            response_text: '#f44336',
        };
        return types.map((type) => ({
            label: type,
            color: typeColorMap[type] || '#9e9e9e',
        }));
    }, [activities]);

    const timelineMarkers = generateTimelineMarkers();

    const renderActivityDetails = (activity: TraceActivity) => (
        <ActivityDetailsContainer>
            <Typography variant="h6" gutterBottom>
                Activity Details
            </Typography>
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 2,
                }}
            >
                <Box>
                    <Typography variant="body2" color="textSecondary">
                        Activity Type
                    </Typography>
                    <Typography>{activity.activityType}</Typography>
                </Box>
                <Box>
                    <Typography variant="body2" color="textSecondary">
                        Type
                    </Typography>
                    <Typography>{activity.type}</Typography>
                </Box>
                <Box>
                    <Typography variant="body2" color="textSecondary">
                        Created Date
                    </Typography>
                    <Typography>{activity.createdDate}</Typography>
                </Box>
                <Box>
                    <Typography variant="body2" color="textSecondary">
                        Response Time
                    </Typography>
                    <Typography>{activity.responseTime}s</Typography>
                </Box>
            </Box>
            <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Result Data
                </Typography>
                <ResultDataContainer>
                    {JSON.stringify(activity.result, null, 2)}
                </ResultDataContainer>
            </Box>
        </ActivityDetailsContainer>
    );

    return (
        <MainContainer>
            <TopPanel elevation={2}>
                <Stack spacing={2}>
                    <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <Typography variant="h5" fontWeight="600">
                            Event History
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <IconButton size="small" onClick={handleZoomIn}>
                                <ZoomIn />
                            </IconButton>
                            <IconButton size="small" onClick={handleZoomOut}>
                                <ZoomOut />
                            </IconButton>
                            <IconButton size="small" onClick={handleFitScreen}>
                                <FitScreen />
                            </IconButton>
                        </Stack>
                    </Box>

                    <Box position="relative" display="flex" alignItems="center">
                        <TimelineTimestamp>
                            {zoomedTimelineRange.start.toLocaleTimeString(
                                'en-US',
                                {
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                },
                            )}
                        </TimelineTimestamp>
                        <TimelineContainer
                            sx={{ flex: 1 }}
                            onWheel={handleWheelZoom}
                        >
                            <Box
                                position="absolute"
                                top={0}
                                left={0}
                                right={0}
                                height={24}
                            >
                                {timelineMarkers.map((marker, index) => (
                                    <Box
                                        key={index}
                                        position="absolute"
                                        sx={{
                                            left: `${marker.percentage}%`,
                                            transform: 'translateX(-50%)',
                                            fontSize: '0.75rem',
                                            color: 'text.secondary',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {marker.time}
                                    </Box>
                                ))}
                            </Box>
                            <Box
                                position="absolute"
                                top={24}
                                left={0}
                                right={0}
                                bottom={0}
                            >
                                {timelineMarkers.map((marker, index) => (
                                    <Box
                                        key={index}
                                        position="absolute"
                                        sx={{
                                            left: `${marker.percentage}%`,
                                            top: 0,
                                            bottom: 0,
                                            width: '1px',
                                            backgroundColor: 'divider',
                                        }}
                                    />
                                ))}
                            </Box>
                            <Box
                                position="absolute"
                                top={32}
                                left={8}
                                right={8}
                                bottom={8}
                            >
                                {visibleActivities.map((activity, index) => {
                                    const position =
                                        getTimelinePosition(activity);
                                    const color = getActivityColor(
                                        activity.activityType,
                                        activity.type,
                                    );
                                    return (
                                        <Tooltip
                                            key={index}
                                            title={`${activity.activityType} - ${activity.type} at ${activity.createdDate}`}
                                            arrow
                                        >
                                            <ActivityMarker
                                                bgcolor={color}
                                                sx={{
                                                    left: `${position}%`,
                                                    top: `${
                                                        (index % 4) * 20
                                                    }px`,
                                                }}
                                                onClick={() =>
                                                    handleActivityClick(
                                                        activity,
                                                    )
                                                }
                                            />
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </TimelineContainer>
                        <TimelineTimestamp>
                            {zoomedTimelineRange.end.toLocaleTimeString(
                                'en-US',
                                {
                                    hour12: false,
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                },
                            )}
                        </TimelineTimestamp>
                    </Box>

                    <LegendContainer>
                        {legendData.map((legend, index) => (
                            <LegendItem key={index}>
                                <LegendColor bgcolor={legend.color} />
                                <Typography variant="body2">
                                    {legend.label}
                                </Typography>
                            </LegendItem>
                        ))}
                    </LegendContainer>
                </Stack>
            </TopPanel>

            <BottomPanel elevation={2}>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                    Activities
                </Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell>Activity Type</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Created Date</TableCell>
                                <TableCell>Response Time</TableCell>
                                <TableCell>Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {activities.map((activity, index) => (
                                <TableRow
                                    key={index}
                                    hover
                                    onClick={() =>
                                        handleActivityClick(activity)
                                    }
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <TableCell>
                                        <Chip
                                            label={activity.activityType}
                                            size="small"
                                            sx={{
                                                backgroundColor:
                                                    getActivityColor(
                                                        activity.activityType,
                                                        activity.type,
                                                    ),
                                                color: 'white',
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>{activity.type}</TableCell>
                                    <TableCell>
                                        {activity.createdDate}
                                    </TableCell>
                                    <TableCell>
                                        {activity.responseTime}s
                                    </TableCell>
                                    <TableCell sx={{ backgroundColor: '#f5f5f5'}}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                maxWidth: 200,
                                            }}
                                        >
                                            {JSON.stringify(activity.result)}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <>
                    {!selectedActivity ? (
                        <></>
                    ) : (
                        renderActivityDetails(selectedActivity)
                    )}
                </>
            </BottomPanel>
        </MainContainer>
    );
};

export default TraceViewer;
