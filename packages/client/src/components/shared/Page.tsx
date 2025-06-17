import { Container, styled } from '@semoss/ui';

import { TopNav } from './TopNav';
import { SideNav } from './SideNav';
import { PlatformMessages } from './PlatformMessages';
import { observer } from 'mobx-react-lite';
import { usePage } from '@/hooks';

const StyledPage = styled('div')(() => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
    flex: 1,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
    paddingTop: theme.spacing(7), // nav height
}));

const StyledInner = styled('div')(() => ({
    position: 'relative',
    height: '100%',
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
}));

const StyledContainer = styled('div', {
    shouldForwardProp: (prop) => prop !== 'fullWidth',
})<{
    /** Track if the page header is stuck */
    fullWidth: boolean;
}>(({ theme, fullWidth }) => ({
    padding: fullWidth ? '0px' : theme.spacing(3),
    width: '100%',
    maxWidth: fullWidth ? '100%' : '1440px !important',
    height: '100%',
}));

export interface PageProps {
    /** Content to include in the main section of the page */
    children: React.ReactNode;
}

export const Page: React.FC<PageProps> = observer(({ children }) => {
    const { page } = usePage();
    return (
        <StyledPage>
            <SideNav />
            <StyledContent>
                <TopNav />
                <StyledInner id="home__content">
                    <StyledContainer fullWidth={page.content.fullWidth}>
                        {children}
                    </StyledContainer>
                </StyledInner>
            </StyledContent>
            <PlatformMessages />
        </StyledPage>
    );
});
