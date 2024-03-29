import { Component, ErrorInfo, ReactNode } from 'react';
import { Typography, styled } from '@semoss/ui';
import Error from '@/assets/img/Error.svg';

const StyledContainer = styled('div')(() => ({
    position: 'fixed',
    inset: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
}));

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(): State {
        // Update state so the next render will show the fallback UI.
        return {
            hasError: true,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <StyledContainer>
                    <img src={Error} height="50%" />
                    <Typography variant="h6">Something went wrong!</Typography>
                    <Typography variant="body1">
                        We&apos;re working hard to fix it. If the issue
                        persists, please reach out and let us know.
                    </Typography>
                </StyledContainer>
            );
        }

        return this.props.children;
    }
}
