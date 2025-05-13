import { render } from "../utils/index";
import { expect, test } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { AccordionBlock } from "../../components/block-defaults/accordion-block/AccordionBlock";

const blocks = {
    accordion: {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
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
            onChange: [],
        },
    },
};

describe("accordion block", () => {
    test("renders correctly with mocked provider", async () => {
        const { container } = render(<AccordionBlock id="accordion" />, {
            blocks: blocks,
        });

        const accordion = container.querySelector("[data-block='accordion']");
        expect(accordion).toBeInTheDocument();
    });

    test("renders header properly", async () => {
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

    test("toggles content on click", async () => {
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