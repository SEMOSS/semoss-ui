import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import { Box } from '@semoss/ui';
import { useBlock } from '@semoss/renderer';
import { useRootStore } from '@/hooks';
import TabsComponent from './SelectionTabs';

interface GeneralSettingsProps {
    id: string;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = observer(({ id }) => {
    const { data, setData } = useBlock(id);
    const { configStore } = useRootStore();
    const { appId } = useParams();

    return (
        <Box sx={{ width: '100%' }}>
            <TabsComponent
                {...{
                    data,
                    insightId: configStore.store.insightID,
                    appId,
                    id,
                    setData,
                }}
            />
        </Box>
    );
});

export default GeneralSettings;
