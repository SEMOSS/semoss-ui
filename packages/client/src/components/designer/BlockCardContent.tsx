import { Stack, styled, Typography } from '@semoss/ui';
import * as BLOCK_IMAGES from '@/assets/img/block';

export interface BlockCardContentProps {
    name?: string;
    image?: string;
}

export const blockCardWidth = '133px';

const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
    userSelect: 'none',
}));

export const BlockCardContent = (props: BlockCardContentProps) => {
    const { name = '', image } = props;

    return (
        <Stack
            marginX={1}
            marginY={1.5}
            width={blockCardWidth}
            height="106px"
            alignItems="center"
            justifyContent="center"
        >
            {image && BLOCK_IMAGES[image] ? (
                <img
                    draggable={false}
                    src={BLOCK_IMAGES[image]}
                    width="100%"
                    height="100%"
                />
            ) : (
                <StyledTypography
                    variant="body2"
                    fontWeight="medium"
                    align="center"
                >
                    {name}
                </StyledTypography>
            )}
        </Stack>
    );
};
