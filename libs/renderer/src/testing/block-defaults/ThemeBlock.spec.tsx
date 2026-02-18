import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom";
import { ThemeBlock } from "../../components/block-defaults/theme-block/ThemeBlock";
import { render, screen } from "../utils";

const blocks = {
	basicTheme: {
		data: {
			theme: {
				palette: {
					primary: {
						main: "#ff5722",
					},
					secondary: {
						main: "#4caf50",
					},
				},
			},
		},
		id: "basicTheme",
		widget: "theme",
		slots: {
			children: {
				name: "children",
				children: ["child1"],
			},
		},
		listeners: {
			preProcess: {
				type: "sync" as const,
				order: [],
			},
			onChange: {
				type: "sync" as const,
				order: [],
			},
		},
	},
	customTheme: {
		data: {
			theme: {
				palette: {
					primary: {
						main: "#2196f3",
					},
					background: {
						default: "#f5f5f5",
					},
				},
				typography: {
					fontFamily: "Arial, sans-serif",
					h1: {
						fontSize: "2rem",
					},
				},
			},
		},
		id: "customTheme",
		widget: "theme",
		slots: {
			children: {
				name: "children",
				children: ["child1"],
			},
		},
		listeners: {
			preProcess: {
				type: "sync" as const,
				order: [],
			},
			onChange: {
				type: "sync" as const,
				order: [],
			},
		},
	},
	child1: {
		data: {
			text: "Themed Content",
		},
		id: "child1",
		widget: "text",
		slots: {},
		listeners: {
			preProcess: {
				type: "sync" as const,
				order: [],
			},
			onChange: {
				type: "sync" as const,
				order: [],
			},
		},
	},
};

const basicThemeId = "basicTheme";
const customThemeId = "customTheme";

describe("theme block", () => {
	it("renders theme block with correct structure and applies MUI theme provider", () => {
		const { container } = render(<ThemeBlock id={basicThemeId} />, {
			blocks: blocks,
		});

		const element = container.querySelector(
			`[data-block='${basicThemeId}']`,
		);
		expect(element).toBeInTheDocument();

		expect(screen.getByText("Themed Content")).toBeInTheDocument();
	});

	it("applies custom theme configuration correctly including palette and typography", () => {
		const { container } = render(<ThemeBlock id={customThemeId} />, {
			blocks: blocks,
		});

		const element = container.querySelector(
			`[data-block='${customThemeId}']`,
		);
		expect(element).toBeInTheDocument();
		expect(screen.getByText("Themed Content")).toBeInTheDocument();
	});

	it("renders children slot content correctly within theme context", () => {
		const { container } = render(<ThemeBlock id={basicThemeId} />, {
			blocks: blocks,
		});

		const childContent = screen.getByText("Themed Content");
		expect(childContent).toBeInTheDocument();

		const themeWrapper = container.querySelector(
			`[data-block='${basicThemeId}']`,
		);
		expect(themeWrapper).toContainElement(childContent);
	});
});
