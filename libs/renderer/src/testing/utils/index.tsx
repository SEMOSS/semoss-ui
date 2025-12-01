import "@testing-library/jest-dom";
import {
	type RenderHookOptions,
	type RenderOptions,
	render,
	renderHook,
} from "@testing-library/react";
import type React from "react";
import { DefaultBlocks } from "@/components/block-defaults";
import { Blocks, RendererEngine } from "@/components/blocks";
import { type Block, type QueryStateConfig, StateStore } from "@/store";

interface MockProviderProps {
	children: React.ReactNode;
	blocks: Record<string, Block>;
	queryConfig?: Record<string, QueryStateConfig>;
	renderEngineId: string;
}

const MockProvider: React.FC<MockProviderProps> = ({
	blocks,
	renderEngineId,
	queryConfig,
}) => {
	const store = new StateStore({
		mode: "interactive",
		insightId: "new",
		state: {
			executionOrder: [],
			queries: queryConfig || {},
			variables: {},
			version: "",
			blocks: blocks,
		},
		cellRegistry: {},
	});

	return (
		<Blocks state={store} registry={DefaultBlocks}>
			<RendererEngine id={renderEngineId} />
		</Blocks>
	);
};

// Mock Provider for testing with useBlocks hooks
const MockHookProvider: React.FC<MockProviderProps> = ({
	children,
	blocks,
	renderEngineId,
	queryConfig,
}) => {
	const store = new StateStore({
		mode: "interactive",
		insightId: "new",
		state: {
			executionOrder: [],
			queries: queryConfig || {},
			variables: {},
			version: "",
			blocks: blocks,
		},
		cellRegistry: {},
	});

	return (
		<Blocks state={store} registry={DefaultBlocks}>
			<RendererEngine id={renderEngineId} />
			{children && children}
		</Blocks>
	);
};

// Define the type for the custom render function
type CustomRenderOptions = {
	blocks: Record<string, Block>;
	queryConfig?: Record<string, QueryStateConfig>;
	renderOptions?: RenderOptions;
} & Omit<RenderOptions, "wrapper">;

// Override render method from testing-library
const customRender = (
	ui: React.ReactElement,
	options?: CustomRenderOptions,
): ReturnType<typeof render> => {
	const { blocks } = options || {}; // Destructure parameters from options
	const { queryConfig } = options || {};
	const { id: renderEngineId } = ui.props; // Destructure ui block props and get its id prop to be used in renderEngine
	return render(ui, {
		wrapper: (props) => (
			<MockProvider
				{...props}
				blocks={blocks}
				queryConfig={queryConfig}
				renderEngineId={renderEngineId}
			/>
		),
		...options,
	});
};

interface CustomHookRenderOptions<TProps> extends RenderHookOptions<TProps> {
	blocks: Record<string, Block>;
	queryConfig?: Record<string, QueryStateConfig>;
	renderEngineId: string;
	customChildren?: React.ReactNode;
}
const customRenderHook = <TProps, TResult>(
	callback: (props: TProps) => TResult,
	options?: CustomHookRenderOptions<TProps>,
) => {
	const {
		blocks,
		queryConfig,
		renderEngineId,
		customChildren,
		...hookOptions
	} = options;
	// console.log({callback: callback})
	return renderHook(callback, {
		wrapper: ({ children, ...props }) => (
			<MockHookProvider
				{...props}
				blocks={blocks}
				queryConfig={queryConfig}
				renderEngineId={renderEngineId}
			>
				{children}
				{customChildren && customChildren}
			</MockHookProvider>
		),
		initialProps: {
			blocks,
			queryConfig,
			renderEngineId,
		},
		...hookOptions,
	});
};

beforeAll(() => {
	vi.stubGlobal("jest", {
		advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
	});
});

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.runOnlyPendingTimers();
	vi.useRealTimers();
	vi.clearAllTimers();
});

afterAll(() => {
	vi.unstubAllGlobals();
});

// Re-export everything from React Testing Library
export * from "@testing-library/react";

// Override the render method
export { customRender as render, customRenderHook as renderHook };
