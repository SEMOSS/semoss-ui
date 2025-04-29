import { render } from "../utils/index";
import { expect, test } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { ModalBlock } from "../../components/block-defaults/modal-block/ModalBlock";

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
        id: "modalTest",
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
        const { container } = render(<ModalBlock id="modalTest" />, {
            blocks: blocks,
        });

        // const modal = container.querySelector("[data-block='modal']");
        // expect(modal).toBeInTheDocument();
    });
});
