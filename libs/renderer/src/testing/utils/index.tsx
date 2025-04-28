import "@testing-library/jest-dom";
import { DefaultBlocks } from "@/components/block-defaults";
import { Blocks, RendererEngine } from "@/components/blocks";
import { type Block, type QueryStateConfig, StateStore } from "@/store";
import { render, type RenderOptions } from "@testing-library/react";
import type React from "react";

interface MockProviderProps {
    children: React.ReactNode;
    blocks: Record<string, Block>;
    queryConfig?: Record<string, QueryStateConfig>;
    renderEngineId: string
}

const MockProvider: React.FC<MockProviderProps> = ({
    children,
    blocks, renderEngineId,
    queryConfig,
}) => {
    const store = new StateStore({
        state: {
            executionOrder: [],
            queries: queryConfig || {},
            variables: {},
            version: "",
            blocks: blocks,
        },
    });

    return (
        <Blocks state={store} registry={DefaultBlocks}>
            <RendererEngine id={renderEngineId}/>
        </Blocks>
    );
};

// Define the type for the custom render function
type CustomRenderOptions = {
    blocks: Record<string, Block>;
    queryConfig?: Record<string, QueryStateConfig>;
    renderOptions?: RenderOptions<unknown>;
} & Omit<RenderOptions, "wrapper">;

// Override render method from testing-library
const customRender = (
    ui: React.ReactElement,
    options?: CustomRenderOptions,
): ReturnType<typeof render> => {
    const { blocks } = options || {}; // Destructure parameters from options
    const { queryConfig } = options || {};
    const {id : renderEngineId} = ui.props // Destructure ui block props and get its id prop to be used in renderEngine
    return render(ui, {
        wrapper: (props) => (
            <MockProvider
                {...props}
                blocks={blocks}
                queryConfig={queryConfig}
            renderEngineId={renderEngineId} />
        ),
        ...options,
    });
};

// Automatically clean up after each test
// afterEach(() => {
//     cleanup();
// });

// Re-export everything from React Testing Library
export * from "@testing-library/react";

// Override the render method
export { customRender as render };
