import { render, screen, waitFor } from "../utils";
import { expect } from "vitest";
import "@testing-library/jest-dom";

import { MarkdownBlock } from "@/components/block-defaults/markdown-block/MarkdownBlock";

const blocks = {
    markdown: {
        data: {
            style: {
                padding: "32px",
                color: "#0471F0",
            },
            markdown: "# Hello World",
            isStreaming: false,
            show: "",
        },
        id: "markdown",
        widget: "markdown",
        slots: {},
        listeners: {},
    },
    streaming: {
        data: {
            style: {},
            markdown: "# Hello World",
            isStreaming: true,
            show: "",
        },
        id: "streaming",
        widget: "markdown",
        slots: {},
        listeners: {},
    },
};

describe("Markdown Block", () => {
    it("should render correctly with mocked provider", async () => {
        const { container } = render(<MarkdownBlock id="markdown" />, {
            blocks: blocks,
        });

        const markdown = container.querySelector("[data-block='markdown']");
        expect(markdown).toBeInTheDocument();
    });

    it("should render content in markdown properly", async () => {
        render(<MarkdownBlock id="markdown" />, {
            blocks: blocks,
        });

        expect(screen.getByText("Hello World")).toBeInTheDocument();
    });

    it("should render streaming markdown content after animation", async () => {
        render(<MarkdownBlock id="streaming" />, {
            blocks: blocks,
        });

        await waitFor(() => {
            expect(screen.getByText("Hello World")).toBeInTheDocument();
        });
    });

    it("should apply styles to the block", async () => {
        const { container } = render(<MarkdownBlock id="markdown" />, {
            blocks: blocks,
        });

        const div = container.querySelector("[data-block='markdown']");
        expect(div).toHaveStyle("padding: 32px");
        expect(div).toHaveStyle("color: #0471F0");
    });
});