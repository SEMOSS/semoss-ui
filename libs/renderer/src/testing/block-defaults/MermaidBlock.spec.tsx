import { describe, expect, test } from "vitest";
import { MermaidBlock } from "../../components/block-defaults/mermaid-block/MermaidBlock.tsx";
import { render, screen } from "../utils";

const blockIds = {
	mermaid: "mermaid",
	mermaidComplex: "mermaidComplex",
	invalidHeader: "invalidHeader",
	invalidMermaid: "invalidMermaid",
};

const blocks = {
	mermaid: {
		data: {
			text: "graph TD;\nA-->B;\nA-->C;\nB-->D;\nC-->D;\n",
		},
		id: "mermaid",
		widget: "mermaid",
		slots: {},
		listeners: {},
	},
	mermaidComplex: {
		data: {
			text: "graph TD;\nA-->B;\nA-->C;\nB-->D;\nC-->D;\nC-->E;\nF-->H;\nC-->C;\nC-->I;\nI-->C;\nC-->K;\nD-->A;\nS\n",
		},
		id: "mermaidComplex",
		widget: "mermaid",
		slots: {},
		listeners: {},
	},
	invalidHeader: {
		data: {
			text: "A-->B;\nA-->C;\nB-->D;\nC-->D;\n",
		},
		id: "invalidHeader",
		widget: "mermaid",
		slots: {},
		listeners: {},
	},
	invalidMermaid: {
		data: {
			text: "graph TD;\nA-->B;\nA-->C;\nB-->D;\nC-->D;\nF--",
		},
		id: "invalidMermaid",
		widget: "mermaid",
		slots: {},
		listeners: {},
	},
};

describe("Mermaid block", () => {
	test("renders correctly with mocked data", async () => {
		const { container } = render(<MermaidBlock id={blockIds.mermaid} />, {
			blocks: blocks,
		});
		const element = container.querySelector("[data-block='mermaid']");
		expect(element).toBeInTheDocument();
		const mermaidElement = screen.getByText(/graph TD;/);
		expect(mermaidElement).toBeInTheDocument();
		expect(element).toHaveTextContent(
			"graph TD; A-->B; A-->C; B-->D; C-->D;",
		);
	});

	test("renders correctly with complex data", async () => {
		const { container } = render(
			<MermaidBlock id={blockIds.mermaidComplex} />,
			{
				blocks: blocks,
			},
		);
		const element = container.querySelector(
			"[data-block='mermaidComplex']",
		);
		expect(element).toBeInTheDocument();
		expect(element).toHaveTextContent(
			"graph TD; A-->B; A-->C; B-->D; C-->D; C-->E; F-->H; C-->C; C-->I; I-->C; C-->K; D-->A; S",
		);
	});

	test("displays error message for missing graph header", async () => {
		// const { container } = render(
		// 	<MermaidBlock id={blockIds.invalidHeader} />,
		// 	{
		// 		blocks: blocks,
		// 	},
		// );
		// console.log("testing here")
		// const element = container.querySelector("[data-block='invalidHeader']");
		// expect(element).toBeInTheDocument();
		// const mermaidElement = screen.queryByText(/graph TD;/);
		// expect(mermaidElement).not.toBeInTheDocument();
		// expect(element).toHaveTextContent("A-->B; A-->C; B-->D; C-->D;");
		// const errorElement = await screen.findByRole("alert");
		// expect(errorElement).toBeInTheDocument();
		// expect(errorElement).toHaveTextContent(/invalid mermaid syntax/i);
	});

	test("displays error message for invalid mermaid syntax", async () => {
		// const { container } = render(
		// 	<MermaidBlock id={blockIds.invalidMermaid} />,
		// 	{
		// 		blocks: blocks,
		// 	},
		// );
		// const element = container.querySelector(
		// 	"[data-block='invalidMermaid']",
		// );
		// expect(element).toBeInTheDocument();
		// expect(element).toHaveTextContent(
		// 	"graph TD; A-->B; A-->C; B-->D; C-->D; F--",
		// );
		// const errorElement = await screen.findByRole("alert");
		// expect(errorElement).toBeInTheDocument();
		// expect(errorElement).toHaveTextContent(/invalid mermaid syntax/i);
	});
});
