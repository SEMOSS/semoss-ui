import { useState, useEffect } from 'react';

import { styled, Stack } from '@semoss/ui';

import { TopNav } from './TopNav';
import { SideNav } from './SideNav';
import { PlatformMessages } from './PlatformMessages';
import { usePage } from '@/hooks';
import { observer } from 'mobx-react-lite';

const StyledPage = styled('div')(() => ({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
}));

const StyledContent = styled(Stack)(() => ({
    position: 'relative',
    flex: '1',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

const StyledInner = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    flex: '1',
    height: '100%',
    width: '100%',
    overflowX: 'hidden',
    overflowY: 'auto',
}));

export interface PageProps {
    /** Content to include in the header */
    header?: React.ReactNode;

    /** Content to include in the main section of the page */
    children: React.ReactNode;
}

export const Page: React.FC<PageProps> = observer(({ children }) => {
    const [stuck, setStuck] = useState(false);
    const [headerElement, setHeaderElement] = useState(null);

    const { page } = usePage();

    // if the header element, is scrolled, set it as sticky
    useEffect(() => {
        if (!headerElement) {
            return;
        }

        const observer = new IntersectionObserver(
            ([e]) => {
                setStuck(e.intersectionRatio < 1);
            },
            { threshold: [1] },
        );
        observer.observe(headerElement);

        return () => {
            observer.unobserve(headerElement);
        };
    }, [headerElement]);

    return (
        <StyledPage id="home__content">
            <SideNav />
            <StyledContent direction={'column'}>
                <TopNav />
                <StyledInner>
                    {/* {header && (
                        <StyledPageHeader
                            ref={(node) => setHeaderElement(node)}
                            stuck={stuck}
                        >
                            {header}
                        </StyledPageHeader>
                    )} */}
                    <PlatformMessages>{children}</PlatformMessages>
                </StyledInner>
            </StyledContent>
        </StyledPage>
    );
});
