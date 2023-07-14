import { Link, useLocation, matchPath } from 'react-router-dom';

import { styled } from '@semoss/components';

import { Moose } from '@/components/moose';
import { theme } from '@/theme';

const StyledContent = styled('div', {
    padding: theme.space['8'],
});

const StyledTitle = styled('h1', {
    fontSize: theme.fontSizes.xl,
});

const StyledContainer = styled('div', {
    display: 'inline-block',
    padding: theme.space['8'],
    backgroundColor: theme.colors['grey-5'],
});

const StyledLink = styled(Link, {
    display: 'block',
    color: theme.colors['primary-1'],
    marginBottom: theme.space['1'],
    '&:hover': {
        textDecoration: 'underline',
    },
    variants: {
        active: {
            true: {
                textDecoration: 'underline',
            },
            false: {},
        },
    },
});

const FixedAssistant = styled('div', {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
});

interface TempPageProps {
    /** Title of the temporary page */
    title: string;
}

/**
 * Temporary Page
 */
export const TempPage = ({ title }: TempPageProps): JSX.Element => {
    const { pathname } = useLocation();

    /**
     * Check if a path is active
     * @param path - path to check against
     * @returns true if the path is active
     */
    const isActive = (path: string) => {
        return !!matchPath(path, pathname);
    };

    return (
        <StyledContent>
            <StyledTitle>{title}</StyledTitle>

            <StyledContainer>
                <StyledLink to="/" active={isActive('/')}>
                    Home
                </StyledLink>

                <StyledContainer>
                    <StyledContainer>
                        <StyledLink
                            to="/edit/1/pipeline"
                            active={isActive('/edit/pipeline')}
                        >
                            Insight 1 Pipeline
                        </StyledLink>
                    </StyledContainer>
                </StyledContainer>

                <StyledLink to="/catalog" active={isActive('/catalog')}>
                    Catalog
                </StyledLink>
                <StyledContainer>
                    <StyledLink
                        to="/database/1"
                        active={isActive('/database/1')}
                    >
                        Database 1
                    </StyledLink>
                </StyledContainer>

                <StyledLink to="/settings" active={isActive('/settings')}>
                    Settings
                </StyledLink>
            </StyledContainer>
            <FixedAssistant>
                <Moose
                    options={[
                        {
                            model: 'text2sql',
                            callback: (answers) =>
                                console.log("Here's your sql", answers),
                        },
                        {
                            model: 'docqa',
                            filePath: 'qa5pdf',
                            modelType: 'siamese',
                            project: '7f99f6e8-cebf-445f-b04a-004ea306df84',
                            callback: (answers) =>
                                console.log('highlighting on pdf', answers),
                        },
                        {
                            model: 'fillform',
                            form_fields: ['Gender', 'Age', 'Frame', 'Health'],
                            callback: (answers) =>
                                console.log(
                                    'fill your form with these answers',
                                    answers,
                                ),
                        },
                    ]}
                    value={'fillform'}
                />
            </FixedAssistant>
        </StyledContent>
    );
};
