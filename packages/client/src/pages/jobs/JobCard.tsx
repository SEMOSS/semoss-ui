import { Avatar, Box, Stack, Typography, styled } from "@semoss/ui";
import { ReactElement } from "react";

const StyledBox = styled(Box)(({ theme }) => ({
    borderRadius: theme.spacing(1),
    border: `2px ${theme.palette.divider} solid`,
    padding: theme.spacing(2)
}));
const StyledAvatar = styled(Avatar, {
    shouldForwardProp: (prop) => prop !== 'avatarColor'
})<{avatarColor: string, iconColor: string}>(({ theme, avatarColor, iconColor }) => ({
    borderRadius: theme.spacing(0.5),
    backgroundColor: avatarColor,
    'svg': {
        fill: iconColor
    }
}));

export const JobCard = (props: {
    title: string;
    icon: ReactElement;
    count: number;
    iconColor: string;
    avatarColor: string;
}) => {
    const { title, icon, count, iconColor, avatarColor } = props;

    return (
        <StyledBox>
            <Stack direction="row" spacing={2} alignItems="center">
                <StyledAvatar avatarColor={avatarColor} iconColor={iconColor}>
                    {icon}
                </StyledAvatar>
                <Stack spacing={1} justifyContent="start" alignItems="center">
                    <Typography variant="body1">
                        {title}
                    </Typography>
                    <Typography variant="caption">
                        {count}
                    </Typography>
                </Stack>
            </Stack>
        </StyledBox>
    )
};