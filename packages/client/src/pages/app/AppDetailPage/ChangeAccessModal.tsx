import {
    styled,
    Modal,
    Button,
    Typography,
    TextField,
    Stack,
    RadioGroup,
} from '@semoss/ui';
import { Control, Controller } from 'react-hook-form';
import { HdrAuto, Edit, Visibility } from '@mui/icons-material';
import { AppDetailsFormTypes } from './appDetails.utility';

const ContentBox = styled(Stack)(({ theme }) => ({
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(1),
    borderRadius: '4px',
}));

const ContentCard = styled(Stack)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(2),
    borderRadius: '4px',
}));

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
    onClose: () => void;
    control: Control<AppDetailsFormTypes>;
}

export const ChangeAccessModal = (props: ChangeAccessModalProps) => {
    const { open, onClose, control } = props;

    const handleChangeAccess = () => {
        // TODO
    };

    return (
        <Modal open={open} maxWidth={'md'} onClose={onClose}>
            <Modal.Title>Change Access</Modal.Title>

            <Modal.Content>
                <Controller
                    name="permission"
                    control={control}
                    render={({ field }) => {
                        return (
                            <ContentBox direction="column" gap={1}>
                                <ContentCard direction="row" gap={1}>
                                    <StyledHdrAutoIcon />
                                    <div>
                                        <Typography variant="subtitle1">
                                            Author
                                        </Typography>
                                        <span>
                                            Ability to hide or delete the data
                                            app, provision other authors, and
                                            all editor permissions.
                                        </span>
                                    </div>
                                    <RadioGroup
                                        label=""
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
                                    >
                                        <RadioGroup.Item
                                            value="author"
                                            label=""
                                        />
                                    </RadioGroup>
                                </ContentCard>

                                <ContentCard direction="row" gap={1}>
                                    <StyledEditIcon />
                                    <div>
                                        <Typography variant="subtitle1">
                                            Editor
                                        </Typography>
                                        <span>
                                            Ability to Edit the data app code,
                                            provision other users as editors and
                                            read-only users, and all read-only
                                            permissions.
                                        </span>
                                    </div>
                                    <RadioGroup
                                        label=""
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
                                    >
                                        <RadioGroup.Item
                                            value="editor"
                                            label=""
                                        />
                                    </RadioGroup>
                                </ContentCard>

                                <ContentCard direction="row" gap={1}>
                                    <StyledVisibilityIcon />
                                    <div>
                                        <Typography variant="subtitle1">
                                            Read-Only
                                        </Typography>
                                        <span>
                                            Ability to view the data app. User
                                            still requires permission to all
                                            dependent databases, models, remote
                                            storage, vector databases, etc.
                                        </span>
                                    </div>
                                    <RadioGroup
                                        label=""
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
                                    >
                                        <RadioGroup.Item
                                            value="readOnly"
                                            label=""
                                        />
                                    </RadioGroup>
                                </ContentCard>
                            </ContentBox>
                        );
                    }}
                />
                <ModalSectionHeading variant="subtitle1">
                    Comments:
                </ModalSectionHeading>
                <ContentBox>
                    <Controller
                        name="roleChangeComment"
                        control={control}
                        render={({ field }) => {
                            return (
                                <ContentCard>
                                    <TextField
                                        multiline
                                        fullWidth
                                        placeholder="Required*"
                                        rows={4}
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </ContentCard>
                            );
                        }}
                    />
                </ContentBox>
            </Modal.Content>

            <Modal.Actions>
                <Button color="primary" variant="text" onClick={onClose}>
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
