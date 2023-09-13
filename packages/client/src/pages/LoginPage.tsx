import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useLocation, Location } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';

import {
    styled,
    Alert,
    Button,
    Stack,
    Snackbar,
    LinearProgress,
    TextField,
    Typography,
    Paper,
    Divider,
    Box,
} from '@semoss/ui';

import { useRootStore } from '@/hooks';
import MS from '@/assets/img/ms.png';

const StyledContainer = styled('div')(({ theme }) => ({
    padding: theme.spacing(4),
    width: '610px',
}));

const StyledPaper = styled(Box)(({ theme }) => ({
    display: 'flex',
    width: '610px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '32px',
    paddingLeft: '144px',
    paddingTop: '175px',
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

interface TypeUserLogin {
    USERNAME: string;
    PASSWORD: string;
}

/**
 * LoginPage
 */
export const LoginPage = observer(() => {
    const { configStore } = useRootStore();

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
            <Stack direction="row">
                <Stack alignItems={'center'} justifyContent={'center'}>
                    <StyledContainer>
                        <StyledPaper variant={'elevation'} elevation={2} square>
                            <Stack spacing={3}>
                                <Typography variant="h5">Login</Typography>
                                {error && <Alert color="error">{error}</Alert>}
                                {providers.indexOf('native') > -1 && (
                                    <>
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
                                            <Button
                                                fullWidth
                                                variant={'contained'}
                                                onClick={login}
                                            >
                                                SIGN IN
                                            </Button>
                                        </Stack>
                                    </>
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
                <div>Hello</div>
            </Stack>
        </>
    );
});
