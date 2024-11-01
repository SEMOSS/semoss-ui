import { useRootStore } from '@/hooks';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

export const PrivacyNotice = observer(() => {
    const { configStore } = useRootStore();
    const [pageBody, setPageBody] = useState('');

    return (
        <div>
            <div dangerouslySetInnerHTML={{ __html: pageBody }} />
        </div>
    );
});
