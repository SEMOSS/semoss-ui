import { expect, vi } from "vitest";
import { PageBlock } from "../../components/block-defaults/page-block/page-block";
import { render, screen } from "../utils";

const blocks = {
	basicPage: {
		data: {
			style: {
				width: "100%",
				height: "400px",
				backgroundColor: "#ffffff",
			},
			loading: false,
		},
		id: "basicPage",
		widget: "page",
		slots: {
			content: {
				children: ["child-block-1"],
				name: "content",
			},
		},
		listeners: {},
	},
	loadingPage: {
		data: {
			style: {
				width: "100%",
				height: "300px",
			},
			loading: true,
		},
		id: "loadingPage",
		widget: "page",
		slots: {
			content: {
				children: [],
				name: "content",
			},
		},
		listeners: {},
	},
	stringLoadingPage: {
		data: {
			style: {
				width: "100%",
				height: "300px",
			},
			loading: "true",
		},
		id: "stringLoadingPage",
		widget: "page",
		slots: {
			content: {
				children: [],
				name: "content",
			},
		},
		listeners: {},
	},
	stringNotLoadingPage: {
		data: {
			style: {
				width: "100%",
				height: "300px",
			},
			loading: "false",
		},
		id: "stringNotLoadingPage",
		widget: "page",
		slots: {
			content: {
				children: [],
				name: "content",
			},
		},
		listeners: {},
	},
	minimalPage: {
		data: {
			style: {},
			loading: false,
		},
		id: "minimalPage",
		widget: "page",
		slots: {
			content: {
				children: [],
				name: "content",
			},
		},
		listeners: {},
	},
	"child-block-1": {
		data: {
			text: "Test content",
		},
		id: "child-block-1",
		widget: "text",
		slots: {},
		listeners: {},
	},
	"child-block-2": {
		data: {
			text: "Additional content",
		},
		id: "child-block-2",
		widget: "text",
		slots: {},
		listeners: {},
	},
};

describe("PageBlock", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders page block with correct attributes and styles", () => {
		const { container } = render(<PageBlock id={blocks.basicPage.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='basicPage']");
		expect(element).toBeInTheDocument();
		expect(element).toHaveAttribute("data-page");
		expect(element).toHaveStyle({
			width: "100%",
			height: "400px",
			backgroundColor: "#ffffff",
		});
	});

	it("renders with minimal configuration", () => {
		const { container } = render(<PageBlock id={blocks.minimalPage.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='minimalPage']");
		expect(element).toBeInTheDocument();
		expect(element).toHaveAttribute("data-page");
	});

	it("renders content slot with child blocks", () => {
		render(<PageBlock id={blocks.basicPage.id} />, {
			blocks: blocks,
		});

		expect(screen.getByText("Test content")).toBeInTheDocument();
	});

	it("renders multiple child blocks in content slot", () => {
		const pageWithMultipleChildren = {
			...blocks.basicPage,
			id: "pageWithMultipleChildren",
			slots: {
				content: {
					children: ["child-block-1", "child-block-2"],
					name: "content",
				},
			},
		};

		render(<PageBlock id={pageWithMultipleChildren.id} />, {
			blocks: { ...blocks, pageWithMultipleChildren },
		});

		expect(screen.getByText("Test content")).toBeInTheDocument();
		expect(screen.getByText("Additional content")).toBeInTheDocument();
	});

	it("renders empty content slot when no children", () => {
		const { container } = render(<PageBlock id={blocks.loadingPage.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='loadingPage']");
		expect(element).toBeInTheDocument();
		expect(
			element?.querySelector("[data-slot='content']"),
		).toBeInTheDocument();
	});

	it("shows loading screen when loading is true (boolean)", () => {
		const { container } = render(<PageBlock id={blocks.loadingPage.id} />, {
			blocks: blocks,
		});

		const loadingOverlay = container.querySelector(".z-50");
		expect(loadingOverlay).toBeInTheDocument();
	});

	it("shows loading screen when loading is string 'true'", () => {
		const { container } = render(
			<PageBlock id={blocks.stringLoadingPage.id} />,
			{ blocks },
		);

		const loadingOverlay = container.querySelector(".z-50");
		expect(loadingOverlay).toBeInTheDocument();
	});

	it("hides loading screen when loading is false (boolean)", () => {
		const { container } = render(<PageBlock id={blocks.basicPage.id} />, {
			blocks: blocks,
		});

		const loadingOverlay = container.querySelector(".z-50");
		expect(loadingOverlay).toBeNull();
	});

	it("hides loading screen when loading is string 'false'", () => {
		const { container } = render(
			<PageBlock id={blocks.stringNotLoadingPage.id} />,
			{ blocks },
		);

		const loadingOverlay = container.querySelector(".z-50");
		expect(loadingOverlay).toBeNull();
	});

	it("handles case-insensitive string loading values", () => {
		const upperCaseLoadingPage = {
			...blocks.stringLoadingPage,
			id: "upperCaseLoadingPage",
			data: {
				...blocks.stringLoadingPage.data,
				loading: "TRUE",
			},
		};

		const { container } = render(
			<PageBlock id={upperCaseLoadingPage.id} />,
			{
				blocks: { ...blocks, upperCaseLoadingPage },
			},
		);

		const loadingOverlay = container.querySelector(".z-50");
		expect(loadingOverlay).toBeInTheDocument();
	});

	it("does not throw when onPageLoad listener is not defined", () => {
		expect(() => {
			render(<PageBlock id={blocks.basicPage.id} />, {
				blocks: blocks,
			});
		}).not.toThrow();
	});

	it("renders successfully when listeners object is empty", () => {
		const { container } = render(<PageBlock id={blocks.minimalPage.id} />, {
			blocks: blocks,
		});

		const element = container.querySelector("[data-block='minimalPage']");
		expect(element).toBeInTheDocument();
	});
});
