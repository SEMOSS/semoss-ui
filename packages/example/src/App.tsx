import React from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';

import { HomePage } from './HomePage';

export const App = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
            </Routes>
        </HashRouter>
    );
};
