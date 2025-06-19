import { observer } from 'mobx-react-lite';
import { useInsight } from '@semoss/sdk/react';
import {
    styled,
    Stack,
    Typography,
    Backdrop,
    CircularProgress,
} from '@mui/material';
import { ChatRoom } from '@/stores';
import { RightMenu } from '@/components/common';
import { usePixel } from '@/hooks';

const ENDPOINT = process.env.ENDPOINT;
const MODULE = process.env.MODULE;

const StyledBackdrop = styled(Backdrop)(({ theme }) => ({
    position: 'absolute',
    zIndex: theme.zIndex.drawer + 1,
    color: theme.palette.primary.contrastText,
}));

interface RoomVectorFileComponentProps {
    /** Room to view the messages for */
    room: ChatRoom;
}

export const RoomVectorFileComponent: React.FC<RoomVectorFileComponentProps> =
    observer((props) => {
        const { room } = props;

        const { insightId } = useInsight();

        let name = '';
        if (
            room.sidebar.options.type === 'VECTOR_FILE' &&
            room.sidebar.options.name
        ) {
            name = room.sidebar.options.name;
        }

        let engine = '';
        if (
            room.sidebar.options.type === 'VECTOR_FILE' &&
            room.sidebar.options.engine
        ) {
            engine = room.sidebar.options.engine;
        }

        const getFile = usePixel<string>(
            `VectorFileDownload(fileNames=["${name}"], engine=["${engine}"]);`,
            {
                data: '',
            },
        );

        return (
            <RightMenu
                mode="fixed"
                onClose={() => room.closeSidebar()}
                header={
                    <Typography
                        variant={'body1'}
                        fontWeight={'bold'}
                        flex={1}
                        noWrap={true}
                    >
                        {name}
                    </Typography>
                }
            >
                <StyledBackdrop open={getFile.status === 'LOADING'}>
                    <CircularProgress color="inherit" />
                </StyledBackdrop>
                {getFile.status === 'ERROR' && (
                    <Stack
                        height={'100%'}
                        width={'100%'}
                        alignItems={'center'}
                        justifyContent={'center'}
                    >
                        <Typography variant="caption">
                            Error: {getFile.error.message}
                        </Typography>
                    </Stack>
                )}
                {getFile.status === 'SUCCESS' && (
                    <iframe
                        src={`${ENDPOINT}${MODULE}/api//api/engine/downloadFile?insightId=${insightId}=${getFile.data}`}
                        style={{
                            border: 'none',
                            width: '100%',
                            height: '100%',
                        }}
                    />
                )}
            </RightMenu>
        );
    });
