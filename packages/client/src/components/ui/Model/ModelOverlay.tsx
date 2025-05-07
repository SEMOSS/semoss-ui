import { observer } from 'mobx-react-lite';
import { IconButton, Modal, Stack, Select, Autocomplete } from '@semoss/ui';
import { Clear } from '@mui/icons-material';

interface ModelOverlayProps {
    /** Id of the app to share */
    appId: string;
    /** List of models to select from */
    modelList: Record<string, string>[];
    /** Id of the selected model */
    selectedModel: string;
    /** Method called when a model is selected */
    onSelect: (id: string) => void;
    /** Method called to close overlay  */
    onClose: () => void;
}

export const ModelOverlay = observer((props: ModelOverlayProps) => {
    const {
        appId,
        modelList,
        selectedModel,
        onSelect = () => null,
        onClose = () => null,
    } = props;

    return (
        <>
            <Modal.Title>
                <Stack direction="row" justifyContent="space-between">
                    <span>Select default model</span>
                    <IconButton
                        size="small"
                        title="close"
                        aria-label="close"
                        onClick={onClose}
                    >
                        <Clear />
                    </IconButton>
                </Stack>
            </Modal.Title>
            <Modal.Content>
                <Select
                    fullWidth={true}
                    size="small"
                    value={selectedModel}
                    onChange={(e) => {
                        onSelect(e.target.value);
                        onClose();
                    }}
                >
                    {modelList.map((model) => (
                        <Select.Item key={model.value} value={model.value}>
                            {model.label}
                        </Select.Item>
                    ))}
                </Select>
            </Modal.Content>
        </>
    );
});
