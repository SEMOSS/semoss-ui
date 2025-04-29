import { expect } from "vitest";
import "@testing-library/jest-dom";

import { render } from "../utils";

import { ModalBlock } from "@/components/block-defaults/modal-block/ModalBlock";

const blocks = {
    modal: {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
            title: "Modal Title",
            open: true,
            fullWidth: true,
            maxWidth: "sm",
            minWidth: "sm",
            designMode: true,
        },
        id: "modal",
        widget: "modal",
        slots: {
            content: {
                name: "content",
                children: [],
            },
            footer: {
                name: "footer",
                children: [],
            },
        },
        listeners: {
            onSubmit: [],
        },
    },
};

describe("modal block", () => {
    it("renders correctly with mocked provider", async () => {
        const { container } = render(<ModalBlock id="modal" />, {
            blocks: blocks,
        });

        const modal = container.querySelector("[data-block='modal']");
        expect(modal).toBeInTheDocument();
    });
});
