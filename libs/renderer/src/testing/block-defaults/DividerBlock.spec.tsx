import { render } from "../utils";
import { expect, test } from "vitest";
import { fireEvent, waitFor, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { DividerBlock } from "../../components/block-defaults/divider-block";

const blocks = {
    divider: {
        data: {
            style: {},
            variant: "fullWidth",
            orientation: "horizontal",
            textAlign: "center",
            flexItem: false,
            light: false,
            text: "",
            showText: false,
            show: "true",
        },
        id: "divider",
        widget: "divider",
        slots: {},
        listeners: {},
    },
    divider2: {
        data: {
            style: {},
            variant: "inset",
            orientation: "vertical",
            textAlign: "right",
            flexItem: false,
            light: false,
            text: "Hello World!",
            showText: true,
            show: "true",
        },
        id: "divider2",
        widget: "divider",
        slots: {},
        listeners: {},
    },
};

describe("divider block", () => {
    it("renders default divider", async () => {
        const { container } = render(<DividerBlock id="divider"/>, {
            blocks: blocks,
        });

        const dividerBlock = container.querySelector("[data-block='divider']");
        expect(dividerBlock).toBeInTheDocument();
        
    });

    it("displays label text", async () => {
        const { container } = render(<DividerBlock id="divider2"/>, {
            blocks: blocks,
        });

        expect(screen.getByText("Hello World!")).toBeVisible();
    });

    it("displays correct orientation and variant 1", async () => {
        const { container } = render(<DividerBlock id="divider"/>, {
            blocks: blocks,
        }); 

        const dividerBlock = container.querySelector("[data-block='divider']");
        expect(dividerBlock.querySelector(".MuiDivider-vertical")).not.toBeInTheDocument();
        expect(dividerBlock.querySelector(".MuiDivider-fullWidth")).toBeInTheDocument();
    });

    it("displays correct orientation and variant 2", async () => {
        const { container } = render(<DividerBlock id="divider2"/>, {
            blocks: blocks,
        }); 
        
        const dividerBlock = container.querySelector("[data-block='divider2']"); 
        expect(dividerBlock.querySelector(".MuiDivider-vertical")).toBeInTheDocument();
        expect(dividerBlock.querySelector(".MuiDivider-inset")).toBeInTheDocument();
    });
});