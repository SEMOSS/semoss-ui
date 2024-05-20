import {
    styled,
    Typography,
    Modal,
    IconButton,
    TextField,
    Stack,
    Button,
    useNotification,
} from '@semoss/ui';
import { useEffect } from 'react';
import { usePixel, useRootStore } from '@/hooks';
import { Env } from '@/env';
import {
    SetProjectDependencies,
    engine,
    dependency,
    modelDependencies,
} from './appDetails.utility';
import { Control, Controller } from 'react-hook-form';
import { Autocomplete } from '@mui/material';
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
    onClose: (refresh: boolean) => void;
    control: Control<any, any>;
    getValues: any;
    setValue: any;
    watch: any;
}

export const EditDependenciesModal = (props: EditDependenciesModalProps) => {
    const { isOpen, onClose, control, getValues, setValue, watch } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();
    const allDeps = watch('allDependencies');
    const selectedDeps = watch('selectedDependencies');

    const getEngines = usePixel<engine[]>('MyEngines();');

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }

        const dependencies = modelDependencies(getEngines.data);

        setValue('allDependencies', dependencies);
    }, [getEngines.status, getEngines.data]);

    const handleUpdateDependencies = async () => {
        const appId = getValues('appId');
        const res = await SetProjectDependencies(
            monolithStore,
            appId,
            selectedDeps,
        );

        if (res.type === 'success') {
            notification.add({
                color: 'success',
                message: 'Successfully updated dependencies',
            });
            onClose(true);
        } else {
            notification.add({
                color: 'error',
                message: res.output,
            });
        }
    };

    const handleRemoveDependency = (id: string) => {
        const newDependencies = selectedDeps.filter((dep) => dep.app_id !== id);
        setValue('selectedDependencies', newDependencies);
    };

    return (
        <Modal open={isOpen} fullWidth>
            <EditModalInnerContainer>
                <ModalHeaderWrapper>
                    <ModalHeading variant="h2">
                        Add and Edit Dependencies
                    </ModalHeading>
                    <IconButton onClick={() => onClose(false)}>
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
                                    <li {...props}>{option.app_name}</li>
                                )}
                                getOptionLabel={(option: dependency) =>
                                    option.app_name
                                }
                                isOptionEqualToValue={(option, value) => {
                                    return option.id === value.appId;
                                }}
                            />
                        );
                    }}
                />

                <ul>
                    {selectedDeps.map((dep: dependency, idx: number) => {
                        return (
                            <StyledDependencyListItem
                                key={`${dep.app_id}-${idx}`}
                            >
                                <StyledCardImage
                                    src={`${Env.MODULE}/api/e-${dep.app_id}/image/download`}
                                    sx={{ height: '134px' }}
                                />
                                <div>
                                    <Typography variant="h6">
                                        {dep.app_name}
                                    </Typography>
                                    <Stack direction="row">
                                        {`${dep.app_type} | Engine ID: ${dep.app_id}`}
                                    </Stack>
                                </div>
                                <IconButton
                                    onClick={() =>
                                        handleRemoveDependency(dep.app_id)
                                    }
                                >
                                    <Close />
                                </IconButton>
                            </StyledDependencyListItem>
                        );
                    })}
                </ul>

                <ModalFooter>
                    <Button onClick={() => onClose(false)} variant="text">
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
