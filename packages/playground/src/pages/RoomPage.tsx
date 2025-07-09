import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import {
    styled,
    Stack,
    Container,
    IconButton,
    Typography,
    CircularProgress,
    Tooltip,
} from '@semoss/ui';
import { Resizable } from 're-resizable';
import { useNavigate, useParams } from 'react-router-dom';
import {
    AccessTimeOutlined,
    DownloadRounded,
    TuneRounded,
} from '@mui/icons-material';
import { useNotification } from '@semoss/ui';
import { useChat } from '@/hooks';
import {
    RoomAppComponent,
    RoomControlsComponent,
    RoomInputComponent,
    RoomMessageComponent,
} from '@/components';

const StyledPage = styled(Stack)(() => ({
    width: '100%',
    height: '100%',
}));

const StyledContent = styled(Stack)(() => ({
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledScroll = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column-reverse',
    flex: 1,
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
}));

export const RoomPage = observer(() => {
    const { chat } = useChat();

    const notification = useNotification();
    const navigate = useNavigate();

    // set the get the room based on the params
    const { roomId } = useParams();

    // get the room
    const room = chat.getRoom(roomId);

    // load the room
    useEffect(() => {
        if (!room || room.isInitialized) {
            return;
        }

        try {
            room.initialize();
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });

            navigate('/');
        }
    }, [room]);

    if (!room || !room.isInitialized) {
        return (
            <StyledPage
                direction={'column'}
                alignItems={'center'}
                justifyContent={'center'}
            >
                <CircularProgress color={'primary'} />;
            </StyledPage>
        );
    }

    return (
        <StyledPage direction={'column'} spacing={3}>
            <Stack
                direction={'row'}
                padding={1}
                alignItems={'center'}
                spacing={1}
                width={'100%'}
            >
                <Stack direction={'row'} alignItems={'center'} spacing={1}>
                    <AccessTimeOutlined fontSize="medium" />
                    <Typography variant={'body2'}>
                        {room?.metadata?.dateCreated}
                    </Typography>
                </Stack>
                <Typography
                    variant={'body2'}
                    noWrap={true}
                    sx={{
                        flex: 1,
                        textAlign: 'center',
                        textOverflow: 'hidden',
                    }}
                >
                    {room?.metadata?.name}
                </Typography>
                <Stack direction={'row'} alignItems={'center'} spacing={1}>
                    <Tooltip title="Download Chat History">
                        <IconButton
                            size="small"
                            color={'default'}
                            onClick={(e) => {
                                // stop the event propagation
                                e.stopPropagation();

                                room?.downloadHistory();
                            }}
                        >
                            <DownloadRounded fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Toggle Chat History">
                        <IconButton
                            size="small"
                            color={
                                room.sidebar.isOpen &&
                                room.sidebar.options.type === 'CONTROLS'
                                    ? 'primary'
                                    : 'default'
                            }
                            onClick={() => {
                                // toggle open / closed based on the state
                                if (
                                    room.sidebar.isOpen &&
                                    room.sidebar.options.type === 'CONTROLS'
                                ) {
                                    room.closeSidebar();
                                } else {
                                    room.openSidebar({
                                        type: 'CONTROLS',
                                    });
                                }
                            }}
                        >
                            <TuneRounded fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </Stack>
            <Stack
                flex={1}
                direction={'row'}
                width={'100%'}
                spacing={3}
                overflow={'hidden'}
            >
                <StyledContent
                    direction={'column'}
                    spacing={0}
                    flex={1}
                    alignItems={'center'}
                >
                    <StyledScroll>
                        <Container maxWidth="md">
                            <Stack direction={'column'} spacing={3}>
                                {room.history.map((m, mIdx) => {
                                    return (
                                        <RoomMessageComponent
                                            room={room}
                                            message={m}
                                            key={mIdx}
                                        />
                                    );
                                })}
                            </Stack>
                        </Container>
                    </StyledScroll>
                    <Stack
                        direction={'row'}
                        justifyContent={'center'}
                        width={'100%'}
                    >
                        <RoomInputComponent room={room} />
                    </Stack>
                </StyledContent>
                {room.sidebar.isOpen && (
                    <Resizable
                        defaultSize={{
                            width:
                                room.sidebar.options.type === 'APP' ? 600 : 360,
                            height: '100%',
                        }}
                        minWidth={280}
                        handleStyles={{
                            top: { pointerEvents: 'none' },
                            right: { pointerEvents: 'none' },
                            bottom: { pointerEvents: 'none' },
                            topRight: { pointerEvents: 'none' },
                            bottomRight: { pointerEvents: 'none' },
                            bottomLeft: { pointerEvents: 'none' },
                            topLeft: { pointerEvents: 'none' },
                        }}
                        style={{
                            // paddingTop: '8px',
                            paddingRight: '8px',
                            paddingBottom: '8px',
                        }}
                    >
                        {room.sidebar.options.type === 'CONTROLS' && (
                            <RoomControlsComponent room={room} />
                        )}
                        {room.sidebar.options.type === 'APP' && (
                            <RoomAppComponent room={room} />
                        )}
                    </Resizable>
                )}
            </Stack>
        </StyledPage>
    );
});
