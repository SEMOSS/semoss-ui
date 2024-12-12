import { useRootStore } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { LegalPage } from './components/legalPage';

export const PrivacyNotice = observer(() => {
    const { configStore } = useRootStore();
    const [pageBody, setPageBody] = useState('');

    useEffect(() => {
        const theme = configStore.store.config.theme;
        if (theme && theme['THEME_MAP']) {
            try {
                const map = JSON.parse(theme['THEME_MAP'] as string);

                const privacyNoticePage = map['privacyNoticePage']
                    ? map['privacyNoticePage']
                    : '';
                setPageBody(privacyNoticePage);
            } catch {
                console.error('Unable to parse theme for Privacy Notice');
            }
        }
    }, [Object.keys(configStore.store.config).length]);

    return (
        <LegalPage>
            <div dangerouslySetInnerHTML={{ __html: pageBody }} />
        </LegalPage>
    );
});
