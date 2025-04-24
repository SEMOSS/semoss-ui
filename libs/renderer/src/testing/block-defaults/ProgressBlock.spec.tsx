import { ProgressBlock } from "@/components/block-defaults/progress-block/ProgressBlock";
import { render, screen } from "../utils";

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
	it("Should render the Progress Block", async () => {
		const { container } = render(
			<ProgressBlock data-testid="progressId" id="progress-id" />,
			{
				blocks: blocks,
			},
		);

		const element = screen.queryByRole("progressbar")
        // screen.debug()
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
		const { container } = await render(<ProgressBlock id="progress-id" />, {
			blocks: localBlocks,
		});
		// screen.debug();
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
		const { container } = await render(<ProgressBlock id="progress-id" />, {
			blocks: localBlocks,
		});
		// screen.debug();
		expect(screen.queryByText("25%")).not.toBeInTheDocument();
	});

	it("Should render 0%", async () => {
		const { container } = render(
			<ProgressBlock data-testid="progressId" id="progress-id" />,
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
		const { container } = render(
			<ProgressBlock data-testid="progressId" id="progress-id" />,
			{
				blocks: blocks,
			},
		);
		expect(screen.getByText("25%")).toBeInTheDocument();
	});
	it("Should render 100%", async () => {
		const { container } = render(
			<ProgressBlock data-testid="progressId" id="progress-id" />,
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
			<ProgressBlock data-testid="progressId" id="progress-id" />,
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
		// expect(container.getAttribute("class")).toContain("MuiCircularProgress-root")
		const element = screen.getByRole("progressbar");
		expect(element).toHaveClass("MuiCircularProgress-root");
	});
	it("Should check if type is linear", async () => {
		const { container } = render(
			<ProgressBlock data-testid="progressId" id="progress-id" />,
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
		// expect(container.getAttribute("class")).toContain("MuiCircularProgress-root")
		const element = screen.getByRole("progressbar");
		expect(element).toHaveClass("MuiLinearProgress-root");
	});
});
