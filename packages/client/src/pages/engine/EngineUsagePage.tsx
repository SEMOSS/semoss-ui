import { Stack, Typography, useNotification, Markdown, Code } from '@semoss/ui';

import { useEngine, usePixel } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

/**
 * Wrap the Database, Storage, Model routes
 */
export const EngineUsagePage = () => {
    // get the database information
    const { id } = useEngine();
    const notification = useNotification();

    // get the engine info
    const GetEngineUsage = usePixel<{
        code: string;
        label: string;
        type: string;
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
    if (GetEngineUsage.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Loading Usage" />;
    }

    return (
        <Stack spacing={2}>
            <Typography variant={'h6'} fontWeight="regular">
                Use in Code
            </Typography>
            {Object.keys(GetEngineUsage.data).length === 0 ? (
                <Stack p={4} alignItems={'center'} justifyContent={'center'}>
                    No Details
                </Stack>
            ) : (
                ''
            )}
            {Object.keys(GetEngineUsage.data).map((key, idx) => {
                const { code, label } = GetEngineUsage.data[key];

                if (!code) {
                    return null;
                }

                return (
                    <Stack key={idx} direction="column" spacing={1}>
                        <Typography variant={'subtitle1'}>{label}</Typography>
                        <Markdown
                            components={{
                                pre: ({ children }) => {
                                    return (
                                        <Code.Container>
                                            {children}
                                        </Code.Container>
                                    );
                                },
                            }}
                        >
                            {code}
                        </Markdown>
                    </Stack>
                );
            })}
        </Stack>
    );
};
