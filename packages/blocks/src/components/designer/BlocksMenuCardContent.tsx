import { observer } from 'mobx-react-lite';
import { styled, Avatar, Stack, Typography } from '@semoss/ui';

const StyledAvatar = styled(Avatar)(({ theme }) => ({
    backgroundColor: `${theme.palette.primary.light}33`,
    border: `1px solid ${theme.palette.primary.main}`,
    color: theme.palette.primary.main
}));

const StyledStack = styled(Stack)(() => ({
    alignItems: 'center',
    justifyContent: 'center'
}));

const StyledTypography = styled(Typography)(() => ({
    textTransform: "capitalize"
}));


export const BlocksMenuCardContent = observer((props: {
    icon: any;
    widget: string;
}) => {
    const blockDisplay = props.widget.replaceAll('-', ' ');

    return (
        <StyledStack direction="column" padding={1} spacing={1}>
            <StyledAvatar variant="rounded">
                <props.icon/>
            </StyledAvatar>
            <StyledTypography variant="subtitle2">
                {blockDisplay}
            </StyledTypography>
        </StyledStack>
    );
});
