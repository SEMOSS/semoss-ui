import React from "react";

import { Renderer, DefaultCells } from "../../src/index.ts";

export const App = () => {
    // return <>hellos</>
    return <div>{JSON.stringify(DefaultCells)}</div>;
};
