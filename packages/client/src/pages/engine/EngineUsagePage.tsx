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
}));

const StyledCodeContent = styled('code')(() => ({
    flex: 1,
    overflowX: 'scroll',
}));

/**
 * Wrap the Database, Storage, Model routes
 */
export const EngineUsagePage = () => {
    // get the database information
    const { id } = useEngine();
    const notification = useNotification();

    // get the engine info
    const GetEngineUsage2 = usePixel<{
        code: string;
        label: string;
        type: string;
    }>(`GetEngineUsage2(engine=["${id}"]);`);

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
    if (GetEngineUsage2.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Loading Usage" />;
    }

    return (
        <Stack spacing={2}>
            <Typography variant={'h6'} fontWeight="regular">
                Use in Code
            </Typography>
            {Object.keys(GetEngineUsage2.data).length === 0 ? (
                <Stack p={4} alignItems={'center'} justifyContent={'center'}>
                    No Details
                </Stack>
            ) : (
                ''
            )}
            {Object.keys(GetEngineUsage2.data).map((key, idx) => {
                const { code, label } = GetEngineUsage2.data[key];

                if (!code) {
                    return null;
                }

                return (
                    <Stack key={idx} direction="column" spacing={1}>
                        <Typography variant={'subtitle1'}>{label}</Typography>
                        <StyledCodeBlock>
                            <StyledCodeContent>{code}</StyledCodeContent>
                            <Button
                                size="medium"
                                variant="outlined"
                                color="secondary"
                                startIcon={
                                    <ContentCopyOutlined color={'inherit'} />
                                }
                                onClick={() => copy(code)}
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
