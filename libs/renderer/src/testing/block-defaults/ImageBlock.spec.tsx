import { expect } from "vitest";
import "@testing-library/jest-dom";

import { render } from "../utils";
import { ImageBlock } from "@/components/block-defaults/image-block/ImageBlock";

const blocks = {
    image: {
        data: {
            src: "https://123.123.com",
            title: "image test",
            show: "true",
        },
        id: "image",
        widget: "image",
        slots: {},
        listeners: {},
    },
    image2: {
        data: {
            src: "https://123.123.com",
            title: "image test",
            show: "false",
        },
        id: "image2",
        widget: "image",
        slots: {},
        listeners: {},
    },
};

describe("Image Block", () => {
    it("renders correctly", async () => {
        const { container } = render(<ImageBlock id="image" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='image']");
        expect(element).not.toBeNull();
        expect(element.getAttribute("style")).equal(
            "background-image: url(https://123.123.com);",
        );
    });
    it("does not show", async () => {
        const { container } = render(<ImageBlock id="image2" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='image2']");
        expect(element).not.toBeNull();
        expect(element.getAttribute("style")).toBeNull();
    });
});
