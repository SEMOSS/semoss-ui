import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useLocation, Location, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { THEME } from '@/constants';
import GRAPHIC from '@/assets/login_graphic.png';

import {
    styled,
    Alert,
    Button,
    Stack,
    Snackbar,
    LinearProgress,
    TextField,
    Typography,
    Checkbox,
    Divider,
    Box,
    ButtonGroup,
    Modal,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import MS from '@/assets/img/ms.png';
import GOOGLE from '@/assets/img/google.png';

const StyledContainer = styled('div')(({ theme }) => ({
    padding: theme.spacing(4),
    width: '610px',
}));

const StyledRememberBox = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
});

const StyledBox = styled(Box)({
    display: 'flex',
    width: '610px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '32px',
    paddingLeft: '50px',
});

const StyledAction = styled(Button)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
});

const StyledActionBox = styled(Button)({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '4px',
});

const StyledActionImage = styled('img')(({ theme }) => ({
    height: theme.spacing(3),
}));

const StyledLogo = styled('img')({});

const StyledActionText = styled('span')(() => ({
    fontFamily: 'Inter',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '24px',
    letterSpacing: '0.4px',
    color: '#000',
}));

const StyledDividerBox = styled(Box)({
    color: '#000',
    fontFeatureSettings: '"clig" off, "liga" off',
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 700,
    lineHeight: '150%' /* 24px */,
    letterSpacing: ' 0.15px',
});

const StyledButtonGroup = styled(ButtonGroup)({
    '.MuiButtonGroup-grouped': {
        borderColor: '#fff',
    },
});

const StyledRegisterNowBox = styled(Box)({
    display: 'flex',
    align: 'center',
    alignItems: 'center',
    justifyContent: 'center',
});

const StyledLogoBox = styled(Box)({
    display: 'flex',
    align: 'center',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '16px',
});

const StyledLogoText = styled('span')(() => ({
    fontFeatureSettings: '"clig" off, "liga" off',
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '150%',
    letterSpacing: '0.15px',
}));

const StyledButtonText = styled(Button)({
    fontFamily: 'Inter',
    fontSize: '15px',
    fontStyle: 'normal',
    fontWeight: 600,
    lineHeight: '26px' /* 173.333% */,
    letterSpacing: '0.46px',
});

const StyledGoBackBox = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
});

interface TypeUserLogin {
    USERNAME: string;
    PASSWORD: string;
    REMEMBER_LOGIN: boolean;
    OTP_CONFIRM: string;
}

interface TypeUserRegister {
    FIRST_NAME: '';
    LAST_NAME: '';
    USERNAME: '';
    EMAIL: '';
    PHONE: '';
    EXTENTION: '';
    COUNTRY_CODE: '';
    PASSWORD: '';
    PASSWORD_CONFIRMATION: '';
}

/**
 * LoginPage
 */
export const LoginPage = observer(() => {
    const { configStore } = useRootStore();

    const [forgotPassword, setForgotPassword] = useState(false);
    const [loginType, setLoginType] = useState('Native');
    const [register, setRegister] = useState(false);
    const [showOTPCodeField, setShowOTPCodeField] = useState(false);
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        color: 'success' | 'info' | 'warning' | 'error';
    }>({
        open: false,
        message: '',
        color: 'success',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { control, handleSubmit } = useForm({
        defaultValues: {
            USERNAME: '',
            PASSWORD: '',
            REMEMBER_LOGIN: false,
            OTP_CONFIRM: '',
        },
    });

    const { control: registerControl, handleSubmit: registerSubmit } = useForm({
        defaultValues: {
            FIRST_NAME: '',
            LAST_NAME: '',
            USERNAME: '',
            EMAIL: '',
            PHONE: '',
            EXTENTION: '',
            COUNTRY_CODE: '',
            PASSWORD: '',
            PASSWORD_CONFIRMATION: '',
        },
    });

    const location = useLocation();
    const navigate = useNavigate();

    /**
     * Allow the user to login
     */
    const login = handleSubmit(
        async (data: TypeUserLogin): Promise<TypeUserLogin> => {
            // turn on loading
            setIsLoading(true);

            if (!data.USERNAME || !data.PASSWORD) {
                setError('Username and Password is Required');
                return;
            }

            if (!showOTPCodeField) {
                if (loginType === 'Native') {
                    await configStore
                        .login(data.USERNAME, data.PASSWORD)
                        .then(() => {
                            // noop
                        })
                        .catch((error) => {
                            setError(error.message);
                        })
                        .finally(() => {
                            // turn off loading
                            setIsLoading(false);
                        });
                }
                if (loginType === 'LDAP') {
                    await configStore
                        .loginLDAP(data.USERNAME, data.PASSWORD)
                        .then(() => {
                            // noop
                        })
                        .catch((error) => {
                            setError(error.message);
                        })
                        .finally(() => {
                            // turn off loading
                            setIsLoading(false);
                        });
                }
                if (loginType === 'LinOTP') {
                    await configStore
                        .loginOTP(data.USERNAME, data.PASSWORD)
                        .then(() => {
                            // noop
                        })
                        .catch((error) => {
                            setError(error.message);
                        })
                        .finally(() => {
                            // turn off loading
                            setIsLoading(false);
                        });
                    setShowOTPCodeField(true);
                }
            }
            if (showOTPCodeField) {
                await configStore
                    .confirmOTP(data.OTP_CONFIRM)
                    .then(() => {
                        // noop
                    })
                    .catch((error) => {
                        setError(error.message);
                    })
                    .finally(() => {
                        // turn off loading
                        setIsLoading(false);
                    });
                setShowOTPCodeField(true);
            }
        },
    );

    /**
     * Allow the user to login
     */
    const registerAccount = registerSubmit(
        async (data: TypeUserRegister): Promise<TypeUserRegister> => {
            // turn on loading
            setIsLoading(true);

            if (
                !data.USERNAME ||
                !data.PASSWORD ||
                !data.PASSWORD_CONFIRMATION ||
                !data.FIRST_NAME ||
                !data.LAST_NAME ||
                !data.EMAIL
            ) {
                setError(
                    'Username, password, password confirmation, email, first and last name are required',
                );
                return;
            }

            if (data.PASSWORD !== data.PASSWORD_CONFIRMATION) {
                setError('Passwords do not match');
                return;
            }

            const response = await configStore
                .register(
                    `${data.FIRST_NAME} ${data.LAST_NAME}`,
                    data.USERNAME,
                    data.EMAIL,
                    data.PASSWORD,
                    data.PHONE,
                    data.EXTENTION,
                    data.COUNTRY_CODE,
                )
                .then(() => {
                    // noop
                })
                .catch((error) => {
                    setError(error.message);
                })
                .finally(() => {
                    // turn off loading
                    setIsLoading(false);
                    navigate('/');
                });
        },
    );

    /**
     * Login with oauth
     * @param provider - provider to oauth with
     */
    const oauth = async (provider: string) => {
        // turn on loading
        setIsLoading(true);

        await configStore
            .oauth(provider)
            .then(() => {
                // turn off loading
                setIsLoading(false);

                // noop
                // (handled  by the configStore)

                setSnackbar({
                    open: true,
                    message: `Successfully logged in`,
                    color: 'success',
                });
            })
            .catch((error) => {
                // turn off loading
                setIsLoading(false);

                setError(error.message);

                setSnackbar({
                    open: true,
                    message: error.message,
                    color: 'error',
                });
            });
    };

    // get the path the user is coming from
    const path = (location.state as { from: Location })?.from?.pathname || '/';

    // navigate if already logged in
    if (configStore.store.status === 'SUCCESS') {
        return <Navigate to={path} replace />;
    }

    // get the proviers
    const providers = [...configStore.store.config.providers, 'ms'];

    return (
        <>
            <Snackbar
                open={snackbar.open}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                autoHideDuration={6000}
                onClose={() => {
                    setSnackbar({
                        open: false,
                        message: '',
                        color: 'success',
                    });
                }}
            >
                <Alert severity={snackbar.color} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
            <Stack direction="row" spacing={16}>
                <Stack alignItems={'center'} justifyContent={'center'}>
                    <StyledContainer>
                        <StyledBox>
                            <Stack spacing={3} sx={{ width: '100%' }}>
                                <Stack spacing={0}>
                                    <StyledLogoBox>
                                        <StyledLogo
                                            src={THEME.logo}
                                            sx={{
                                                /* or to blue */
                                                filter: 'invert(0.5) sepia(1) saturate(5) hue-rotate(175deg)',
                                            }}
                                        />{' '}
                                        <StyledLogoText>SeMOSS</StyledLogoText>
                                    </StyledLogoBox>
                                    <Typography variant="h4">
                                        Welcome!
                                    </Typography>
                                    <Typography variant="body1">
                                        {register
                                            ? 'Register below'
                                            : 'Log in below'}
                                    </Typography>
                                </Stack>
                                {!register && (
                                    <StyledButtonGroup variant="outlined">
                                        <ButtonGroup.Item
                                            onClick={() =>
                                                setLoginType('Native')
                                            }
                                            sx={{
                                                backgroundColor:
                                                    loginType === 'Native'
                                                        ? '#0471F0'
                                                        : '#fff',
                                                color:
                                                    loginType === 'Native'
                                                        ? '#fff'
                                                        : '#0471F0',
                                                ':hover': {
                                                    bgcolor:
                                                        loginType === 'Native'
                                                            ? '#0471F0'
                                                            : 'transparent',
                                                    color:
                                                        loginType === 'Native'
                                                            ? '#fff'
                                                            : '#0471F0',
                                                    borderColor: '#fff',
                                                },
                                            }}
                                        >
                                            Native
                                        </ButtonGroup.Item>
                                        <ButtonGroup.Item
                                            onClick={() => setLoginType('LDAP')}
                                            sx={{
                                                backgroundColor:
                                                    loginType === 'LDAP'
                                                        ? '#0471F0'
                                                        : '#fff',
                                                color:
                                                    loginType === 'LDAP'
                                                        ? '#fff'
                                                        : '#0471F0',
                                                ':hover': {
                                                    bgcolor:
                                                        loginType === 'LDAP'
                                                            ? '#0471F0'
                                                            : 'transparent',
                                                    color:
                                                        loginType === 'LDAP'
                                                            ? '#fff'
                                                            : '#0471F0',
                                                    borderColor: '#fff',
                                                },
                                            }}
                                        >
                                            LDAP
                                        </ButtonGroup.Item>
                                        <ButtonGroup.Item
                                            onClick={() =>
                                                setLoginType('LinOTP')
                                            }
                                            sx={{
                                                backgroundColor:
                                                    loginType === 'LinOTP'
                                                        ? '#0471F0'
                                                        : '#fff',
                                                color:
                                                    loginType === 'LinOTP'
                                                        ? '#fff'
                                                        : '#0471F0',
                                                ':hover': {
                                                    bgcolor:
                                                        loginType === 'LinOTP'
                                                            ? '#0471F0'
                                                            : 'transparent',
                                                    color:
                                                        loginType === 'LinOTP'
                                                            ? '#fff'
                                                            : '#0471F0',
                                                    borderColor: '#fff',
                                                },
                                            }}
                                        >
                                            LinOTP
                                        </ButtonGroup.Item>
                                    </StyledButtonGroup>
                                )}
                                {error && <Alert color="error">{error}</Alert>}
                                {providers.indexOf('native') > -1 && (
                                    <>
                                        <Stack spacing={2}>
                                            {!showOTPCodeField && register && (
                                                <>
                                                    <Controller
                                                        name={'FIRST_NAME'}
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: true,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="First Name"
                                                                    variant="outlined"
                                                                    size="small"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={'LAST_NAME'}
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: true,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Last Name"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={'USERNAME'}
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: true,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Username"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={'EMAIL'}
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: true,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Email"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={'PHONE'}
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: false,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Phone Number"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={'EXTENTION'}
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: false,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Phone Extention"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={'COUNTRY_CODE'}
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: false,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Country Code"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={'PASSWORD'}
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: true,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Password"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    type="password"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={
                                                            'PASSWORD_CONFIRMATION'
                                                        }
                                                        control={
                                                            registerControl
                                                        }
                                                        rules={{
                                                            required: true,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Password Confirmation"
                                                                    size="small"
                                                                    variant="outlined"
                                                                    type="password"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <StyledGoBackBox>
                                                        <Button
                                                            fullWidth
                                                            variant={'text'}
                                                            onClick={() =>
                                                                setRegister(
                                                                    false,
                                                                )
                                                            }
                                                        >
                                                            Go Back
                                                        </Button>
                                                        <Button
                                                            fullWidth
                                                            variant={
                                                                'contained'
                                                            }
                                                            onClick={
                                                                registerAccount
                                                            }
                                                        >
                                                            Register Account
                                                        </Button>
                                                    </StyledGoBackBox>
                                                </>
                                            )}
                                            {!showOTPCodeField && !register && (
                                                <>
                                                    <Controller
                                                        name={'USERNAME'}
                                                        control={control}
                                                        rules={{
                                                            required: true,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Username"
                                                                    variant="outlined"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                    <Controller
                                                        name={'PASSWORD'}
                                                        control={control}
                                                        rules={{
                                                            required: true,
                                                        }}
                                                        render={({ field }) => {
                                                            return (
                                                                <TextField
                                                                    label="Password"
                                                                    variant="outlined"
                                                                    type="password"
                                                                    fullWidth
                                                                    value={
                                                                        field.value
                                                                            ? field.value
                                                                            : ''
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        field.onChange(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        )
                                                                    }
                                                                />
                                                            );
                                                        }}
                                                    />
                                                </>
                                            )}
                                            {showOTPCodeField && (
                                                <Controller
                                                    name={'OTP_CONFIRM'}
                                                    control={control}
                                                    rules={{
                                                        required: true,
                                                    }}
                                                    render={({ field }) => {
                                                        return (
                                                            <TextField
                                                                label="OTP Confirmation Code"
                                                                variant="outlined"
                                                                fullWidth
                                                                value={
                                                                    field.value
                                                                        ? field.value
                                                                        : ''
                                                                }
                                                                onChange={(e) =>
                                                                    field.onChange(
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        );
                                                    }}
                                                />
                                            )}
                                            {!register && (
                                                <>
                                                    <StyledRememberBox>
                                                        <Controller
                                                            name={
                                                                'REMEMBER_LOGIN'
                                                            }
                                                            control={control}
                                                            rules={{
                                                                required: false,
                                                            }}
                                                            render={({
                                                                field,
                                                            }) => {
                                                                return (
                                                                    <Checkbox
                                                                        label="Keep me logged in"
                                                                        checked={
                                                                            field.value
                                                                        }
                                                                        value={
                                                                            field.value
                                                                                ? field.value
                                                                                : false
                                                                        }
                                                                        onChange={(
                                                                            e: React.ChangeEvent<HTMLInputElement>,
                                                                        ) =>
                                                                            field.onChange(
                                                                                e
                                                                                    .target
                                                                                    .checked,
                                                                            )
                                                                        }
                                                                    />
                                                                );
                                                            }}
                                                        />
                                                        <StyledButtonText
                                                            variant="text"
                                                            onClick={() =>
                                                                setForgotPassword(
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            Forgot Password
                                                        </StyledButtonText>
                                                    </StyledRememberBox>
                                                    <Button
                                                        fullWidth
                                                        variant={'contained'}
                                                        onClick={login}
                                                    >
                                                        Login with {loginType}
                                                    </Button>
                                                    <StyledRegisterNowBox>
                                                        Don&apos;t have an
                                                        account?{' '}
                                                        <StyledButtonText
                                                            variant="text"
                                                            onClick={() =>
                                                                setRegister(
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            Register Now
                                                        </StyledButtonText>
                                                    </StyledRegisterNowBox>
                                                    {providers.indexOf(
                                                        'native',
                                                    ) > -1 &&
                                                        providers.indexOf(
                                                            'ms',
                                                        ) > -1 && (
                                                            <>
                                                                <Divider>
                                                                    <StyledDividerBox>
                                                                        or
                                                                    </StyledDividerBox>
                                                                </Divider>
                                                            </>
                                                        )}
                                                    {providers.indexOf('ms') >
                                                        -1 && (
                                                        <StyledAction
                                                            variant="outlined"
                                                            onClick={() => {
                                                                oauth('ms');
                                                            }}
                                                            fullWidth
                                                        >
                                                            <StyledActionBox>
                                                                <StyledActionImage
                                                                    src={MS}
                                                                />
                                                                <StyledActionText>
                                                                    Microsoft
                                                                </StyledActionText>
                                                            </StyledActionBox>
                                                        </StyledAction>
                                                    )}
                                                    {providers.indexOf(
                                                        'google',
                                                    ) > -1 && (
                                                        <StyledAction
                                                            variant="outlined"
                                                            onClick={() => {
                                                                oauth('google');
                                                            }}
                                                            fullWidth
                                                        >
                                                            <StyledActionBox>
                                                                <StyledActionImage
                                                                    src={GOOGLE}
                                                                />
                                                                <StyledActionText>
                                                                    Google
                                                                </StyledActionText>
                                                            </StyledActionBox>
                                                        </StyledAction>
                                                    )}
                                                </>
                                            )}
                                        </Stack>
                                    </>
                                )}
                            </Stack>
                        </StyledBox>
                        {isLoading && <LinearProgress />}
                    </StyledContainer>
                </Stack>
                <StyledActionImage
                    sx={{
                        width: '100%',
                        height: '100vh',
                    }}
                    src={GRAPHIC}
                />
            </Stack>
            <Modal
                open={forgotPassword}
                maxWidth={'md'}
                onClose={() => {
                    setForgotPassword(false);
                }}
            >
                <Modal.Title>Forgot your password?</Modal.Title>
                <Modal.Content>
                    <Box>
                        Please contact your administrator to reset password.
                    </Box>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant={'outlined'}
                        onClick={() => {
                            setForgotPassword(false);
                        }}
                    >
                        Ok
                    </Button>
                </Modal.Actions>
            </Modal>
        </>
    );
});
