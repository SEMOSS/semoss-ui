import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';

import { useRootStore } from '@/hooks/';
import { Button, Modal } from '@semoss/ui';
import { useState, useMemo } from 'react';
import { WelcomeModal } from '@/components/welcome';
import { cookieName } from '@/components/cookies';

interface PlatformMessagesProps {
    /**
     * children
     */
    children: React.ReactNode;

    /**
     * Does the user need app assistance at this point of time (welcome-tour)
     */
    platformAssist?: boolean;
}

export const PlatformMessages = observer((props: PlatformMessagesProps) => {
    const { children, platformAssist } = props;
    const { configStore } = useRootStore();
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    /**
     * CHECKS IF USER HAS ACCEPTED TERMS
     */
    useEffect(() => {
        if (configStore.store.userEpoch) {
            const key = `smss--terms--${configStore.store.userEpoch}`;

            const item = localStorage.getItem(key);

            if (item) {
                // try to get the state
                const d = JSON.parse(item);

                setAcceptedTerms(d.state);
            }
        }
    }, [configStore.store.userEpoch]);

    const acceptTerms = () => {
        if (configStore.store.userEpoch) {
            const key = `smss--terms--${configStore.store.userEpoch}`;
            // save cache
            localStorage.setItem(
                key,
                JSON.stringify({
                    state: true,
                }),
            );
        }
        setAcceptedTerms(true);
    };

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

    const addressedCookies = localStorage.getItem(cookieName);

    return (
        <>
            {/* APP CODE */}
            {children}

            {/* ---------------------------------------- */}
            {/* ALL NOTICES FOR USER BELOW */}
            {/* ---------------------------------------- */}
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
                            onClick={() => {
                                acceptTerms();
                            }}
                        >
                            Accept
                        </Button>
                    </Modal.Actions>
                </Modal>
            )}
            {acceptedTerms && addressedCookies && platformAssist && (
                <WelcomeModal />
            )}
        </>
    );
});
