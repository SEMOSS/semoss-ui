import { useRootStore } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

export const CookieNotice = observer(() => {
    const { configStore } = useRootStore();
    const [pageBody, setPageBody] = useState('');

    console.log('COOKIE NOTICE', pageBody);

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
        <div>
            <div dangerouslySetInnerHTML={{ __html: pageBody }} />
        </div>
    );
});
