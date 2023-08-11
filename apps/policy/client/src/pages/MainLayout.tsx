import { styled, Alert, Typography } from '@semoss/ui';
import { Outlet } from 'react-router-dom';

import LOGO_POWERED from '@/assets/img/logo.svg';

const StyledWrapper = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    width: '100%',
    overflow: 'auto',
}));

const StyledMain = styled('div')(() => ({
    position: 'relative',
    flex: 1,
    overflow: 'auto',
}));

const StyledContent = styled('div')(({ theme }) => ({
    position: 'relative',
    minHeight: `calc(100vh - ${theme.spacing(4)})`,
    [theme.breakpoints.down('sm')]: {
        minHeight: `auto`,
    },
}));

const StyledDisclaimer = styled('div')(({ theme }) => ({
    position: 'absolute',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    bottom: 0,
    width: '100%',
    textAlign: 'center',
    padding: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
        position: 'relative',
    },
}));

const StyledFooter = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    height: theme.spacing(4),
    width: '100%',
}));

const StyledFooterLogo = styled('a')(({ theme }) => ({
    display: 'inline-flex',
    textDecoration: 'none',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    color: theme.palette.text.primary,
    fontSize: theme.typography.caption.fontSize,
    overflow: 'hidden',
    '& > img': {
        height: theme.spacing(3),
    },
    ':visited': {
        color: 'inherit',
    },
}));

/**
 * Wrap the routes
 */
export const MainLayout = () => {
    return (
        <StyledWrapper>
            <StyledMain id="main">
                <StyledContent>
                    <Outlet />
                </StyledContent>
                <StyledDisclaimer>
                    <Alert severity={'info'}>
                        <Typography
                            variant={'caption'}
                            sx={{ fontWeight: 600 }}
                        >
                            Please note: This is a demo environment to be used
                            for testing purposes only.
                        </Typography>
                    </Alert>
                </StyledDisclaimer>
                <StyledFooter>
                    &nbsp;
                    <StyledFooterLogo
                        title="CfG.AI"
                        href="https://deloitte.com"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <span>Powered By</span>
                        <img src={LOGO_POWERED} />
                    </StyledFooterLogo>
                </StyledFooter>
            </StyledMain>
        </StyledWrapper>
    );
};
