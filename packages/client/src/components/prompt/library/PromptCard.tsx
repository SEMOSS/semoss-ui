import { styled, Card } from '@semoss/ui';

const StyledCard = styled(Card)(() => ({
    height: '100%',
    cursor: 'pointer',
}));

export function PromptCard(props: {
    description: string;
    context: string;
    openUIBuilderForTemplate: () => void;
}) {
    return (
        <StyledCard
            sx={{ height: '100%' }}
            onClick={props.openUIBuilderForTemplate}
        >
            <Card.Header title={props.description} />
            <Card.Content>{props.context}</Card.Content>
        </StyledCard>
    );
}
