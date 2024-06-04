import { useEffect, useState } from 'react';
import {
    styled,
    Button,
    Card,
    Stack,
    Typography,
    Icon,
    IconButton,
    Tooltip,
    Modal,
    TextField,
    Select,
    Slider,
} from '@semoss/ui';
import { TypeLlmConfig } from '../workspace.types';
import { AddRounded, Delete, Edit } from '@mui/icons-material';
import { getEngineImage } from '@/utility';
import { useLLMComparison } from '@/hooks';
import { Controller, useForm } from 'react-hook-form';
import { VariantModelModal } from './';

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'disableHover',
})<{ disableHover?: boolean }>(({ theme, disableHover }) => ({
    width: '362px',
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
}));

const StyledCardHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    alignSelf: 'stretch',
}));

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    ':last-child': {
        paddingBottom: 0,
    },
}));

const StyledCardImg = styled(Card.Media)(({ theme }) => ({
    width: '36px',
    height: '36px',
    borderRadius: theme.shape.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
}));

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
}
export const LLMSwapCard = (props: LLMSwapCardProps) => {
    const { variantIndex, modelIndex } = props;
    const { defaultVariant, swapVariantModel } = useLLMComparison();
    const [modelModal, setModelModal] = useState(false);
    const variableToMapTo = defaultVariant[modelIndex];

    return (
        <>
            <StyledCard
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
