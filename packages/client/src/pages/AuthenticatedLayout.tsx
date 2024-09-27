import { observer } from 'mobx-react-lite';
import { Outlet, Navigate, useLocation } from 'react-router-dom';

import { useRootStore } from '@/hooks/';
import { Button, Modal, Typography } from '@semoss/ui';
import { useState, useMemo } from 'react';
import { WelcomeModal } from '@/components/welcome';
import { cookieName } from '@/components/cookies';

/**
 * Wrap the database routes and add additional funcitonality
 */
export const AuthenticatedLayout = observer(() => {
    const { configStore } = useRootStore();
    const location = useLocation();
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const TERMS = useMemo(() => {
        const theme = configStore.store.config['theme'];

        try {
            if (theme && theme['THEME_MAP']) {
                // debugger;
                const themeMap = JSON.parse(theme['THEME_MAP'] as string);
                // debugger;
                return themeMap['termsReact'] ? themeMap['termsReact'] : '';
            }
            return '';
        } catch {
            return '';
        }
    }, []);

    // wait till the config is authenticated to load the view
    if (configStore.store.status === 'MISSING AUTHENTICATION') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const addressedCookies = localStorage.getItem(cookieName);

    return (
        <>
            {TERMS && (
                <Modal open={!acceptedTerms}>
                    <Modal.Title>
                        <Typography
                            variant={'h5'}
                            color={'primary'}
                            fontWeight="bold"
                        >
                            Warning
                        </Typography>
                    </Modal.Title>
                    <Modal.Content>{TERMS}</Modal.Content>
                    <Modal.Actions>
                        <Button
                            variant="contained"
                            onClick={() => setAcceptedTerms(true)}
                        >
                            Accept
                        </Button>
                    </Modal.Actions>
                </Modal>
            )}
            {acceptedTerms && addressedCookies && <WelcomeModal />}
            <Outlet />
        </>
    );
});
