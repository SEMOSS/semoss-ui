import {
    styled,
    Modal,
    Button,
    Typography,
    TextField,
    Stack,
    RadioGroup,
    useNotification,
} from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import { HdrAuto, Edit, Visibility } from '@mui/icons-material';
import { AppDetailsFormTypes } from './app-details.utility';

import { PERMISSION_DESCRIPTION_MAP } from '@/constants';
import { useRootStore } from '@/hooks';

const StyledContentBox = styled(Stack)(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
    borderRadius: '4px',
}));

const StyledContentCard = styled(Stack)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: '4px',
}));

const StyledRoleInfo = styled('div')({
    width: '100%',
});

const StyledHdrAutoIcon = styled(HdrAuto)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const StyledEditIcon = styled(Edit)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const StyledVisibilityIcon = styled(Visibility)(({ theme }) => ({
    color: theme.palette.text.secondary,
}));

const ModalSectionHeading = styled(Typography)({
    fontWeight: 500,
    margin: '1rem 0 0.5rem 0',
});

interface ChangeAccessModalProps {
    open: boolean;
    onClose: (refresh?: boolean) => void;
    control: Control<AppDetailsFormTypes>;
    getValues: any;
}

export const ChangeAccessModal = (props: ChangeAccessModalProps) => {
    const { open, onClose, control, getValues } = props;
    const permissionDescriptions = PERMISSION_DESCRIPTION_MAP['APP'];

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const handleChangeAccess = async () => {
        const current = getValues('permission');
        const requested = getValues('requestedPermission');
        const comment = getValues('roleChangeComment');
        const id = getValues('appId');

        if (requested === current || requested === '') {
            notification.add({
                color: 'error',
                message:
                    'No change in Access has been requested. Please select another and try again.',
            });
            return;
        } else if (!comment) {
            notification.add({
                color: 'error',
                message: 'A comment is required to request access.',
            });
            return;
        }

        try {
            const res = await monolithStore.runQuery(
                `RequestProject(project=['${id}'], permission=['${requested}'], comment=['${comment}'])`,
            );

            const { operationType, output } = res.pixelReturn[0];

            if (operationType.indexOf('ERROR') > -1) {
                notification.add({
                    color: 'error',
                    message: output,
                });

                return;
            }

            notification.add({
                color: 'success',
                message: output,
            });
            onClose(true);
        } catch (e) {
            // TODO
        }
    };

    return (
        <Modal open={open} maxWidth={'md'} onClose={onClose}>
            <Modal.Title>Change Access</Modal.Title>

            <Modal.Content>
                <Controller
                    name="requestedPermission"
                    control={control}
                    render={({ field }) => {
                        return (
                            <StyledContentBox direction="column" gap={1}>
                                <StyledContentCard direction="row" gap={1}>
                                    <StyledHdrAutoIcon />
                                    <StyledRoleInfo>
                                        <Typography variant="subtitle1">
                                            Author
                                        </Typography>
                                        <span>
                                            {permissionDescriptions.author}
                                        </span>
                                    </StyledRoleInfo>
                                    <RadioGroup
                                        label=""
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
                                    >
                                        <RadioGroup.Item
                                            value="OWNER"
                                            label=""
                                        />
                                    </RadioGroup>
                                </StyledContentCard>

                                <StyledContentCard direction="row" gap={1}>
                                    <StyledEditIcon />
                                    <StyledRoleInfo>
                                        <Typography variant="subtitle1">
                                            Editor
                                        </Typography>
                                        <span>
                                            {permissionDescriptions.editor}
                                        </span>
                                    </StyledRoleInfo>
                                    <RadioGroup
                                        label=""
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
                                    >
                                        <RadioGroup.Item
                                            value="EDIT"
                                            label=""
                                        />
                                    </RadioGroup>
                                </StyledContentCard>

                                <StyledContentCard direction="row" gap={1}>
                                    <StyledVisibilityIcon />
                                    <StyledRoleInfo>
                                        <Typography variant="subtitle1">
                                            Read-Only
                                        </Typography>
                                        <span>
                                            {permissionDescriptions.readonly}
                                        </span>
                                    </StyledRoleInfo>
                                    <RadioGroup
                                        label=""
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
                                    >
                                        <RadioGroup.Item
                                            value="READ_ONLY"
                                            label=""
                                        />
                                    </RadioGroup>
                                </StyledContentCard>
                            </StyledContentBox>
                        );
                    }}
                />
                <ModalSectionHeading variant="subtitle1">
                    Comments:
                </ModalSectionHeading>
                <StyledContentBox>
                    <Controller
                        name="roleChangeComment"
                        control={control}
                        render={({ field }) => {
                            return (
                                <StyledContentCard>
                                    <TextField
                                        multiline
                                        fullWidth
                                        placeholder="Required*"
                                        rows={4}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </StyledContentCard>
                            );
                        }}
                    />
                </StyledContentBox>
            </Modal.Content>

            <Modal.Actions>
                <Button
                    color="primary"
                    variant="text"
                    onClick={() => onClose(false)}
                >
                    Cancel
                </Button>
                <Button
                    color="primary"
                    variant="contained"
                    onClick={handleChangeAccess}
                >
                    Request
                </Button>
            </Modal.Actions>
        </Modal>
    );
};
