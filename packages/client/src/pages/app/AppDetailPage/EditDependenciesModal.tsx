import {
    styled,
    Typography,
    Modal,
    Select,
    IconButton,
    Button,
} from '@semoss/ui';
import { useState, useEffect } from 'react';
import { usePixel } from '@/hooks';
import CloseIcon from '@mui/icons-material/Close';

const EditModalInnerContainer = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
});

const ModalHeaderWrapper = styled('div')({
    alignItems: 'center',
    display: 'flex',
    marginBottom: '1rem',
    justifyContent: 'space-between',
});

const ModalHeading = styled(Typography)({
    fontSize: 20,
    fontWeight: 500,
});

const ModalDependencyRow = styled('div')({
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    margin: '0.5rem 0',
});

const ModalEngineName = styled(Typography)({
    marginBottom: '0.5rem',
});

const ModalEngineTypeAndId = styled(Typography)({
    fontSize: 12,
});

const ModalFooter = styled('div')({
    display: 'flex',
    gap: '0.5rem',
    marginLeft: 'auto',
});

interface EditDependenciesModalProps {
    isOpen: boolean;
    onClose: () => void;
    dependencies: any;
    runSetDependenciesQuery: any;
}

export const EditDependenciesModal = (props: EditDependenciesModalProps) => {
    const { isOpen, onClose, dependencies, runSetDependenciesQuery } = props;
    // TODO: Get dependency image
    // TODO: Add search bar
    // TODO: Add save functionality

    // Temporary: I need all Engines
    const [engines, setEngines] = useState({
        models: [],
        databases: [],
        storages: [],
    });

    const [dependency, setDependency] = useState(null);

    const getEngines = usePixel<
        { app_id: string; app_name: string; app_type: string }[]
    >(`
        MyEngines();
    `);

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }

        const cleanedEngines = getEngines.data.map((d) => ({
            app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            app_id: d.app_id,
            app_type: d.app_type,
        }));

        const newEngines = {
            models: cleanedEngines.filter((e) => e.app_type === 'MODEL'),
            databases: cleanedEngines.filter((e) => e.app_type === 'DATABASE'),
            storages: cleanedEngines.filter((e) => e.app_type === 'STORAGE'),
        };

        setEngines(newEngines);
    }, [getEngines.status, getEngines.data]);

    const saveDependencies = () => {
        runSetDependenciesQuery([dependency]);
    };

    return (
        <Modal open={isOpen} fullWidth>
            <EditModalInnerContainer>
                <ModalHeaderWrapper>
                    <ModalHeading variant="h2">
                        Add and Edit Dependencies
                    </ModalHeading>
                    <IconButton onClick={() => onClose()}>
                        <CloseIcon />
                    </IconButton>
                </ModalHeaderWrapper>

                <Typography
                    variant="h3"
                    fontWeight="medium"
                    sx={{ fontSize: '14px' }}
                >
                    Linked Dependencies
                </Typography>

                <pre>search bar</pre>

                <Select
                    onChange={(e) => {
                        setDependency(e.target.value);
                    }}
                >
                    {engines.models.map((model, i) => {
                        return (
                            <Select.Item
                                key={`select-item--${model}--${i}`}
                                value={model.app_id}
                            >
                                {model.app_id}
                            </Select.Item>
                        );
                    })}
                </Select>

                {dependencies?.map(
                    ({ engine_id, engine_name, engine_type }, idx) => (
                        <ModalDependencyRow
                            key={`dependency-${engine_id}-${idx}`}
                        >
                            <div>
                                <ModalEngineName
                                    variant="body1"
                                    fontWeight="medium"
                                >
                                    {engine_name}
                                </ModalEngineName>
                                <ModalEngineTypeAndId variant="body2">
                                    {engine_type} | Engine ID: {engine_id}
                                </ModalEngineTypeAndId>
                            </div>
                            <IconButton onClick={() => null}>
                                <CloseIcon />
                            </IconButton>
                        </ModalDependencyRow>
                    ),
                )}

                <ModalFooter>
                    <Button onClick={() => onClose()} variant="text">
                        Cancel
                    </Button>
                    <Button onClick={saveDependencies} variant="contained">
                        Save
                    </Button>
                </ModalFooter>
            </EditModalInnerContainer>
        </Modal>
    );
};
