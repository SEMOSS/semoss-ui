import { observer } from 'mobx-react-lite';
import React, { useEffect, useState } from 'react';
import { useRootStore } from '@/hooks/';
import { Button, Modal } from '@semoss/ui';

export const PlatformMessages: React.FC = observer(() => {
    const { configStore } = useRootStore();
    const [acceptedTerms, setAcceptedTerms] = useState<boolean | null>(null);

    const terms = {
        header: configStore.theme.termsHeaderReact,
        text: configStore.theme.termsHeaderReact,
    };

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
    }, [configStore.store.userEpoch, configStore.store.config]);

    const acceptTerms = () => {
        if (configStore.store.userEpoch) {
            const key = `smss--terms--${configStore.store.userEpoch}`;
            localStorage.setItem(key, JSON.stringify({ state: true }));
        }
        setAcceptedTerms(true);
    };

    return (
        <>
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
                        <Button
                            variant="contained"
                            onClick={acceptTerms}
                            data-testid={'platform-messages-accept-btn'}
                        >
                            Accept
                        </Button>
                    </Modal.Actions>
                </Modal>
            )}
        </>
    );
});
