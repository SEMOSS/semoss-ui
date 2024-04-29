import { styled, Card, Stack, Typography, IconButton } from '@semoss/ui';
import { TypeLlmConfig } from '../workspace.types';
import { Delete, Edit } from '@mui/icons-material';

const StyledCard = styled(Card, {
    shouldForwardProp: (prop) => prop !== 'disableHover',
})<{ disableHover?: boolean }>(({ theme, disableHover }) => ({
    width: '362px',
}));

const StyledCardHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
}));

const StyledCardContent = styled(Card.Content)(({ theme }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    ':last-child': {
        paddingBottom: 0,
    },
}));

interface LlmCardProps {
    llm: TypeLlmConfig;
    isSelected: boolean;
}

export const LlmCard = (props: LlmCardProps) => {
    const { llm, isSelected } = props;
    const { name, topP, temperature, length } = llm;

    return (
        <StyledCard disableHover={!isSelected}>
            <Card.Header
                title={
                    <StyledCardHeader>
                        <Stack direction="row">
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
                    </StyledCardHeader>
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
