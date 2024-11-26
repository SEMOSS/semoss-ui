import React, { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, styled, Typography } from '@semoss/ui';
import { useRootStore } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { Close } from '@mui/icons-material';
import { PrivacyPreferenceCenterModal } from './PrivacyPreferenceCenterModal';

const CustomBackdrop = styled(Box)(({ theme }) => ({
    position: 'fixed',
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 999,
    width: '100%',
    height: '100%',
}));

const AcceptCookieContainer = styled(Box)(({ theme }) => ({
    border: `2px solid ${theme.palette.secondary.border}`,
    position: 'fixed',
    bottom: theme.spacing(4),
    left: 'calc(50% - 250px)',
    zIndex: 1000,
    width: '500px',
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(3),
}));

const StyledButton = styled(Button)(({ theme }) => ({
    width: 'initial',
}));

interface CookieWrapperProps {
    /** Content to overlay the Loading Screen on */
    children: React.ReactNode;
}

export const cookieName = `smss-optional-cookie`;

export const CookieWrapper = observer((props: CookieWrapperProps) => {
    const { children } = props;
    const { configStore } = useRootStore();

    const [visible, setVisible] = useState(true);
    const [viewCookiePolicy, setViewCookiePolicy] = useState(false);

    const [cookieBanner, setCookieBanner] = useState('');

    useEffect(() => {
        const permissionGranted = localStorage.getItem(cookieName);

        if (!permissionGranted) {
            const theme = configStore.store.config.theme;
            if (theme && theme['THEME_MAP']) {
                try {
                    const themeMap = JSON.parse(theme['THEME_MAP'] as string);

                    const themeCookieBanner = themeMap[
                        'cookiePolicyBannerReact'
                    ]
                        ? themeMap['cookiePolicyBannerReact']
                        : '';

                    if (themeCookieBanner) {
                        setCookieBanner(themeCookieBanner);
                    } else {
                        setVisible(false);
                    }
                } catch {
                    console.error('Unable to parse theme for cookie wrapper');
                }
            } else {
                setVisible(false);
            }
        } else {
            setVisible(false);
        }

        return () => {
            setVisible(true);
        };
    }, [Object.keys(configStore.store.config).length]);

    const acceptCookies = () => {
        localStorage.setItem(cookieName, JSON.stringify(true));

        setViewCookiePolicy(false);
        setVisible(false);
    };

    return (
        <>
            {children}
            {visible && (
                <>
                    <CustomBackdrop />
                    <AcceptCookieContainer>
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            gap={1}
                        >
                            <Typography
                                variant="h6"
                                fontWeight="bold"
                                color="secondary"
                            >
                                Here&apos;s how we use cookies
                            </Typography>

                            <IconButton size="small" onClick={acceptCookies}>
                                <Close />
                            </IconButton>
                        </Stack>

                        <Stack justifyContent="center">
                            <div
                                style={{ width: '100%' }}
                                id="cookie-policy-banner"
                                dangerouslySetInnerHTML={{
                                    __html: cookieBanner,
                                }}
                            />
                        </Stack>
                        <Stack direction="row" justifyContent="center">
                            <StyledButton
                                variant="text"
                                onClick={() => {
                                    setViewCookiePolicy(true);
                                }}
                            >
                                View cookies
                            </StyledButton>
                        </Stack>
                    </AcceptCookieContainer>
                </>
            )}

            <PrivacyPreferenceCenterModal
                isOpen={viewCookiePolicy}
                onClose={() => setViewCookiePolicy(false)}
            />
        </>
    );
});
