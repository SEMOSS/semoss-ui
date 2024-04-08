import {
    styled,
    Box,
    LinearProgress,
    LinearProgressProps,
    Typography,
} from '@semoss/ui';

const FlexBox = styled(Box)(() => ({
    display: 'flex',
    alignItems: 'center',
}));

export const PromptBuilderSummaryProgress = (
    props: LinearProgressProps & { progress: number },
) => {
    return (
        <FlexBox>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress
                    variant="determinate"
                    color="success"
                    value={props.progress}
                />
            </Box>
            <Box>
                <Typography variant="body2">{`${Math.round(
                    props.progress,
                )}%`}</Typography>
            </Box>
        </FlexBox>
    );
};
