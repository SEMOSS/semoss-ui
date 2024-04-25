import { styled, Card, Stack, Typography, IconButton } from '@semoss/ui';
import { TypeLlmConfig } from './workspace.types';
import { Delete, Edit } from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme }) => ({
    width: '362px',
}));

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
}));

interface LlmCardProps {
    llm: TypeLlmConfig;
    isSelected: boolean;
}

export const LlmCard = (props: LlmCardProps) => {
    const { llm, isSelected } = props;
    const { name, topP, temperature, length } = llm;

    return (
        <StyledCard>
            <Card.Header
                title={
                    <StyledCardContent>
                        <Stack direction="row" spacing={1}>
                            <div>Icon</div>
                            <div>{name}</div>
                        </Stack>

                        {isSelected && (
                            <Stack direction="row" spacing={1}>
                                <IconButton>
                                    <Edit />
                                </IconButton>
                                <IconButton>
                                    <Delete />
                                </IconButton>
                            </Stack>
                        )}
                    </StyledCardContent>
                }
            />

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
    );
};
