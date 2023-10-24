import { styled, Button, Stack, Typography, useNotification } from '@semoss/ui';

import { useEngine, usePixel } from '@/hooks';

import { LoadingScreen } from '@/components/ui';
import { ContentCopyOutlined } from '@mui/icons-material';

const StyledCodeBlock = styled('pre')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '40px',
    background: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    margin: '0px',
    overflowX: 'scroll',
}));

const StyledCodeContent = styled('code')(() => ({
    flex: 1,
}));

/**
 * Wrap the Database, Storage, Model routes
 */
export const EngineUsagePage = () => {
    // get the database information
    const { id } = useEngine();
    const notification = useNotification();

    // get the engine info
    const getEngineUsage = usePixel<{
        pixel?: string;
        python?: string;
        java?: string;
    }>(`GetEngineUsage(engine=["${id}"]);`);

    /**
     * Copy text and add it to the clipboard
     * @param text - text to copy
     */
    const copy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);

            notification.add({
                color: 'success',
                message: 'Successfully copied code',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: 'Unable to copy code',
            });
        }
    };

    // show a loading screen when it is pending
    if (getEngineUsage.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Loading Usage" />;
    }

    return (
        <Stack spacing={2}>
            <Typography variant={'h6'} fontWeight="regular">
                Use in Code
            </Typography>
            {Object.keys(getEngineUsage.data).length === 0 ? (
                <Stack p={4} alignItems={'center'} justifyContent={'center'}>
                    No Details
                </Stack>
            ) : (
                ''
            )}
            {['pixel', 'python', 'java'].map((p, idx) => {
                const text = getEngineUsage.data[p];
                const name = p.replace(/\w\S*/g, function (txt) {
                    return (
                        txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
                    );
                });
                if (!text) {
                    return null;
                }

                return (
                    <Stack key={idx} direction="column" spacing={1}>
                        <Typography variant={'subtitle1'}>
                            How to use in {name}
                        </Typography>
                        <StyledCodeBlock>
                            <StyledCodeContent>{text}</StyledCodeContent>
                            <Button
                                size={'medium'}
                                variant="outlined"
                                startIcon={
                                    <ContentCopyOutlined color={'inherit'} />
                                }
                                onClick={() => copy(text)}
                            >
                                Copy
                            </Button>
                        </StyledCodeBlock>
                    </Stack>
                );
            })}
        </Stack>
    );
};
