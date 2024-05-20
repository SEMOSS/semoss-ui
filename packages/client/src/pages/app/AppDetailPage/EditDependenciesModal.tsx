import {
    styled,
    Typography,
    Modal,
    IconButton,
    TextField,
    Stack,
    Button,
} from '@semoss/ui';
import { useEffect } from 'react';
import { usePixel, useRootStore } from '@/hooks';
import { Env } from '@/env';
import {
    SetProjectDependencies,
    engine,
    modelledDependency,
} from './appDetails.utility';
import { Control, Controller } from 'react-hook-form';
import { createFilterOptions, Autocomplete } from '@mui/material';
import { Close } from '@mui/icons-material';

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

const StyledModalSubHeading = styled(Typography)(({ theme }) => ({
    fontSize: '14px',
    paddingBottom: theme.spacing(1),
    fontWeight: 'medium',
}));

const StyledDependencyListItem = styled('li')(({ theme }) => ({
    border: '1px solid red',
    margin: `${theme.spacing(1)} 0`,
    padding: `0 ${theme.spacing(2)}`,
    gap: theme.spacing(2),
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
}));

const StyledCardImage = styled('img')({
    display: 'flex',
    height: '134px',
    alignItems: 'flex-start',
    gap: '10px',
    alignSelf: 'stretch',

    overflowClipMargin: 'content-box',
    overflow: 'clip',
    objectFit: 'cover',
    width: '100%',
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
    const appId = watch('appId');
    const allDeps = watch('allDependencies');
    const selectedDeps = watch('selectedDependencies');

    const getEngines = usePixel<engine[]>('MyEngines();');
    const filter = createFilterOptions<string>();

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }

        const modelledDependencies = getEngines.data.map((d) => ({
            name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            id: d.app_id,
            type: d.app_type,
            isDiscoverable: d.database_discoverable,
            isPublic: d.database_global,
        }));

        setValue('allDependencies', modelledDependencies);
    }, [getEngines.status, getEngines.data]);

    const handleUpdateDependencies = () => {
        const appId = getValues('appId');
        SetProjectDependencies(monolithStore, appId, selectedDeps);
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
                        <Close />
                    </IconButton>
                </ModalHeaderWrapper>

                <StyledModalSubHeading variant="h3">
                    Linked Dependencies
                </StyledModalSubHeading>

                <Controller
                    name="selectedDependencies"
                    control={control}
                    render={({ field }) => {
                        return (
                            <Autocomplete
                                options={allDeps}
                                value={field.value}
                                fullWidth
                                multiple
                                onChange={(_, val) => field.onChange(val)}
                                renderInput={(params) => (
                                    <TextField {...params} label="Search" />
                                )}
                                renderOption={(props, option) => (
                                    <li {...props}>{option.name}</li>
                                )}
                                getOptionLabel={(option: modelledDependency) =>
                                    option.name
                                }
                                isOptionEqualToValue={(option, value) => {
                                    return option.id === value.id;
                                }}
                            />
                        );
                    }}
                />

                <ul>
                    {selectedDeps.map(
                        (dep: modelledDependency, idx: number) => {
                            return (
                                <StyledDependencyListItem
                                    key={`${dep.id}-${idx}`}
                                >
                                    <StyledCardImage
                                        src={`${Env.MODULE}/api/e-${dep.id}/image/download`}
                                        sx={{ height: '134px' }}
                                    />
                                    <div>
                                        <Typography variant="h6">
                                            {dep.name}
                                        </Typography>
                                        <Stack direction="row">
                                            {`${dep.type} | Engine ID: ${appId}`}
                                        </Stack>
                                    </div>
                                    <IconButton>
                                        <Close />
                                    </IconButton>
                                </StyledDependencyListItem>
                            );
                        },
                    )}
                </ul>

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
