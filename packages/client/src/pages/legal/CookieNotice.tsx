import { useRootStore } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { LegalPage } from './components/legalPage';

export const CookieNotice = observer(() => {
    const { configStore } = useRootStore();
    const [pageBody, setPageBody] = useState('');

    useEffect(() => {
        const theme = configStore.store.config.theme;
        if (theme && theme['THEME_MAP']) {
            try {
                const map = JSON.parse(theme['THEME_MAP'] as string);

                const cookiePolicyNoticePage = map['cookiePolicyNoticePage']
                    ? map['cookiePolicyNoticePage']
                    : '';
                setPageBody(cookiePolicyNoticePage);
            } catch {
                console.error('Unable to parse theme for Cookie Notice');
            }
        }
    }, [Object.keys(configStore.store.config).length]);

    return (
        <LegalPage>
            <div dangerouslySetInnerHTML={{ __html: pageBody }} />
        </LegalPage>
    );
});
