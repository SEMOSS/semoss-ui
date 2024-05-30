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
import { VariantModelModal } from './VariableModelModal';

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

interface LlmCardProps {
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
     * Is this a default llm in our app, if so don't allow edit for now
     */
    isDefault: boolean;
}

export const LlmCard = (props: LlmCardProps) => {
    const { llm, variantIndex, modelIndex, isDefault } = props;
    const { swapVariantModel } = useLLMComparison();
    const [modelModal, setModelModal] = useState(false);

    const {
        alias,
        database_name,
        database_subtype,
        database_type,
        value,
        topP = '-',
        temperature = '-',
        length = '-',
    } = llm;

    return (
        <>
            <StyledCard>
                <StyledCardHeader>
                    <Stack direction={'row'} gap={2}>
                        <StyledCardImg
                            src="img"
                            image={getEngineImage(
                                database_type,
                                database_subtype,
                            )}
                        />
                        <Stack direction="column">
                            <Typography variant={'caption'}>{alias}</Typography>
                            <StyledTypography variant={'body1'}>
                                {database_name}
                            </StyledTypography>
                        </Stack>
                    </Stack>
                    {!isDefault && (
                        <Stack direction="row">
                            <Tooltip title={value}>
                                <IconButton
                                    onClick={() => {
                                        setModelModal(true);
                                    }}
                                >
                                    <Edit />
                                </IconButton>
                            </Tooltip>
                            <IconButton disabled={true}>
                                <Delete />
                            </IconButton>
                        </Stack>
                    )}
                </StyledCardHeader>
                <StyledCardContent>
                    <div>
                        <Typography variant="body1">Top P</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {topP}
                        </Typography>
                    </div>
                    <div>
                        <Typography variant="body1">Temperature</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {temperature}
                        </Typography>
                    </div>
                    <div>
                        <Typography variant="body1">Length</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {length}
                        </Typography>
                    </div>
                </StyledCardContent>
            </StyledCard>
            <VariantModelModal
                open={modelModal}
                variable={llm}
                onClose={(model) => {
                    if (model) {
                        swapVariantModel(variantIndex, modelIndex, {
                            ...model,
                            alias: llm.alias,
                        });
                    }
                    setModelModal(false);
                }}
            />
        </>
    );
};
