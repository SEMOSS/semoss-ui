import { observer } from 'mobx-react-lite';
import { Outlet, Routes, Route, Navigate } from 'react-router-dom';
import { AppPage } from './AppPage';
import { NewAppPage } from './NewAppPage';

// Fix these
import { NavigatorLayout } from '../NavigatorLayout';
import { ImportLayout } from '../import';

export const AppRouter = observer(() => {
    return (
        <Routes>
            {/* New Apps */}
            <Route
                path="new"
                element={
                    <NavigatorLayout>
                        <ImportLayout />
                    </NavigatorLayout>
                }
            >
                <Route index element={<NewAppPage />}></Route>

                {/* Build with template */}
                {/* <Route path="build" element={<div>UI Builder</div>}></Route>
                <Route path="configure" element={<div></div>}></Route>
                <Route path="members" element={<div></div>}></Route> */}
            </Route>
            {/* Already Built App */}
            <Route path=":appId" element={<AppPage />}></Route>

            <Route path="*" element={<Navigate to={`/`} replace />} />
        </Routes>
    );
});

// {/* TODO - Review this: I want to leverage the Outlet rather than children for NavigatorLayout*/}
// <Route
//     path="/add-app"
//     element={
//         <NavigatorLayout>
//             <ImportLayout />
//         </NavigatorLayout>
//     }
// >
//     <Route index element={<AddAppPage />}></Route>
// </Route>

// {/* Build with template */}
// <Route path="/template/:appId" element={<NavigatorLayout />}>
//     <Route index element={<div>Template build</div>}></Route>
// </Route>

// {/* Build with framework */}
// <Route path="/framework-build" element={<NavigatorLayout />}>
//     <Route index element={<div>Frame work build</div>}></Route>
// </Route>

// {/* Upload with zip or git repo */}
// <Route path="/import" element={<NavigatorLayout />}>
//     <Route index element={<ImportAppPage />}></Route>
// </Route>

// {/* UI Builder */}
// <Route path="/build" element={<NavigatorLayout />}>
//     <Route index element={<div>UI Builder</div>}></Route>
// </Route>
