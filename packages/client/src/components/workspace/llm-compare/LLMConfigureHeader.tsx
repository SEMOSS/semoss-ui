import {
    styled,
    Container,
    Typography,
    Link,
    Grid,
    Card,
    Stack,
} from '@semoss/ui';

const StyledSectionHeader = styled(Typography)(({ theme }) => ({
    paddingBottom: theme.spacing(3),
}));

const StyledList = styled('ul')(({ theme }) => ({
    marginBottom: 0,
}));

export const LLMConfigureHeader = () => {
    return (
        <div>
            <StyledSectionHeader variant="h6">Configure</StyledSectionHeader>
            <Typography variant="body1">
                Select the models you want to evaluate and compare
                simultaneously to define the most suitable model for your
                application.
                <StyledList>
                    <li>
                        Different models can deliver different responses to the
                        same prompt
                    </li>
                    <li>
                        Easily discern the strength and weaknesses of each model
                    </li>
                    <li>
                        If you do not see a particular model, please browse and
                        request access from the{' '}
                        <Link href="#/engine/model" rel="noopener noreferrer">
                            Model Catalog Page
                        </Link>
                    </li>
                </StyledList>
            </Typography>
        </div>
    );
};
