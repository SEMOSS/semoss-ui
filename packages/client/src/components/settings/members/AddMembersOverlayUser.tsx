import { styled, Avatar, Typography, Stack } from '@semoss/ui';

const StyledUser = styled(Stack)(({ theme }) => ({
    paddingTop: theme.spacing(1),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
}));

const StyledAvatar = styled(Avatar)({
    height: '32px',
    width: '32px',
});

// TODO:Refactor when Typography coloris updated
const StyledPrimaryText = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

const StyledSecondaryText = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

interface AddMembersOverlayUserProps {
    /**
     * Name of the user
     */
    name: string;

    /**
     * Name of the user
     */
    username: string;

    /**
     * Email of the user
     */
    email: string;

    /**
     * Type of the user
     */
    type: string;

    /**
     * Optional action to render
     */
    action?: React.ReactNode;
}

/**
 * @name extractInitials
 *
 * Extract a initials for a string
 *
 * @param str
 */
const extractInitials = (str: string): string => {
    if (str.length < 1) {
        return '';
    }

    return str.split(' ').reduce((prev, curr) => {
        return prev + (curr[0] || '');
    }, '');
};

export const AddMembersOverlayUser = (props: AddMembersOverlayUserProps) => {
    const { name, username, email, type, action } = props;

    const initials = extractInitials(name);

    return (
        <StyledUser direction="row" alignItems={'center'} spacing={1}>
            <StyledAvatar variant="circular">{initials}</StyledAvatar>
            <Stack direction={'column'} spacing={0} flex={1}>
                <StyledPrimaryText variant="body1" noWrap={true}>
                    {name || <>&nbsp;</>}
                </StyledPrimaryText>
                <Stack
                    flex={1}
                    direction={'row'}
                    alignItems={'center'}
                    spacing={2}
                >
                    <Stack
                        flex={1}
                        direction={'row'}
                        alignItems={'center'}
                        spacing={1}
                    >
                        <StyledSecondaryText variant="body2" noWrap={true}>
                            User ID:
                        </StyledSecondaryText>
                        <StyledPrimaryText variant="body2" noWrap={true}>
                            {username || <>&nbsp;</>}
                        </StyledPrimaryText>
                    </Stack>
                    <Stack
                        flex={1}
                        direction={'row'}
                        alignItems={'center'}
                        spacing={1}
                    >
                        <StyledSecondaryText variant="body2" noWrap={true}>
                            Email:
                        </StyledSecondaryText>
                        <StyledPrimaryText variant="body2" noWrap={true}>
                            {email || <>&nbsp;</>}
                        </StyledPrimaryText>
                    </Stack>
                    <Stack
                        flex={1}
                        direction={'row'}
                        alignItems={'center'}
                        spacing={1}
                    >
                        <StyledSecondaryText variant="body2" noWrap={true}>
                            Type:
                        </StyledSecondaryText>
                        <StyledPrimaryText variant="body2" noWrap={true}>
                            {type || <>&nbsp;</>}
                        </StyledPrimaryText>
                    </Stack>
                </Stack>
            </Stack>
            {action}
        </StyledUser>
    );
};
