import { observer } from 'mobx-react-lite';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppPage } from './AppPage';
import { NewAppPage } from './NewAppPage';
import { AddAppPage } from './AddAppPage';
import { AddAppLayout } from './AddAppLayout';

// Fix these
import { NavigatorLayout } from '../NavigatorLayout';

export const AppRouter = observer(() => {
    return (
        <Routes>
            {/* New Apps */}
            <Route
                path="new-old"
                element={
                    <NavigatorLayout>
                        <AddAppLayout />
                    </NavigatorLayout>
                }
            >
                <Route index element={<AddAppPage />}></Route>
                {/* Build with template */}
                {/* <Route path="configure" element={<div></div>}></Route> */}
                {/* <Route path="members" element={<div></div>}></Route>  */}
            </Route>
            <Route
                path="new"
                element={
                    <NavigatorLayout>
                        <NewAppPage />
                    </NavigatorLayout>
                }
            ></Route>
            {/* Already Built App */}
            <Route path=":appId" element={<AppPage />}></Route>
            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
