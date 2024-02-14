import { observer } from 'mobx-react-lite';
import { Outlet } from 'react-router-dom';
import { styled } from '@semoss/ui';

import { Navbar } from '@/components/ui';

const NAV_HEIGHT = '48px';

// background: var(--light-text-primary, rgba(0, 0, 0, 0.87));
const StyledContent = styled('div')(() => ({
    position: 'absolute',
    paddingTop: NAV_HEIGHT,
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

/**
 * Wrap the routes with a header
 */
export const HeaderLayout = observer(() => {
    return (
        <>
            <Navbar />
            <StyledContent>
                <Outlet />
            </StyledContent>
        </>
    );
});
