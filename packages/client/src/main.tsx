import React from 'react';
import ReactDOM from 'react-dom';

import { App } from './App';
import { ErrorBoundary } from './components/common';

ReactDOM.render(
    <React.StrictMode>
        <ErrorBoundary
            title="Something went wrong!"
            description="We're working hard to fix it. If the issue
                        persists, please reach out and let us know."
        >
            <App />
        </ErrorBoundary>
    </React.StrictMode>,
    document.getElementById('root'),
);
