import { styled, Avatar } from '@semoss/ui';

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    backgroundColor: `${theme.palette.primary.light}33`,
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main,
}));

export const BlockAvatar = (props: { icon: any; xs?: boolean }) => {
    return (
        <StyledAvatar variant="rounded">
            <props.icon />
        </StyledAvatar>
    );
};
