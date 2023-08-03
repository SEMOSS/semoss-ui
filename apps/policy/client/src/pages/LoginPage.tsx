import { useState } from 'react';
import { Navigate, useLocation, Location } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
    styled,
    Alert,
    Button,
    Stack,
    LinearProgress,
    TextField,
    Typography,
    Paper,
    Divider,
    Snackbar,
} from '@semoss/ui';
import { useInsight } from '@semoss/sdk';

import MS from '@/assets/img/ms.png';

const StyledContainer = styled('div')(({ theme }) => ({
    padding: theme.spacing(4),
    maxWidth: '600px',
    width: '100%',
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    width: '100%',
}));

const StyledAction = styled(Button)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1),
    overflow: 'hidden',
}));

const StyledActionImage = styled('img')(({ theme }) => ({
    height: theme.spacing(4),
}));

const StyledActionText = styled('span')(() => ({
    flex: '1',
}));

// const StyledActionText2 = StyledOld(Typography, {
//     flex: '1',
//     textAlign: 'left',
//     overflow: 'hidden',
//     whiteSpace: 'nowrap',
//     textOverflow: 'ellipsis',
//     color: theme.colors['grey-1'],
//     fontSize: theme.fontSizes.sm,
// });

/**
 * LoginPage
 */
export const LoginPage = () => {
    const { system, actions, isAuthorized } = useInsight();

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
        },
    });

    const location = useLocation();

    // get the path the user is coming from
    const path = (location.state as { from: Location })?.from?.pathname || '/';

    /**
     * Allow the user to login
     */
    const login = handleSubmit(
        async (data: { USERNAME: string; PASSWORD: string }) => {
            // reset error
            setError('');

            // turn on loading
            setIsLoading(true);

            if (!data.USERNAME || !data.PASSWORD) {
                setError('Username and Password is Required');

                // turn of loading
                setIsLoading(false);
                return;
            }

            actions
                .login({
                    type: 'native',
                    username: data.USERNAME,
                    password: data.PASSWORD,
                })
                .then(() => {
                    // turn of loading
                    setIsLoading(false);

                    setSnackbar({
                        open: true,
                        message: `Successfully logged in`,
                        color: 'success',
                    });
                })
                .catch((error) => {
                    let message = '';
                    if (error.message) {
                        message = error.message;
                    } else {
                        message = 'Invalid username/password';
                    }

                    setError(message);

                    setSnackbar({
                        open: true,
                        message: message,
                        color: 'error',
                    });

                    // turn of loading
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

        await actions
            .login({
                type: 'oauth',
                provider: provider,
            })
            .then(() => {
                // turn off loading
                setIsLoading(false);

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

    // if security is not enabled or we are logged in, skip
    if (isAuthorized) {
        return <Navigate to={path} replace />;
    }

    // get the proviers
    const providers = [...system.config.providers, 'ms'];

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

            <Stack alignItems={'center'} justifyContent={'center'}>
                <StyledContainer>
                    <StyledPaper variant={'elevation'} elevation={2} square>
                        <Stack spacing={3}>
                            <Typography variant="h5">Login</Typography>
                            {error && <Alert color="error">{error}</Alert>}
                            {providers.indexOf('native') > -1 && (
                                <form>
                                    <Stack spacing={2}>
                                        <Controller
                                            name={'USERNAME'}
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => {
                                                return (
                                                    <TextField
                                                        label="Username"
                                                        variant="outlined"
                                                        autoComplete="username"
                                                        fullWidth
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                );
                                            }}
                                        />
                                        <Controller
                                            name={'PASSWORD'}
                                            control={control}
                                            rules={{ required: true }}
                                            render={({ field }) => {
                                                return (
                                                    <TextField
                                                        label="Password"
                                                        variant="outlined"
                                                        type="password"
                                                        autoComplete="current-password"
                                                        fullWidth
                                                        value={
                                                            field.value
                                                                ? field.value
                                                                : ''
                                                        }
                                                        onChange={(e) =>
                                                            field.onChange(
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                );
                                            }}
                                        />
                                        <Button
                                            fullWidth
                                            variant={'contained'}
                                            onClick={login}
                                        >
                                            SIGN IN
                                        </Button>
                                    </Stack>
                                </form>
                            )}
                            {providers.indexOf('native') > -1 &&
                                providers.indexOf('ms') > -1 && (
                                    <>
                                        <Divider />
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
                                    <StyledActionImage src={MS} />
                                    <StyledActionText>
                                        Microsoft
                                    </StyledActionText>
                                </StyledAction>
                            )}
                        </Stack>
                    </StyledPaper>
                    {isLoading && <LinearProgress />}
                </StyledContainer>
            </Stack>
        </>
    );
};
