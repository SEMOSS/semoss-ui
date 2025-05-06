import React from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { ErrorBoundary } from './components/common';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
    // <React.StrictMode>
    <ErrorBoundary
        title="Something went wrong!"
        description="We're working hard to fix it. If the issue
                    persists, please reach out and let us know."
    >
        <App />
    </ErrorBoundary>,
    // </React.StrictMode>,
);
