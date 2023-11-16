import { observer } from 'mobx-react-lite';
import { Outlet, Routes, Route, Navigate } from 'react-router-dom';
import { AppPage } from './AppPage';
import { AddAppPage } from './AddAppPage';
import { AddAppLayout } from './AddAppLayout';
import { PromptGenerator } from '@/components/prompt';

// Fix these
import { NavigatorLayout } from '../NavigatorLayout';

export const AppRouter = observer(() => {
    return (
        <Routes>
            {/* New Apps */}
            <Route
                path="new"
                element={
                    <NavigatorLayout>
                        <AddAppLayout />
                    </NavigatorLayout>
                }
            >
                <Route index element={<AddAppPage />}></Route>
                {/* Build with template */}
                {/* <Route path="build" element={<div>UI Builder</div>}></Route> */}
                {/* <Route path="configure" element={<div></div>}></Route> */}
                {/* <Route path="members" element={<div></div>}></Route>  */}
            </Route>
            {/* Direct link to prompt builder - temporary for demo iframes*/}
            <Route
                path="prompt"
                element={
                    <PromptGenerator
                        onSuccess={() => {
                            return;
                        }}
                    />
                }
            ></Route>
            {/* Already Built App */}
            <Route path=":appId" element={<AppPage />}></Route>

            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});
