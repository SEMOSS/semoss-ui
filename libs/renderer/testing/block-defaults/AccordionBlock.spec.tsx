import { expect, it } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import { render } from "../utils";

import { AccordionBlock } from "@/components/block-defaults/accordion-block/AccordionBlock";

const blocks = {
    accordion: {
        data: {
            style: {},
            triggerBgColor: "",
            contentBgColor: "",
            showExpandIcon: true,
            show: "true",
        },
        id: "accordion",
        widget: "accordion",
        slots: {
            header: {
                name: "header",
                children: [],
            },
            content: {
                name: "content",
                children: [],
            },
        },
        listeners: {
            preProcess: {
                type: "sync",
                order: [],
            },
            onChange: {
                type: "sync",
                order: [],
            },
        },
    },
};

describe("accordion block", () => {
    it("renders correctly with mocked provider", async () => {
        const { container } = render(<AccordionBlock id="accordion" />, {
            blocks: blocks,
        });

        const accordion = container.querySelector("[data-block='accordion']");
        expect(accordion).toBeInTheDocument();
    });

    it("renders header properly", async () => {
        const { container } = render(<AccordionBlock id="accordion" />, {
            blocks: blocks,
        });

        //does the header slot of the accordion render
        const header = container.querySelector("[data-slot='header']");
        expect(header).toBeInTheDocument();

        //on render, the content slot should not be visible
        const content = container.querySelector(".MuiCollapse-entered");
        expect(content).not.toBeInTheDocument();
    });

    it("toggles content on click", async () => {
        const { container } = render(<AccordionBlock id="accordion" />, {
            blocks: blocks,
        });

        const header = container.querySelector("[data-slot='header']");

        await fireEvent.click(header);

        //on click, toggle the view of the content
        await waitFor(() => {
            const content = container.querySelector("[data-slot='content']");
            expect(content).toBeInTheDocument();
        });

        await fireEvent.click(header);

        await waitFor(() => {
            const content = container.querySelector(".MuiCollapse-entered");
            expect(content).not.toBeInTheDocument();
        });
    });
});
