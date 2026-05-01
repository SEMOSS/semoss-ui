import {
	ProgressBlock,
	type ProgressBlockDef,
} from "../../components/block-defaults/progress-block/ProgressBlock";
import { useBlock } from "../../hooks";
import { render, renderHook, screen } from "../utils";

const blocks = {
	"progress-id": {
		data: {
			type: "linear",
			value: 25,
			includeLabel: true,
			size: "300px",
			show: "true",
		},
		id: "progress-id",
		widget: "progress",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: [],
		},
	},
};

describe("Progress Block", async () => {
	it("use useBlock", async () => {
		const { result } = renderHook(
			() => useBlock<ProgressBlockDef>("progress-id"),
			{
				blocks: blocks,
				renderEngineId: "progress-id",
			},
		);

		expect(result.current).toBeDefined();
		expect(result.current.data.type).toBe("linear");
		// screen.debug()
	});
	it("Should render the Progress Block", async () => {
		render(
			<ProgressBlock
				data-testid="progressId"
				id={blocks["progress-id"].id}
			/>,
			{
				blocks: blocks,
			},
		);

		const element = screen.queryByRole("progressbar");
		expect(element).toBeInTheDocument();
	});
	it("Should not render the Progress Block", async () => {
		const localBlocks = {
			"progress-id": {
				...blocks["progress-id"],
				data: {
					type: "linear",
					value: 25,
					includeLabel: true,
					size: "300px",
					show: "false",
				},
			},
		};
		await render(<ProgressBlock id={blocks["progress-id"].id} />, {
			blocks: localBlocks,
		});

		const element = screen.queryByRole("progressbar");
		expect(element).not.toBeInTheDocument();
	});
	it("Should do not include label", async () => {
		const localBlocks = {
			"progress-id": {
				...blocks["progress-id"],
				data: {
					type: "linear",
					value: 25,
					includeLabel: false,
					size: "300px",
					show: "true",
				},
			},
		};
		await render(<ProgressBlock id={blocks["progress-id"].id} />, {
			blocks: localBlocks,
		});

		expect(screen.queryByText("25%")).not.toBeInTheDocument();
	});

	it("Should render 0%", async () => {
		render(
			<ProgressBlock
				data-testid="progressId"
				id={blocks["progress-id"].id}
			/>,
			{
				blocks: {
					"progress-id": {
						...blocks["progress-id"],
						data: {
							type: "linear",
							value: 0,
							includeLabel: true,
							size: "300px",
							show: "true",
						},
					},
				},
			},
		);
		expect(screen.getByText("0%")).toBeInTheDocument();
	});
	it("Should render 25%", async () => {
		render(
			<ProgressBlock
				data-testid="progressId"
				id={blocks["progress-id"].id}
			/>,
			{
				blocks: blocks,
			},
		);
		expect(screen.getByText("25%")).toBeInTheDocument();
	});
	it("Should render 100%", async () => {
		render(
			<ProgressBlock
				data-testid="progressId"
				id={blocks["progress-id"].id}
			/>,
			{
				blocks: {
					"progress-id": {
						...blocks["progress-id"],
						data: {
							type: "linear",
							value: 100,
							includeLabel: true,
							size: "300px",
							show: "true",
						},
					},
				},
			},
		);
		expect(screen.getByText("100%")).toBeInTheDocument();
	});

	it("Should check if type is circular", async () => {
		const { container } = render(
			<ProgressBlock
				data-testid="progressId"
				id={blocks["progress-id"].id}
			/>,
			{
				blocks: {
					"progress-id": {
						...blocks["progress-id"],
						data: {
							type: "circular",
							value: 25,
							includeLabel: true,
							size: "300px",
							show: "true",
						},
					},
				},
			},
		);
		const spinner = container.querySelector(
			"[role='status']",
		) as HTMLElement;
		expect(spinner).toBeInTheDocument();
		expect(spinner).toHaveClass("animate-spin");
	});
	it("Should check if type is linear", async () => {
		render(
			<ProgressBlock
				data-testid="progressId"
				id={blocks["progress-id"].id}
			/>,
			{
				blocks: {
					"progress-id": {
						...blocks["progress-id"],
						data: {
							type: "linear",
							value: 25,
							includeLabel: true,
							size: "300px",
							show: "true",
						},
					},
				},
			},
		);

		const element = screen.getByRole("progressbar");
		expect(element).toHaveAttribute("data-slot", "progress");
	});
});
