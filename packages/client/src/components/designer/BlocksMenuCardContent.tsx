import { observer } from 'mobx-react-lite';
import { styled, Stack, Typography } from '@semoss/ui';
import { BlockAvatar } from './BlockAvatar';

const StyledStack = styled(Stack)(() => ({
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledTypography = styled(Typography)(() => ({
    textTransform: 'capitalize',
}));

export const BlocksMenuCardContent = observer(
    (props: { icon: any; display: string }) => {
        return (
            <StyledStack direction="column" padding={1} spacing={1}>
                {props.icon && <BlockAvatar icon={props.icon} />}
                <StyledTypography variant="subtitle2">
                    {props.display}
                </StyledTypography>
            </StyledStack>
        );
    },
);
