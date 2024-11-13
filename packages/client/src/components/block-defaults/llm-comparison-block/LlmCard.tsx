import {
    styled,
    Card,
    Stack,
    Typography,
    IconButton,
    Tooltip,
} from '@semoss/ui';
import { TypeLlmConfig } from '../../workspace/workspace.types';
import { Edit } from '@mui/icons-material';
import { getEngineImage } from '@/utility';
import { useLLMComparison } from '@/hooks';
import ImageSkeleton from '@/assets/img/ImageSkeleton.png';
import { observer } from 'mobx-react-lite';

const StyledCard = styled(Card)(({ theme }) => ({
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

export interface LlmCardProps {
    // Either specified already or not specified yet - llm that is mapped to variable
    llm: TypeLlmConfig;

    // Name of the model's parent variant being edited
    variantName: string;

    // Used to show/hide card's actions by noting if the parent variant is hovered/focused
    isVariantHovered: boolean;
}

export const LlmCard = observer((props: LlmCardProps) => {
    const { llm, variantName, isVariantHovered } = props;
    const { setValue, getValues } = useLLMComparison();

    const {
        database_name,
        database_subtype,
        database_type,
        value,
        topP,
        temperature,
        length,
    } = llm;

    const handleOpenLlmEditor = () => {
        const variants = getValues('variants');
        setValue('editorVariantName', variantName);
        setValue('editorVariant', variants[variantName]);
        setValue('designerView', 'variantEdit');
    };

    return (
        <>
            <StyledCard>
                <StyledCardHeader>
                    <Stack direction={'row'} gap={2} alignItems="center">
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
                        <StyledTypography variant="body1">
                            {database_name || 'Model'}
                        </StyledTypography>
                    </Stack>
                    {isVariantHovered && (
                        <Tooltip title={`Swap ${value}`}>
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
});
