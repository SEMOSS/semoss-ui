import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { useRootStore } from '@/hooks/';
import { Button, Modal } from '@semoss/ui';
import { WelcomeModal } from '@/components/welcome';
import { cookieName } from '@/components/cookies';

interface PlatformMessagesProps {
    children: React.ReactNode;
    platformAssist?: boolean;
}

export const PlatformMessages = observer((props: PlatformMessagesProps) => {
    const { children, platformAssist } = props;
    const { configStore } = useRootStore();
    const [acceptedTerms, setAcceptedTerms] = useState<boolean | null>(null);
    const [terms, setTerms] = useState({ header: '', text: '' });

    useEffect(() => {
        if (configStore.store.userEpoch) {
            const key = `smss--terms--${configStore.store.userEpoch}`;
            const item = localStorage.getItem(key);
            if (item) {
                const d = JSON.parse(item);
                setAcceptedTerms(d.state);
            } else {
                setAcceptedTerms(false);
            }
        }

        const theme = configStore.store.config['theme'];
        try {
            if (theme && theme['THEME_MAP']) {
                const themeMap = JSON.parse(theme['THEME_MAP'] as string);
                setTerms({
                    header: themeMap['termsHeaderReact'] || 'Attention',
                    text: themeMap['termsReact'] || '',
                });
            }
        } catch {
            console.error('Error parsing theme data');
        }
    }, [configStore.store.userEpoch, configStore.store.config]);

    const acceptTerms = () => {
        if (configStore.store.userEpoch) {
            const key = `smss--terms--${configStore.store.userEpoch}`;
            localStorage.setItem(key, JSON.stringify({ state: true }));
        }
        setAcceptedTerms(true);
    };

    const addressedCookies = localStorage.getItem(cookieName);

    if (acceptedTerms === null) {
        return <>{children}</>;
    }

    return (
        <>
            {children}
            {!acceptedTerms && terms.header && terms.text && (
                <Modal open={true}>
                    <Modal.Title sx={{ paddingBottom: '0' }}>
                        <div
                            id="attention-modal-header"
                            dangerouslySetInnerHTML={{ __html: terms.header }}
                        />
                    </Modal.Title>
                    <Modal.Content>
                        <div
                            id="attention-modal-body"
                            dangerouslySetInnerHTML={{ __html: terms.text }}
                        />
                    </Modal.Content>
                    <Modal.Actions>
                        <Button variant="contained" onClick={acceptTerms}>
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
