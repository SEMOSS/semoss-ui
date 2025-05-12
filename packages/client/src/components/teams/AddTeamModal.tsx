import { Controller, useForm } from 'react-hook-form';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { Close } from '@mui/icons-material';

import {
    Stack,
    Modal,
    Box,
    Button,
    Select,
    TextField,
    Typography,
    styled,
    useNotification,
    IconButton,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';

import AMAZON_S3 from '@/assets/loginProviders/Amazon_S3.png';
import newGoogle from '@/assets/loginProviders/google.png';
import Github from '@/assets/loginProviders/github.png';
import Okta from '@/assets/loginProviders/okta.png';
import Dropbox from '@/assets/loginProviders/dropbox.png';
import ADFS from '@/assets/loginProviders/adfs_microsoft_1.png';
import Gitlab from '@/assets/loginProviders/gitlab.png';
import Keycloak from '@/assets/loginProviders/keycloak.png';
import Linkedin from '@/assets/loginProviders/linkedin.png';
import Microsoft from '@/assets/loginProviders/microsoft.png';
import ProductHunt from '@/assets/loginProviders/product_hunt.png';
import Salesforce from '@/assets/loginProviders/salesforce.png';
import Saml from '@/assets/loginProviders/saml.png';
import Siteminder from '@/assets/loginProviders/siteminder.png';
import Surverymonkey from '@/assets/loginProviders/surveymonkey.png';
import Twitter from '@/assets/loginProviders/x_twitter.png';

const StyledModalTitle = styled(Modal.Title)(({ theme }) => ({
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
}));

const StyledIcon = styled(PeopleAltIcon)(({ theme }) => ({
    color: theme.palette.secondary.dark,
}));

const StyledMenuItemDesc = styled(Typography)(({ theme }) => ({
    color: theme.palette.secondary.dark,
}));

const StyledSelectItem = styled(Select.Item, {
    shouldForwardProp: (prop) => prop !== 'type',
})<{
    /** Track if the page header is stuck */
    type: string;
}>(({ theme, type }) => ({
    borderBottom: type === 'Custom' ? `solid ${theme.palette.divider}` : 'none',
}));

const TypeImageObject = {
    native: AMAZON_S3,
    google: newGoogle,
    github: Github,
    okta: Okta,
    dropbox: Dropbox,
    adfs: ADFS,
    gitlab: Gitlab,
    keycloak: Keycloak,
    linkedin: Linkedin,
    ms: Microsoft,
    product_hunt: ProductHunt,
    salesforce: Salesforce,
    saml: Saml,
    siteminder: Siteminder,
    surveymonkey: Surverymonkey,
    twitter: Twitter,
};

type TeamReturn = {
    id: string;
    type: string;
    description: string;
};

type NewTeamForm = {
    TEAM_NAME: string;
    TEAM_DESCRIPTION: string;
    TEAM_TYPE: string;
};

interface AddTeamModalProps {
    /**
     * Open state
     */
    open: boolean;

    /**
     * What happens when team is created
     * @param team
     * @returns
     */
    // eslint-disable-next-line no-unused-vars
    onClose: (team?: TeamReturn) => void;
}

export const AddTeamModal = (props: AddTeamModalProps) => {
    const { open, onClose } = props;

    const notification = useNotification();
    const { monolithStore, configStore } = useRootStore();

    const {
        handleSubmit,
        control,
        reset,
        formState: { isValid },
    } = useForm<NewTeamForm>({
        defaultValues: {
            TEAM_NAME: '',
            TEAM_DESCRIPTION: '',
            TEAM_TYPE: '',
        },
    });

    const loginTypes = [
        {
            provider: 'Custom',
            name: 'Custom',
            description: 'Directly manage users in the team',
            isOauth: false,
        },
        ...configStore.store.config.availableProviders,
    ] as {
        provider: string;
        name: string;
        isOauth: boolean;
        description?: string;
    }[];

    /**
     * Method that is called to create the team
     */
    const onSubmit = handleSubmit(async (data: NewTeamForm) => {
        try {
            const newResponse =
                data.TEAM_TYPE === 'Custom'
                    ? monolithStore.addTeam(
                          data.TEAM_NAME,
                          data.TEAM_DESCRIPTION,
                          true,
                      )
                    : monolithStore.addTeam(
                          data.TEAM_NAME,
                          data.TEAM_DESCRIPTION,
                          false,
                          data.TEAM_TYPE,
                      );

            // create the team
            newResponse.then(() => {
                onClose({
                    id: data.TEAM_NAME,
                    type: data.TEAM_TYPE,
                    description: data.TEAM_DESCRIPTION,
                });

                reset();

                notification.add({
                    color: 'success',
                    message: 'Successfully added group',
                });
            });
        } catch (e) {
            console.error(e);
            notification.add({
                color: 'error',
                message: e,
            });
        } finally {
            // close the modal
        }
    });

    return (
        <Modal open={open} fullWidth>
            <StyledModalTitle>
                <>Create New Team</>
                <IconButton
                    onClick={() => {
                        onClose();
                    }}
                >
                    <Close />
                </IconButton>
            </StyledModalTitle>
            <form onSubmit={onSubmit}>
                <Modal.Content>
                    <Stack direction="column" spacing={2}>
                        <Box>
                            <Controller
                                name={'TEAM_TYPE'}
                                control={control}
                                rules={{
                                    required: 'Please select a team type',
                                }}
                                render={({ field, fieldState: { error } }) => {
                                    return (
                                        <Select
                                            label={'Type*'}
                                            fullWidth={true}
                                            error={!!error}
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                        >
                                            {loginTypes
                                                .sort()
                                                .filter(
                                                    (p) =>
                                                        ![
                                                            'native',
                                                            'registration',
                                                        ].includes(p.provider),
                                                )
                                                .map((p, idx) => {
                                                    return (
                                                        <StyledSelectItem
                                                            key={idx}
                                                            value={p.provider}
                                                            type={p.provider}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    display:
                                                                        'flex',
                                                                    flexDirection:
                                                                        'row',
                                                                    alignItems:
                                                                        'center',
                                                                    gap: '24px',
                                                                }}
                                                            >
                                                                {TypeImageObject[
                                                                    p.provider
                                                                ] ? (
                                                                    <img
                                                                        src={
                                                                            TypeImageObject[
                                                                                p
                                                                                    .provider
                                                                            ]
                                                                        }
                                                                        style={{
                                                                            height: '24px',
                                                                            width: '24px',
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <StyledIcon />
                                                                )}
                                                                <>{p.name}</>
                                                                {p.description && (
                                                                    <StyledMenuItemDesc
                                                                        variant={
                                                                            'caption'
                                                                        }
                                                                    >
                                                                        <em>
                                                                            {
                                                                                p.description
                                                                            }
                                                                        </em>
                                                                    </StyledMenuItemDesc>
                                                                )}
                                                            </Box>
                                                        </StyledSelectItem>
                                                    );
                                                })}
                                        </Select>
                                    );
                                }}
                            />
                        </Box>
                        <Box>
                            <Controller
                                name={'TEAM_NAME'}
                                control={control}
                                rules={{ required: true }}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label="Name"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                            fullWidth={true}
                                        />
                                    );
                                }}
                            />
                        </Box>

                        <Box>
                            <Controller
                                name={'TEAM_DESCRIPTION'}
                                control={control}
                                rules={{}}
                                render={({ field }) => {
                                    return (
                                        <TextField
                                            label="Description"
                                            value={
                                                field.value ? field.value : ''
                                            }
                                            onChange={(value) =>
                                                field.onChange(value)
                                            }
                                            fullWidth={true}
                                        />
                                    );
                                }}
                            />
                        </Box>
                    </Stack>
                </Modal.Content>
                <Modal.Actions>
                    <Stack
                        direction="row"
                        spacing={1}
                        paddingX={2}
                        paddingBottom={2}
                    >
                        <Button
                            type="button"
                            onClick={() => {
                                onClose();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant={'contained'}
                            disabled={!isValid}
                        >
                            Add
                        </Button>
                    </Stack>
                </Modal.Actions>
            </form>
        </Modal>
    );
};
