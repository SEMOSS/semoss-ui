import { observer } from 'mobx-react-lite';
import { styled, Stack, Typography } from '@/component-library';
import { BlockAvatar } from './BlockAvatar';

const StyledStack = styled(Stack)(() => ({
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledTypography = styled(Typography)(() => ({
    textTransform: 'capitalize',
}));

export const BlocksMenuCardContent = observer(
    (props: { icon: any; widget: string }) => {
        const blockDisplay = props.widget.replaceAll('-', ' ');

        return (
            <StyledStack direction="column" padding={1} spacing={1}>
                <BlockAvatar icon={props.icon} />
                <StyledTypography variant="subtitle2">
                    {blockDisplay}
                </StyledTypography>
            </StyledStack>
        );
    },
);
