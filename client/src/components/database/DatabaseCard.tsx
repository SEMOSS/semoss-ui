import { styled, Pill, Icon } from '@semoss/components';

import { theme } from '@/theme';
import { Card, Image } from '@/components/ui';

const StyledCard = styled(Card, {});

const StyledCardTitle = styled('h4', {
    lineHeight: theme.lineHeights.default,
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    marginBottom: theme.space['2'],
    overflow: 'hidden',
    display: '-webkit-box',
    height: `calc(2 * ${theme.lineHeights.default}  * ${theme.fontSizes.lg})`,
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': 2,
});

const StyledCardDescription = styled('div', {
    lineHeight: theme.lineHeights.default,
    fontSize: theme.fontSizes.sm,
    overflow: 'hidden',
    display: '-webkit-box',
    height: `calc(3 * ${theme.lineHeights.default}  * ${theme.fontSizes.sm})`,
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': 3,
});

const StyledSection = styled('section', {
    borderBottomWidth: theme.borderWidths.default,
    borderBottomColor: theme.colors['grey-4'],
    paddingBottom: theme.space[4],
    marginBottom: theme.space[2],
    '&:last-child': {
        borderBottom: 'none',
        marginBottom: 0,
    },
    display: 'flex',
});

const StyledSectionTitle = styled('div', {
    color: theme.colors['grey-2'],
    fontSize: theme.fontSizes.md,
    fontWeight: theme.fontWeights.semibold,
    textTransform: 'uppercase',
    marginBottom: theme.space['4'],
});

const StyledPillContainer = styled('div', {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.space['2'],
});
const StyledCardImage = styled(Image, {
    width: '100%',
});

interface DatabaseCardProps {
    /** Name of the Database */
    name: string;

    /** Description of the Database */
    description: string;

    /** Image of the Database */
    image: string;
    /** Tag of the Database */
    tag?: string;
    /** Whether or not the database is viewable by everyone */
    global?: boolean;
}

export const DatabaseCard = (props: DatabaseCardProps) => {
    const { name, description, image, tag, global } = props;
    return (
        <StyledCard>
            <Card.Content stretch={true}>
                <StyledCardImage src={image} />
            </Card.Content>
            <Card.Content>
                <StyledCardTitle>{name}</StyledCardTitle>
                <StyledCardDescription>
                    {description}

                    {tag ? (
                        <StyledSection>
                            <StyledSectionTitle>Tags:</StyledSectionTitle>
                            &nbsp;&nbsp;
                            <StyledPillContainer>
                                <Pill
                                    key={tag}
                                    closeable={false}
                                    color={'primary'}
                                >
                                    {tag}
                                </Pill>
                            </StyledPillContainer>
                        </StyledSection>
                    ) : null}
                    {!global ? (
                        <Icon
                            path={
                                'M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z'
                            }
                        ></Icon>
                    ) : null}
                </StyledCardDescription>
            </Card.Content>
            <Card.Footer>Footer</Card.Footer>
        </StyledCard>
    );
};
