import React from "react";
import { DefaultBlocks } from "./components/block-defaults";

const App = () => {
    return (
        <>
            {/* <InisghtProvider> */}
            <NCRTPage />
            <PageTwo />
            {/* </InisghtProvider> */}
        </>
    );
};

const PageTwo = () => {
    const customRegistry = {
        ...DefaultBlocks,
    };
    return (
        <div>
            Custom Code
            {/* <Renderer /> */}
        </div>
    );
};

const customRegistry = {
    ...DefaultBlocks,
};
const NCRTPage = () => {
    return (
        <div>
            Custom Code
            {/* <Renderer /> */}
        </div>
    );
};
