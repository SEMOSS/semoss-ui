import { expect } from "vitest";
import "@testing-library/jest-dom";

import { render } from "../utils";
import { IframeBlock } from "@/components/block-defaults/iframe-block/IframeBlock";

const blocks = {
    iframe: {
        data: {
            style: { width: "100%", height: "400px" },
            src: "https://example.com",
            title: "Example iFrame",
            enableFrameInteractions: true,
            show: "true",
        },
        id: "iframe",
        widget: "iframe",
        slots: {},
        listeners: {},
    },
};

describe("Iframe Block", () => {
    it("renders the iframe with correct attributes", async () => {
        const { container } = render(<IframeBlock id="iframe" />, {
            blocks: blocks,
        });

        const block = container.querySelector("[data-block='iframe']");
        expect(block).toBeInTheDocument();

        const iframe = container.querySelector("iframe");
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute("src", "https://example.com");
        expect(iframe).toHaveAttribute("title", "Example iFrame");
    });

    it("disables pointer events when enableFrameInteractions is false", async () => {
        const disabledBlocks = {
            ...blocks,
            iframe: {
                ...blocks.iframe,
                data: {
                    ...blocks.iframe.data,
                    enableFrameInteractions: false,
                },
            },
        };

        const { container } = render(<IframeBlock id="iframe" />, {
            blocks: disabledBlocks,
        });

        const iframe = container.querySelector("iframe");
        expect(iframe).toHaveStyle("pointer-events: none");
    });

    it("renders nothing when show is not 'true'", async () => {
        const hiddenBlocks = {
            ...blocks,
            iframe: {
                ...blocks.iframe,
                data: {
                    ...blocks.iframe.data,
                    show: "false",
                },
            },
        };

        const { container } = render(<IframeBlock id="iframe" />, {
            blocks: hiddenBlocks,
        });

        const block = container.querySelector("[data-block='iframe']");
        expect(block).toBeInTheDocument();
        expect(block).toBeEmptyDOMElement();
    });

    it("applies custom styles from data.style", async () => {
        const styledBlocks = {
            ...blocks,
            iframe: {
                ...blocks.iframe,
                data: {
                    ...blocks.iframe.data,
                    style: { width: "80vw", height: "200px" },
                },
            },
        };

        const { container } = render(<IframeBlock id="iframe" />, {
            blocks: styledBlocks,
        });

        const wrapper = container.querySelector("[data-block='iframe']");
        expect(wrapper).toHaveStyle("width: 80vw; height: 200px;");
        const iframe = container.querySelector("iframe");
        expect(iframe).toHaveStyle({ width: "100%", height: "100%" });
    });

    it("applies default styles when data.style is not provided", async () => {
        const noStyleBlocks = {
            ...blocks,
            iframe: {
                ...blocks.iframe,
                data: {
                    ...blocks.iframe.data,
                    style: undefined,
                },
            },
        };
        const { container } = render(<IframeBlock id="iframe" />, {
            blocks: noStyleBlocks,
        });
        const wrapper = container.querySelector("span");
        expect(wrapper).toHaveStyle({ width: "100%", height: "400px" });
    });
});
