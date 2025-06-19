import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, Stack, Typography, CircularProgress } from '@mui/material';

import { ChatRoom } from '@/stores';
import { useNotification, RightMenu } from '@/components';
import { MessageAppResponse } from '@/types';

const PLATFORM_LINK = process.env.PLATFORM_LINK;

interface RoomAppComponentProps {
    /** Room to render */
    room: ChatRoom;
}

export const RoomAppComponent: React.FC<RoomAppComponentProps> = observer(
    (props) => {
        // set the get the room based on the params
        const { room } = props;

        const notification = useNotification();

        // TODO: clean-up
        const response: MessageAppResponse | null =
            room.sidebar.options.type === 'APP'
                ? room.sidebar.options.response
                : null;

        const [parameters, setParameters] = useState(response.parameters);

        const [appOutput, setAppOutput] = useState(null);
        const [appUrl, setAppUrl] = useState('');
        const [loading, setLoading] = useState(true);

        useEffect(() => {
            const handleMessage = async (
                event: MessageEvent<{ data: Record<string, unknown> }>,
            ) => {
                try {
                    await room.processAppResponse(response, event.data.data);
                } catch (e) {
                    notification.add({
                        message: e.message,
                        color: 'error',
                    });
                }

                room.closeSidebar();
            };

            // TODO: Env specific
            // let url = `http://localhost:9090/SemossWeb/packages/client/dist/#/s/${response.id}`;
            let url = `${PLATFORM_LINK}s/${response.id}`;

            // TODO: CLeanup code below
            const paramsToFill = [];
            response.parameters.forEach((p) => {
                if (p.value !== 'undefined' || !p.value) {
                    paramsToFill.push(p);
                }
            });

            if (paramsToFill.length === 1) {
                url += `?${paramsToFill[0].name}=${paramsToFill[0].value}`;
            } else if (paramsToFill.length > 1) {
                url += `?`;

                paramsToFill.forEach((p, i) => {
                    url += `${paramsToFill[i].name}=${paramsToFill[i].value}`;
                    if (i !== paramsToFill.length - 1) {
                        url += '&';
                    }
                });
            }

            setAppUrl(url);

            window.addEventListener('message', handleMessage);

            return () => {
                window.removeEventListener('message', handleMessage);
            };
        }, []);

        return (
            <RightMenu
                mode={'fixed'}
                header={
                    <Typography
                        variant={'body1'}
                        fontWeight={'bold'}
                        flex={1}
                        noWrap={true}
                    >
                        {response.name}
                    </Typography>
                }
                onClose={() => room.closeSidebar()}
            >
                {appOutput ? (
                    <Stack>{JSON.stringify(appOutput)}</Stack>
                ) : appUrl ? (
                    <Box position="relative" width={'100%'} height={'100%'}>
                        {loading && (
                            <Box
                                position={'absolute'}
                                top={0}
                                bottom={0}
                                width="100%"
                                height="100%"
                                display="flex"
                                justifyContent={'center'}
                                alignItems={'center'}
                                bgcolor={'rgba(255, 255, 255, 0.5)'}
                                zIndex={1}
                            >
                                <CircularProgress color={'info'} />
                            </Box>
                        )}
                        <iframe
                            src={appUrl}
                            frameBorder="0"
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            onLoad={() => setLoading(false)}
                        ></iframe>
                    </Box>
                ) : null}
            </RightMenu>
        );
    },
);
