import { styled, Card, Grid, Typography } from '@semoss/ui';
import { TypeLlmConfig } from './workspace.types';

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
            <Card.Header title={name} />

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
