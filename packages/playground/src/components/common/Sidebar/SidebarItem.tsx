import React from 'react';
import { observer } from 'mobx-react-lite';
import { styled, List, CircularProgress, Menu, MenuItem } from '@semoss/ui';
import { useNotification } from '@semoss/ui';
import {
    ChatBubbleOutlineOutlined,
    MoreVertOutlined,
} from '@mui/icons-material';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { useChat } from '@/hooks';

const StyledLink = styled(Link)(({ theme }) => ({
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
}));

const StyledListItemButton = styled(List.ItemButton, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected: boolean }>(({ theme, selected }) => ({
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: selected ? theme.palette.secondary.selected : undefined,
})) as unknown as typeof List.ItemButton;

const StyledListItemIcon = styled(List.Icon)(() => ({
    width: '28px',
    minWidth: 'auto',
}));

const StyledChatBubbleOutlineOutlined = styled(ChatBubbleOutlineOutlined)(
    ({ theme }) => ({
        color: theme.palette.text.primary,
    }),
);

const StyledMoreVertOutlined = styled(MoreVertOutlined)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

interface SidebarItemProps {
    /** Id of the room */
    roomId: string;
}

export const SidebarItem = observer((props: SidebarItemProps) => {
    const { roomId } = props;

    const { chat } = useChat();
    const navigate = useNavigate();

    const notification = useNotification();

    const { roomId: activeRoomId } = useParams<{ roomId: string }>();

    // get the room
    const room = chat.getRoom(roomId);

    const [chatMenu, setChatMenu] = React.useState(null);
    const isSettingsMenuOpen = Boolean(chatMenu);

    // set the name of the room
    let name = 'Untitled';
    if (room.metadata && room.metadata.name) {
        name = room.metadata.name;
    }

    return (
        <StyledLink to={`/room/${roomId}`} aria-label={'Select a room'}>
            <StyledListItemButton
                selected={activeRoomId === roomId}
                dense={true}
            >
                <StyledListItemIcon>
                    <StyledChatBubbleOutlineOutlined fontSize="small" />
                </StyledListItemIcon>
                <List.ItemText
                    primary={name}
                    primaryTypographyProps={{
                        variant: 'subtitle2',
                        noWrap: true,
                    }}
                />
                {room.isLoading && (
                    <StyledListItemIcon>
                        <CircularProgress
                            color={'inherit'}
                            size={'20px'}
                        ></CircularProgress>
                    </StyledListItemIcon>
                )}
                <StyledListItemIcon
                    id="settings-control"
                    aria-controls={
                        isSettingsMenuOpen ? 'settings-menu' : undefined
                    }
                    aria-label="settings"
                    aria-expanded={isSettingsMenuOpen ? 'true' : undefined}
                    aria-haspopup="true"
                    onClick={(e) => {
                        setChatMenu(e.currentTarget);
                    }}
                >
                    <StyledMoreVertOutlined />
                </StyledListItemIcon>
                <Menu
                    id="settings-menu"
                    // MenuListProps={{
                    //     'aria-labelledby': 'long-button',
                    // }}
                    anchorEl={chatMenu}
                    open={isSettingsMenuOpen}
                    onClose={() => {
                        setChatMenu(null);
                    }}
                >
                    <MenuItem
                        disabled={!!room}
                        onClick={(e) => {
                            try {
                                // stop the event propagation
                                e.stopPropagation();

                                room.downloadHistory();

                                // close it
                                setChatMenu(null);
                            } catch (e) {
                                notification.add({
                                    color: 'error',
                                    message: e.message,
                                });
                            }
                        }}
                    >
                        Download
                    </MenuItem>
                    <MenuItem
                        onClick={(e) => {
                            try {
                                // stop the event propagation
                                e.stopPropagation();

                                // close it
                                chat.closeRoom(roomId);

                                // close it
                                setChatMenu(null);

                                // navigate to new
                                navigate('new');
                            } catch (e) {
                                notification.add({
                                    color: 'error',
                                    message: e.message,
                                });
                            }
                        }}
                    >
                        Delete
                    </MenuItem>
                </Menu>
            </StyledListItemButton>
        </StyledLink>
    );
});
