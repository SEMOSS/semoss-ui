import { Button, Typography } from '@semoss/ui';

import { useRootStore } from '@/hooks';

interface ConnectEnginesProps {
    appId: string;
    onSuccess: () => void;
}

export const ConnectEngines = (props: ConnectEnginesProps) => {
    const { appId, onSuccess } = props;
    const { configStore } = useRootStore();
    return (
        <>
            <Typography variant="h3">Connect your engines</Typography>
            <div>Model</div>
            <div>DB</div>
            <div>Vector</div>
            <div>storage</div>
            <Button onClick={() => onSuccess()}>Next</Button>
        </>
    );
};
