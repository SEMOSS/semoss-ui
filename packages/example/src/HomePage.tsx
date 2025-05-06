import { useState } from 'react';
import { NavigateNext } from '@mui/icons-material';

import { styled, Button } from '@semoss/ui';

import { Ncrt, LandingPage } from './use-cases';

const USE_CASES = [
    { key: 'NCRT', component: <Ncrt /> },
    { key: 'Landing Page', component: <LandingPage /> },
];

const StyledFab = styled(Button)(({ theme }) => ({
    bottom: theme.spacing(2),
    right: theme.spacing(2),
}));

export const HomePage = () => {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {USE_CASES[activeIndex].component}
            <StyledFab
                variant={'contained'}
                sx={{ position: 'fixed !important' }}
                endIcon={<NavigateNext />}
                onClick={() => {
                    if (activeIndex === USE_CASES.length - 1) {
                        setActiveIndex(0);
                    } else {
                        setActiveIndex(activeIndex + 1);
                    }
                }}
            >
                {USE_CASES[(activeIndex + 1) % USE_CASES.length].key}
            </StyledFab>
        </div>
    );
};
