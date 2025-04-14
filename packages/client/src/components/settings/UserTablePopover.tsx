import {
    styled,
    Avatar,
    Grid,
    IconButton,
    Popover,
    Typography,
    useNotification,
} from '@semoss/ui';
import CopyAllIcon from '@mui/icons-material/CopyAll';

interface UserTablePopoverProps {
    hoveredUser: { id: string; name: string; email: string } | null;
    isPopoverOpen: boolean;
    anchorEl: HTMLElement | null;
    handlePopoverClose: () => void;
}

const AvatarWrapper = styled('div')({
    display: 'inline-block',
    width: '50px',
});
export const UserTablePopover = (props: UserTablePopoverProps) => {
    const { hoveredUser, isPopoverOpen, anchorEl, handlePopoverClose } = props;
    const notification = useNotification();
    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        notification.add({
            color: 'success',
            message: 'Copied to clipboard',
        });
    };
    return (
        <Popover
            id={hoveredUser?.id}
            open={isPopoverOpen}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
        >
            <Grid container direction="row" spacing={1} padding={2}>
                {/* avatar icon */}
                <Grid item>
                    <AvatarWrapper>
                        <Avatar>
                            {hoveredUser?.name[0].toUpperCase()}
                        </Avatar>
                    </AvatarWrapper>
                </Grid>
                <Grid item>
                    {hoveredUser && (
                        <>
                            <Typography variant="body2">
                                {hoveredUser?.name}
                            </Typography>
                            <Grid container direction="row" spacing={1} alignItems="center">
                                <Grid item>
                                    <Typography variant="caption" color="secondary">
                                        ID: {hoveredUser?.id}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <IconButton size="small"
                                        onClick={() => { handleCopy(hoveredUser?.id) }}
                                    >
                                        <CopyAllIcon fontSize="inherit" />
                                    </IconButton>
                                </Grid>
                            </Grid>
                            <Grid container direction="row" spacing={1} alignItems="center">
                                <Grid item>
                                    <Typography variant="caption" color="secondary">
                                        Email: {hoveredUser?.email}
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <IconButton size="small"
                                        onClick={() => { handleCopy(hoveredUser?.email) }}
                                    >
                                        <CopyAllIcon fontSize="inherit" />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </>
                    )}
                </Grid>
            </Grid>
        </Popover>
    );
};

