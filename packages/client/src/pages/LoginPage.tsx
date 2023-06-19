import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useNavigate, useLocation, Location } from 'react-router-dom';
import { useForm } from 'react-hook-form';

import { styled, Form, Button, Grid, Alert, Loading } from '@semoss/components';

import { theme } from '@/theme';
import { useRootStore } from '@/hooks/';
import MS from '@/assets/img/ms.png';
import { Field } from '@/components/form';

const StyledContainer = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const StyledContent = styled('div', {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.md,
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
    borderRadius: theme.radii.default,
    backgroundColor: theme.colors.base,
    overflow: 'hidden',
    gap: theme.space['4'],
    padding: theme.space['8'],
    marginTop: theme.space['16'],
    marginBottom: theme.space['16'],
    maxWidth: '640px',
});

const StyledTitle = styled('h3', {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
});

const StyledMessage = styled('span', {
    textAlign: 'center',
    width: theme.space['full'],
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.sm,
    marginTop: theme.space['4'],
    marginBottom: theme.space['4'],
});

const StyledAction = styled('button', {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space['2'],
    height: theme.space['12'],
    width: theme.space['full'],
    padding: theme.space['2'],
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
    borderRadius: theme.radii.default,
    backgroundColor: theme.colors.base,
    '&:hover': {
        backgroundColor: theme.colors['primary-5'],
    },
});

const StyledActionImage = styled('img', {
    height: theme.space['full'],
});

const StyledActionText = styled('div', {
    flex: '1',
    textAlign: 'left',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.sm,
});

/**
 * LoginPage
 */
export const LoginPage = observer(() => {
    const { configStore } = useRootStore();

    // store the loading
    const [loading, setLoading] = useState(false);

    // store the error message
    const [error, setError] = useState('');

    const { control, handleSubmit } = useForm({
        defaultValues: {
            USERNAME: '',
            PASSWORD: '',
        },
    });

    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Allow the user to login
     */
    const login = handleSubmit(async (data) => {
        // turn on loading
        setLoading(true);

        if (!data.USERNAME || !data.PASSWORD) {
            setError('Username and Password is Required');
            return;
        }

        await configStore
            .login(data.USERNAME, data.PASSWORD)
            .then(() => {
                // turn off loading
                setLoading(false);

                // noop
                // (handled  by the configStore)
            })
            .catch((error) => {
                // turn off loading
                setLoading(false);

                setError(error.message);
            });
    });

    /**
     * Allow the user to use oauth to login
     *
     */
    const oauth = async (provider: string) => {
        // turn on loading
        setLoading(true);

        await configStore
            .oauth(provider)
            .then(() => {
                // turn off loading
                setLoading(false);

                // noop
                // (handled  by the configStore)
            })
            .catch((error) => {
                // turn off loading
                setLoading(false);

                setError(error.message);
            });
    };

    // get the path the user is coming from
    const path = (location.state as { from: Location })?.from?.pathname || '/';

    // navigate if already logged in
    if (configStore.store.status === 'SUCCESS') {
        return <Navigate to={path} replace />;
    }

    // get the proviers
    const providers = configStore.store.config.providers;

    return (
        <StyledContainer>
            <StyledContent>
                {loading && <Loading open={true} message={'Logging In...'} />}
                <StyledTitle>Login</StyledTitle>
                {error && (
                    <Alert color="error" closeable={false}>
                        {error}
                    </Alert>
                )}
                {providers.indexOf('native') > -1 && (
                    <>
                        <Form>
                            <Grid align={'center'}>
                                <Grid.Item>
                                    <Field
                                        name="USERNAME"
                                        control={control}
                                        label={'Username'}
                                        rules={{ required: true }}
                                        options={{ component: 'input' }}
                                    />
                                </Grid.Item>
                                <Grid.Item>
                                    <Field
                                        name="PASSWORD"
                                        control={control}
                                        label={'Password'}
                                        rules={{ required: true }}
                                        options={{
                                            component: 'input',
                                            type: 'password',
                                        }}
                                    />
                                </Grid.Item>
                                <Grid.Item>
                                    <Button block={true} onClick={login}>
                                        Log In
                                    </Button>
                                </Grid.Item>
                            </Grid>
                        </Form>

                        {providers.length > 2 && (
                            <StyledMessage>or</StyledMessage>
                        )}
                    </>
                )}
                {providers.indexOf('ms') > -1 && (
                    <StyledAction
                        title="Microsoft"
                        onClick={() => {
                            oauth('ms');
                        }}
                    >
                        <StyledActionImage src={MS} />
                        <StyledActionText>Microsoft</StyledActionText>
                    </StyledAction>
                )}
                {providers.map((p) => {
                    const title = p;
                    const img = MS;

                    if (p === 'native') {
                        return null;
                    }

                    return (
                        <StyledAction
                            key={p}
                            title={title}
                            onClick={() => {
                                oauth(p);
                            }}
                        >
                            <StyledActionImage src={img} />
                            <StyledActionText>{title}</StyledActionText>
                        </StyledAction>
                    );
                })}
            </StyledContent>
        </StyledContainer>
    );
});
