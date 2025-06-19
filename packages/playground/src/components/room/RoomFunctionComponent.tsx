import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { styled, Button, Stack, TextField, Typography } from '@mui/material';
import { ChatRoom } from '@/stores';
import { RightMenu, useNotification } from '@/components';
import { MessageFunctionResponse } from '@/types';

const StyledInner = styled(Stack)(({ theme }) => ({
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    background: theme.palette.background.paper,
    padding: theme.spacing(2),
}));

interface RoomFunctionComponentProps {
    /** Room to render */
    room: ChatRoom;
}

export const RoomFunctionComponent: React.FC<RoomFunctionComponentProps> =
    observer((props) => {
        // set the get the room based on the params
        const { room } = props;

        const notifcation = useNotification();

        // TODO: clean-up
        const response: MessageFunctionResponse | null =
            room.sidebar.options.type === 'FUNCTION'
                ? room.sidebar.options.response
                : null;

        const [parameters, setParameters] = useState(response.parameters);

        return (
            <RightMenu
                mode={'fluid'}
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
                <StyledInner direction={'column'} spacing={2}>
                    {parameters.map((param, pIdx) => {
                        return (
                            <TextField
                                key={pIdx}
                                label={param.name}
                                variant="outlined"
                                fullWidth
                                value={param.value}
                                onChange={(e) => {
                                    const updated = [...parameters];

                                    updated[pIdx].value = e.target.value;

                                    setParameters(updated);
                                }}
                            />
                        );
                    })}
                    <Stack direction={'row'} alignItems={'flex-end'}>
                        <Button
                            variant={'contained'}
                            onClick={async () => {
                                try {
                                    await room.processToolResponse(
                                        response,
                                        parameters,
                                    );
                                } catch (e) {
                                    notifcation.add({
                                        color: 'error',
                                        message: 'Error running Function',
                                    });
                                }
                            }}
                        >
                            Run
                        </Button>
                    </Stack>
                </StyledInner>
            </RightMenu>
        );
    });
