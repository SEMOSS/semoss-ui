import {
    styled,
    Typography,
    Modal,
    Select,
    IconButton,
    Button,
    TextField,
} from '@semoss/ui';
import { useState, useEffect } from 'react';
import { usePixel, useRootStore } from '@/hooks';
import CloseIcon from '@mui/icons-material/Close';
import {
    SetProjectDependencies,
    engine,
    modelledDependency,
} from './appDetails.utility';
import { Control, Controller } from 'react-hook-form';
import { createFilterOptions, Autocomplete } from '@mui/material';

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
    control: Control<any, any>;
    getValues: any;
    setValue: any;
    watch: any;
}

export const EditDependenciesModal = (props: EditDependenciesModalProps) => {
    const { isOpen, onClose, control, getValues, setValue, watch } = props;
    const { monolithStore } = useRootStore();
    const allDependencies = watch('allDependencies');
    const selectedDependencies = watch('selectedDependencies');

    const getEngines = usePixel<engine[]>('MyEngines();');
    const [dependencyIds, setDependencyIds] = useState<string[]>([]);
    const filter = createFilterOptions<string>();

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }

        const modelledDependencies = getEngines.data.map((d) => ({
            appName: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            appId: d.app_id,
            appType: d.app_type,
            isDiscoverable: d.database_discoverable,
            isPublic: d.database_global,
        }));

        setValue('allDependencies', modelledDependencies);
    }, [getEngines.status, getEngines.data]);

    const handleUpdateDependencies = () => {
        const appId = getValues('appId');
        SetProjectDependencies(monolithStore, appId, selectedDependencies);
    };

    const handleRemoveDependency = (id: string) => {
        // TODO
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

                <Controller
                    name="selectedDependencies"
                    control={control}
                    render={({ field }) => {
                        return (
                            <Autocomplete
                                options={allDependencies}
                                value={field.value}
                                fullWidth
                                multiple
                                onChange={(_, val) => field.onChange(val)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Search" />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>{option.appName}</li>
                                )}
                                getOptionLabel={(option: modelledDependency) =>
                                    option.appName
                                }
                                isOptionEqualToValue={(option, value) => {
                                    return option.appId === value.appId;
                                }}
                                filterOptions={(options, params) => {
                                    const filtered = filter(options, params);

                                    const { inputValue } = params;
                                    const isExisting = options.some(
                                        (option) => inputValue === option.appId,
                                    );
                                    if (inputValue !== '' && !isExisting) {
                                        filtered.push(inputValue);
                                    }

                                    return filtered;
                                }}
                            />
                        );
                    }}
                />

                {/* {dependencies?.map(
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
                            <IconButton
                                onClick={() =>
                                    handleRemoveDependency(engine_id)
                                }
                            >
                                <CloseIcon />
                            </IconButton>
                        </ModalDependencyRow>
                    ),
                )} */}

                <ModalFooter>
                    <Button onClick={() => onClose()} variant="text">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpdateDependencies}
                        variant="contained"
                    >
                        Save
                    </Button>
                </ModalFooter>
            </EditModalInnerContainer>
        </Modal>
    );
};
