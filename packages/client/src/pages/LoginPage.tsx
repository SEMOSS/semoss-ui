import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useLocation, Location } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { THEME } from '@/constants';
import GIF from '@/assets/img/login-gif.gif';

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

const StyledMain = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: theme.palette.background.paper,
}));

const StyledRow = styled('div')(() => ({
    flex: '1',
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
}));

const StyledProgress = styled(LinearProgress)(() => ({
    width: '100%',
}));

const StyledScroll = styled('div')(({ theme }) => ({
    flexShrink: 0,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 1,
    background: theme.palette.background.paper,
    overflowY: 'auto',
    overflowX: 'hidden',
    [theme.breakpoints.down('md')]: {
        height: '100%',
        width: '100%',
    },
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    width: '610px',
    marginTop: theme.spacing(18), // 144px
    marginBottom: theme.spacing(2), // 16px
    marginLeft: theme.spacing(13.5), // 108px
    marginRight: theme.spacing(13.5), // 108px
    [theme.breakpoints.down('md')]: {
        margin: 0,
        padding: theme.spacing(4),
        maxWidth: '610px',
        width: '100%',
    },
}));

const StyledGradient = styled('div')(({ theme }) => ({
    height: '100%',
    width: theme.spacing(42), // 336px
    background:
        'linear-gradient(90deg, #FFF 0%, rgba(255, 255, 255, 0.00) 100%)',
    zIndex: 1,
}));

const StyledImageHolder = styled('div')(() => ({
    position: 'absolute',
    top: '0px',
    right: '0px',
    bottom: '0px',
    overflow: 'hidden',
    zIndex: 0,
}));

const StyledImage = styled('img')(() => ({
    height: '100%',
    // width: '100%',
    objectFit: 'cover',
}));

const StyledRememberBox = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
});

const StyledAction = styled(Button)({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
});

const StyledActionBox = styled('div')({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '4px',
});

const StyledActionImage = styled('img')(({ theme }) => ({
    height: theme.spacing(3),
}));

const StyledActionText = styled('span')(() => ({
    fontFamily: 'Inter',
    fontSize: '14px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '24px',
    letterSpacing: '0.4px',
    color: '#000',
}));

const StyledDivider = styled(Divider)({
    background: 'transparent',
});

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

const StyledButtonGroupItem = styled(ButtonGroup.Item, {
    shouldForwardProp: (prop) => prop !== 'selected',
})<{
    /** Track if Button is selected */
    selected: boolean;
}>(({ theme, selected }) => ({
    color: selected ? theme.palette.common.white : theme.palette.primary.main,
    backgroundColor: selected
        ? theme.palette.primary.main
        : theme.palette.common.white,
    '&:hover': {
        backgroundColor: selected ? theme.palette.primary.dark : '',
        borderColor: theme.palette.common.white,
    },
}));

const StyledRegisterNowBox = styled(Box)({
    display: 'flex',
    align: 'center',
    alignItems: 'center',
    justifyContent: 'center',
});

const StyledLogo = styled('img')(({ theme }) => ({
    width: theme.spacing(3),
}));

const StyledLogoBox = styled('div')(({ theme }) => ({
    display: 'flex',
    align: 'center',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(4),
}));

const StyledLogoText = styled('span')(() => ({
    fontFeatureSettings: '"clig" off, "liga" off',
    fontFamily: 'Inter',
    fontSize: '16px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '150%',
    letterSpacing: '0.15px',
}));

const StyledInstructions = styled(Typography)(({ theme }) => ({
    marginBottom: theme.spacing(4),
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
    const location = useLocation();

    const [forgotPassword, setForgotPassword] = useState(false);
    const [loginType, setLoginType] = useState<string>('');
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
    const [success, setSuccess] = useState('');
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

    useEffect(() => {
        // set initial selected login type from config.
        if (configStore.store.config.providers.includes('native')) {
            setLoginType('native');
        } else if (configStore.store.config.providers.includes('ldap')) {
            setLoginType('ldap');
        } else if (configStore.store.config.providers.includes('linOtp')) {
            setLoginType('LinOTP');
        }
    }, []);

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
                if (loginType === 'native') {
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
                if (loginType === 'ldap') {
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
                            setShowOTPCodeField(true);
                        })
                        .catch((error) => {
                            setError(error.message);
                        })
                        .finally(() => {
                            // turn off loading
                            setIsLoading(false);
                        });
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
                setIsLoading(false);
                return;
            }

            if (data.PASSWORD !== data.PASSWORD_CONFIRMATION) {
                setError('Passwords do not match');
                setIsLoading(false);
                return;
            }

            await configStore
                .register(
                    `${data.FIRST_NAME} ${data.LAST_NAME}`,
                    data.USERNAME,
                    data.EMAIL,
                    data.PASSWORD,
                    data.PHONE,
                    data.EXTENTION,
                    data.COUNTRY_CODE,
                )
                .then((res) => {
                    if (res) {
                        setError('');
                        setRegister(false);
                        setSuccess(
                            'Account registration successful. Log in below.',
                        );
                    }
                })
                .catch((error) => {
                    setIsLoading(false);
                    setError(error.message);
                })
                .finally(() => {
                    // turn off loading
                    setIsLoading(false);
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
    const providers = [...configStore.store.config.providers];

    // show the or
    const showOrDivider =
        providers.indexOf('native') > -1 &&
        (providers.indexOf('ms') || providers.indexOf('google'));

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
            <StyledMain>
                <StyledRow>
                    <StyledScroll>
                        <StyledContent>
                            <div>
                                <StyledLogoBox>
                                    <StyledLogo src={THEME.logo} />
                                    <StyledLogoText>
                                        {THEME.name}
                                    </StyledLogoText>
                                </StyledLogoBox>
                                <Typography variant="h4">Welcome!</Typography>
                                <StyledInstructions variant="body1">
                                    {register
                                        ? 'Register below'
                                        : 'Log in below'}
                                </StyledInstructions>
                            </div>
                            {!register && (
                                <StyledButtonGroup variant="outlined">
                                    {configStore.store.config.providers.includes(
                                        'native',
                                    ) && (
                                        <StyledButtonGroupItem
                                            onClick={() => {
                                                setLoginType('Native');
                                                setSuccess('');
                                                setError('');
                                            }}
                                            selected={loginType === 'native'}
                                        >
                                            Native
                                        </StyledButtonGroupItem>
                                    )}
                                    {configStore.store.config.providers.includes(
                                        'ldap',
                                    ) && (
                                        <StyledButtonGroupItem
                                            onClick={() => {
                                                setLoginType('LDAP');
                                                setSuccess('');
                                                setError('');
                                            }}
                                            selected={loginType === 'ldap'}
                                        >
                                            LDAP
                                        </StyledButtonGroupItem>
                                    )}
                                    {configStore.store.config.providers.includes(
                                        'linotp',
                                    ) && (
                                        <StyledButtonGroupItem
                                            onClick={() => {
                                                setLoginType('LinOTP');
                                                setSuccess('');
                                                setError('');
                                            }}
                                            selected={loginType === 'linotp'}
                                        >
                                            LinOTP
                                        </StyledButtonGroupItem>
                                    )}
                                </StyledButtonGroup>
                            )}
                            {error && <Alert color="error">{error}</Alert>}
                            {success && (
                                <Alert color="success">{success}</Alert>
                            )}
                            <form>
                                <Stack spacing={2}>
                                    {providers.indexOf('native') > -1 && (
                                        <>
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
                                                                    error={error.includes(
                                                                        'is not a valid email address',
                                                                    )}
                                                                    helperText={
                                                                        error.includes(
                                                                            'is not a valid email address',
                                                                        ) &&
                                                                        'Please enter a valid email'
                                                                    }
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
                                                                    error={
                                                                        error.includes(
                                                                            'Passwords do not match',
                                                                        ) ||
                                                                        error.includes(
                                                                            'Password must be at least 8 characters in length',
                                                                        ) ||
                                                                        error.includes(
                                                                            'Password must have atleast one uppercase character',
                                                                        ) ||
                                                                        error.includes(
                                                                            'Password must have atleast one lowercase character',
                                                                        ) ||
                                                                        error.includes(
                                                                            'Password must have atleast one special character among [!,@,#,$,%,^,&,*]',
                                                                        )
                                                                    }
                                                                    helperText={
                                                                        error &&
                                                                        (error.includes(
                                                                            'Password must be at least 8 characters in length',
                                                                        ) ||
                                                                            error.includes(
                                                                                'Password must have atleast one uppercase character',
                                                                            ) ||
                                                                            error.includes(
                                                                                'Password must have atleast one lowercase character',
                                                                            ) ||
                                                                            error.includes(
                                                                                'Password must have atleast one special character among [!,@,#,$,%,^,&,*]',
                                                                            ) ||
                                                                            error.includes(
                                                                                'Password must have atleast one special character among [!,@,#,$,%,^,&,*]',
                                                                            ))
                                                                            ? error.includes(
                                                                                  'Passwords do no match',
                                                                              )
                                                                                ? 'Passwords do not match'
                                                                                : 'Passwords must be at least 8 characters in length and contain one lowercase, one uppercase, one special character.'
                                                                            : ''
                                                                    }
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
                                                                    error={
                                                                        error.includes(
                                                                            'Passwords do not match',
                                                                        ) ||
                                                                        error.includes(
                                                                            'Password must be at least 8 characters in length',
                                                                        ) ||
                                                                        error.includes(
                                                                            'Password must have atleast one uppercase character',
                                                                        ) ||
                                                                        error.includes(
                                                                            'Password must have atleast one lowercase character',
                                                                        ) ||
                                                                        error.includes(
                                                                            'Password must have atleast one special character among [!,@,#,$,%,^,&,*]',
                                                                        )
                                                                    }
                                                                    helperText={
                                                                        error.includes(
                                                                            'Passwords do not match',
                                                                        ) &&
                                                                        'Passwords do no match'
                                                                    }
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
                                                        type="submit"
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
                                                </>
                                            )}
                                        </>
                                    )}
                                    {!register && (
                                        <>
                                            {showOrDivider && (
                                                <>
                                                    <StyledDivider>
                                                        <StyledDividerBox>
                                                            or
                                                        </StyledDividerBox>
                                                    </StyledDivider>
                                                </>
                                            )}
                                            {providers.indexOf('ms') > -1 && (
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
                                            {providers.indexOf('google') >
                                                -1 && (
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
                            </form>
                        </StyledContent>
                    </StyledScroll>
                    <StyledGradient />
                    <StyledImageHolder>
                        <StyledImage src={GIF} />
                    </StyledImageHolder>
                </StyledRow>
                {isLoading && <StyledProgress />}
            </StyledMain>
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
