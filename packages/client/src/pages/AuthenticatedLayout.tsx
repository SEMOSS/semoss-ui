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
                const themeMap = JSON.parse(theme['THEME_MAP'] as string);
                return {
                    header: themeMap['termsHeaderReact']
                        ? themeMap['termsHeaderReact']
                        : 'Attention',
                    text: themeMap['termsReact'] ? themeMap['termsReact'] : '',
                };
            }
            return {
                header: '',
                text: '',
            };
        } catch {
            return {
                header: '',
                text: '',
            };
        }
    }, []);

    // wait till the config is authenticated to load the view
    if (configStore.store.status === 'MISSING AUTHENTICATION') {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const addressedCookies = localStorage.getItem(cookieName);

    return (
        <>
            {TERMS.header && TERMS.text && (
                <Modal open={!acceptedTerms}>
                    <Modal.Title sx={{ paddingBottom: '0' }}>
                        <div
                            id="attention-modal-header"
                            dangerouslySetInnerHTML={{
                                __html: TERMS.header,
                            }}
                        ></div>
                    </Modal.Title>
                    <Modal.Content>
                        <div
                            id="attention-modal-body"
                            dangerouslySetInnerHTML={{
                                __html: TERMS.text,
                            }}
                        ></div>
                    </Modal.Content>
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
