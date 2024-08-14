import { Component, ErrorInfo, ReactNode } from 'react';
import { styled, Alert, Typography } from '@semoss/ui';
import Error from '@/assets/img/Error.svg';

const StyledContainer = styled('div')(({ theme }) => ({
    position: 'absolute',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledImg = styled('img')(() => ({
    height: '25%',
    maxHeight: '200px',
}));

const StyledAlert = styled(Alert)(({ theme }) => ({
    marginTop: theme.spacing(2),
}));

interface ErrorBoundaryProps {
    /**
     * Title of the boundary
     **/
    title?: string;

    /**
     * Description of the boundary
     **/
    description?: string;

    /**
     * Component that will be rendered if errored.
     */
    fallback?: ReactNode;

    children?: ReactNode;
}

interface ErrorBoundaryState {
    error: Error | null;
    hasError: boolean;
}

export class ErrorBoundary extends Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    public state: ErrorBoundaryState = {
        error: null,
        hasError: false,
    };

    /**
     * Update state so the next render will show the fallback UI.
     */
    public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            error: error,
        };
    }

    /**
     * Catch the error an log it
     */
    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            // render nothing if its passed in as "null"
            if (this.props.fallback === null || this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <StyledContainer>
                    <StyledImg src={Error} />
                    {this.props.title ? (
                        <Typography variant="h6">{this.props.title}</Typography>
                    ) : null}

                    {this.props.description ? (
                        <Typography variant="body2">
                            {this.props.description}
                        </Typography>
                    ) : null}
                    {this.state.error ? (
                        <StyledAlert severity="error" variant={'filled'}>
                            {this.state.error.message}
                        </StyledAlert>
                    ) : null}
                </StyledContainer>
            );
        }

        return this.props.children;
    }
}
