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

interface UserPopoverProps {
    hoveredUser: { id: string; name: string; email: string } | null;
    isPopoverOpen: boolean;
    anchorEl: HTMLElement | null;
    handlePopoverClose: () => void;
}

const AvatarWrapper = styled('div')({
    display: 'inline-block',
    width: '50px',
});
const StyledGridContainer = styled(Grid)({
    padding: 16,
    spacing: 1,
});
const StyledInnerGridContainer = styled(Grid)({
    spacing: 1,
    alignItems: 'center',
});
const StyledIconButton = styled(IconButton)({
    size: 'small',
});
export const UserPopover = (props: UserPopoverProps) => {
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
        <div onMouseLeave={handlePopoverClose}>
            <Popover
                id={hoveredUser?.id}
                open={isPopoverOpen}
                anchorEl={anchorEl}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                }}
                sx={{ pointerEvents: 'none' }}
            >
                <StyledGridContainer container direction="row" sx={{ pointerEvents: 'auto' }}>
                    {/* avatar icon */}
                    <Grid item>
                        {hoveredUser?.name && ( // prevents seeing default icon
                            <AvatarWrapper>
                                <Avatar>{hoveredUser.name[0].toUpperCase()}</Avatar>
                            </AvatarWrapper>
                        )}
                    </Grid>
                    <Grid item>
                        {hoveredUser && (
                            <>
                                <Typography variant="body2">
                                    {hoveredUser?.name}
                                </Typography>
                                <StyledInnerGridContainer container direction="row">
                                    <Grid item>
                                        <Typography
                                            variant="caption"
                                            color="secondary"
                                        >
                                            ID: {hoveredUser?.id}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <StyledIconButton
                                            size="small"
                                            onClick={() => {
                                                handleCopy(hoveredUser?.id);
                                            }}
                                        >
                                            <CopyAllIcon fontSize="inherit" />
                                        </StyledIconButton>
                                    </Grid>
                                </StyledInnerGridContainer>
                                <StyledInnerGridContainer container direction="row">
                                    <Grid item>
                                        <Typography
                                            variant="caption"
                                            color="secondary"
                                        >
                                            Email: {hoveredUser?.email}
                                        </Typography>
                                    </Grid>
                                    <Grid item>
                                        <StyledIconButton
                                            size="small"
                                            onClick={() => {
                                                handleCopy(hoveredUser?.email);
                                            }}
                                        >
                                            <CopyAllIcon fontSize="inherit" />
                                        </StyledIconButton>
                                    </Grid>
                                </StyledInnerGridContainer>
                            </>
                        )}
                    </Grid>
                </StyledGridContainer>
            </Popover>
        </div>
    );
};
