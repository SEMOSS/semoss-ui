import React from 'react';
import { Routes, Route, HashRouter } from 'react-router-dom';

import { Ncrt } from './use-cases';

export const App = () => {
    return (
        <HashRouter>
            <Routes>
                <Route path="/" element={<Ncrt />} />
            </Routes>
        </HashRouter>
    );
};
