import React from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    CircularProgress,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    ChatBubbleOutlineOutlined,
    MoreVertOutlined,
} from '@mui/icons-material';
import { useParams, Link, useNavigate } from 'react-router-dom';

import { useChat } from '@/hooks';
import { useNotification } from '@/components/common';

const StyledListItemButton = styled(ListItemButton, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{ selected: boolean }>(({ theme, selected }) => ({
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: selected ? theme.palette.secondary.selected : undefined,
})) as unknown as typeof ListItemButton;

const StyledListItemIcon = styled(ListItemIcon)(() => ({
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
    let name = '';
    if (room.metadata && room.metadata.name) {
        name = room.metadata.name;
    }

    if (!name) {
        for (const m of room.history) {
            if (m.question) {
                name = m.question;
                break;
            }
        }
    }

    return (
        <StyledListItemButton
            component={Link}
            to={`/room/${roomId}`}
            selected={activeRoomId === roomId}
            aria-label={'Select a room'}
            dense={true}
        >
            <StyledListItemIcon>
                <StyledChatBubbleOutlineOutlined fontSize="small" />
            </StyledListItemIcon>
            <ListItemText
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
                aria-controls={isSettingsMenuOpen ? 'settings-menu' : undefined}
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
                MenuListProps={{
                    'aria-labelledby': 'long-button',
                }}
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
    );
});
