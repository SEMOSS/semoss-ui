import { useState } from 'react';
import { styled, Card, Stack, Typography, Icon } from '@semoss/ui';
import { AddRounded } from '@mui/icons-material';
import { useLLMComparison } from '@/hooks';
import { VariantModelModal } from './VariantModelModal';

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'disableHover' && prop !== 'size',
})<{ disableHover?: boolean; size: string }>(
    ({ theme, disableHover, size }) => ({
        padding: theme.spacing(2),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '16px',

        ...(size === 'small' && {
            width: '288px',
        }),

        ...(size === 'medium' && {
            width: '362px',
        }),
    }),
);

const StyledTypography = styled(Typography)(({ theme }) => ({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontHeight: '500',
    lineHeight: '150%',
    letterSpacing: '0.15px',
}));

// -----------------------------------
// SWAP CARD STYLES ------------------
// -----------------------------------
const StyledSwapIconBubble = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '36px',
    height: '36px',
    padding: '8px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    flexShrink: '0',
    borderRadius: '100px',
    background: '#EBF4FE',
}));

const StyledSwapCardHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(2),
    alignSelf: 'stretch',
}));
interface LLMSwapCardProps {
    /**
     * Index of the Variant we are Editting/Viewing
     */
    variantIndex: number;
    /**
     * This is the index of the model within its own variant
     */
    modelIndex: number;

    /**
     * Sets the width of the Card
     */
    size?: 'small' | 'medium';
}
export const LLMSwapCard = (props: LLMSwapCardProps) => {
    const { variantIndex, modelIndex, size = 'medium' } = props;
    const { defaultVariant, swapVariantModel } = useLLMComparison();
    const [modelModal, setModelModal] = useState(false);
    const variableToMapTo = defaultVariant[modelIndex];

    return (
        <>
            <StyledCard
                size={size}
                onClick={() => {
                    setModelModal(true);
                }}
            >
                <StyledSwapCardHeader>
                    <Stack
                        direction="column"
                        justifyContent={'center'}
                        alignItems={'center'}
                    >
                        <StyledSwapIconBubble>
                            <Icon color={'primary'}>
                                <AddRounded />
                            </Icon>
                        </StyledSwapIconBubble>
                        <Typography variant={'body2'} color={'primary'}>
                            Swap Model
                        </Typography>
                        <StyledTypography variant={'caption'}>
                            {variableToMapTo.alias}
                        </StyledTypography>
                    </Stack>
                </StyledSwapCardHeader>
            </StyledCard>
            <VariantModelModal
                open={modelModal}
                variable={{
                    alias: variableToMapTo.alias,
                    value: '',
                    database_name: '',
                    database_subtype: '',
                    database_type: '',
                }}
                onClose={(model) => {
                    if (model) {
                        swapVariantModel(variantIndex, modelIndex, {
                            ...model,
                            alias: variableToMapTo.alias,
                        });
                    }
                    setModelModal(false);
                }}
            />
        </>
    );
};
