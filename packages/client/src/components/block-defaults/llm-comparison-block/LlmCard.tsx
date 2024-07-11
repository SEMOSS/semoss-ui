import { useState } from 'react';
import {
    styled,
    Card,
    Stack,
    Typography,
    IconButton,
    Tooltip,
} from '@semoss/ui';
import { TypeLlmConfig } from '../../workspace/workspace.types';
import { Delete, Edit } from '@mui/icons-material';
import { getEngineImage } from '@/utility';
import { useLLMComparison } from '@/hooks';
import ImageSkeleton from '@/assets/img/ImageSkeleton.png';

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

export interface LlmCardProps {
    /**
     * Either specified already or not specified yet - llm that is mapped to variable
     */
    llm: TypeLlmConfig;
    /**
     * Index of the Variant we are Editting/Viewing
     */
    variantIndex: number;
    /**
     * This is the index of the model within its own variant
     */
    modelIndex: number;
    /**
     * Is this LLM a part of the default variant in our app, if so don't allow edit for now
     */
    isDefault: boolean;

    /**
     * Sets the width of the Card
     */
    size?: 'small' | 'medium';
}

export const LlmCard = (props: LlmCardProps) => {
    const { llm, variantIndex, modelIndex, isDefault, size = 'medium' } = props;
    const { setDesignerView, setEditorModel } = useLLMComparison();

    const {
        alias,
        database_name,
        database_subtype,
        database_type,
        value,
        topP,
        temperature,
        length,
    } = llm;

    const handleOpenLlmEditor = () => {
        setEditorModel(variantIndex, modelIndex);
        setDesignerView('modelEdit');
    };

    return (
        <>
            <StyledCard size={size}>
                <StyledCardHeader>
                    <Stack direction={'row'} gap={2}>
                        <StyledCardImg
                            src="img"
                            image={
                                database_type
                                    ? getEngineImage(
                                          database_type,
                                          database_subtype,
                                      )
                                    : ImageSkeleton
                            }
                        />
                        <Stack direction="column">
                            <Typography variant={'caption'}>
                                {alias || 'Undefined Variable'}
                            </Typography>
                            <StyledTypography variant={'body1'}>
                                {database_name || 'Model'}
                            </StyledTypography>
                        </Stack>
                    </Stack>
                    {!isDefault && (
                        <Tooltip title={value}>
                            <IconButton onClick={handleOpenLlmEditor}>
                                <Edit />
                            </IconButton>
                        </Tooltip>
                    )}
                </StyledCardHeader>
                <StyledCardContent>
                    <div>
                        <Typography variant="body1">Top P</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {topP || '--'}
                        </Typography>
                    </div>
                    <div>
                        <Typography variant="body1">Temperature</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {temperature || '--'}
                        </Typography>
                    </div>
                    <div>
                        <Typography variant="body1">Length</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {length || '--'}
                        </Typography>
                    </div>
                </StyledCardContent>
            </StyledCard>
        </>
    );
};
