import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Stack, Typography, styled } from '@semoss/ui';
import Error from '@/assets/img/Error.svg';

const StyledContainer = styled(Stack)(() => ({
    width: '100vw',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
}));

/**
 * Component to be rendered in the ErrorBoundary on the NavigatorLayout
 * Displays when there is an error that prevents the FE from loading and redirects back to the homepage
 */
export const ErrorPage = () => {
    const [countdown, setCountdown] = useState(10);
    const timer = useRef<NodeJS.Timer>();
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const isOnHomepage = pathname == '' || pathname == '/';

    useEffect(() => {
        if (!isOnHomepage) {
            timer.current = setInterval(() => {
                setCountdown((countdown) => countdown - 1);
            }, 1000);
        }
    }, []);

    useEffect(() => {
        if (countdown < 1) {
            clearInterval(timer.current);
            navigate('/');
        }
    }, [countdown]);

    return (
        <StyledContainer>
            <img src={Error} height="50%" />
            <Typography variant="h6">Something went wrong!</Typography>
            <Typography variant="body1">
                We&apos;re working hard to fix it. If the issue persists, please
                reach out and let us know.
            </Typography>
            {!isOnHomepage && (
                <Typography variant="body1">
                    Taking you back to the home page in {countdown} second
                    {countdown == 1 ? '' : 's'}...
                </Typography>
            )}
        </StyledContainer>
    );
};
