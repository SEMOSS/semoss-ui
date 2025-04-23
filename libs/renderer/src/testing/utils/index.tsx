import "@testing-library/jest-dom";
import { DefaultBlocks } from "@/components/block-defaults";
import { Blocks } from "@/components/blocks";
import { type Block, StateStore } from "@/store";
import { render, type RenderOptions } from "@testing-library/react";
import type React from "react";

interface MockProviderProps {
    children: React.ReactNode;
    blocks: Record<string, Block>;
}

const MockProvider: React.FC<MockProviderProps> = ({ children, blocks }) => {
    const store = new StateStore({
        state: {
            executionOrder: [],
            queries: {},
            variables: {},
            version: "",
            blocks: blocks,
        },
    });

    return (
        <Blocks state={store} registry={DefaultBlocks}>
            {children}
        </Blocks>
    );
};

// Define the type for the custom render function
type CustomRenderOptions = {
    blocks: Record<string, Block>;
    renderOptions?: RenderOptions<unknown>;
} & Omit<RenderOptions, "wrapper">;

// Override render method from testing-library
const customRender = (
    ui: React.ReactElement,
    options?: CustomRenderOptions,
): ReturnType<typeof render> => {
    const { blocks } = options || {}; // Destructure parameters from options
    return render(ui, {
        wrapper: (props) => <MockProvider {...props} blocks={blocks} />,
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