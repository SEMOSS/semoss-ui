import { Container, styled } from '@semoss/ui';

import {
    Navbar,
    NAVBAR_LEFT_ID,
    NAVBAR_MIDDLE_ID,
    NAVBAR_RIGHT_ID,
} from './navbar/Navbar';
import { Sidebar } from './Sidebar';
import { PlatformMessages } from './PlatformMessages';
import { observer } from 'mobx-react-lite';
import { usePage } from '@/hooks';
import { useEffect, useState } from 'react';

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

const StyledContainer = styled(Container)(({ theme }) => ({
    paddingTop: theme.spacing(3),
}));

export interface PageProps {
    /** Content to include in the main section of the page */
    children: React.ReactNode;
}

const WaitForNav = ({ children }) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const navbarLeft = document.getElementById(NAVBAR_LEFT_ID);
        const navbarMiddle = document.getElementById(NAVBAR_MIDDLE_ID);
        const navbarRight = document.getElementById(NAVBAR_RIGHT_ID);

        const check = () => {
            if (navbarLeft && navbarMiddle && navbarRight) {
                setReady(true);
            } else {
                setTimeout(check, 10);
            }
        };
        check();
    }, []);

    if (!ready) return null;
    return children;
};

export const Page: React.FC<PageProps> = observer(({ children }) => {
    const { page } = usePage();

    return (
        <StyledPage>
            <Sidebar />
            <StyledContent>
                <Navbar />
                <StyledInner id="home__content">
                    <StyledContainer sx={{ maxWidth: '1440px' }}>
                        <WaitForNav>{children}</WaitForNav>
                    </StyledContainer>
                </StyledInner>
            </StyledContent>
            <PlatformMessages />
        </StyledPage>
    );
});
