import { fireEvent, render, screen } from "../utils";
import { expect, test } from "vitest";
import "@testing-library/jest-dom";

import { ButtonBlock } from "../../components/block-defaults/button-block/ButtonBlock";
import { ActionMessages, QueryStateConfig, RunQueryAction } from "@/store";
import { useBlock, useBlocks } from "@/hooks";

// mock data for default button component
const blocks = {
    button: {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
            label: "Button Test",
            loading: false,
            disabled: false,
            variant: "contained",
            color: "primary",
        },
        id: "button",
        widget: "button",
        slots: {},
        listeners: {
            onClick: [],
        },
    },

    styledButton: {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
                width: "30px",
                height: "50px",
            },
            label: "Styled Button Test",
            loading: false,
            disabled: false,
            variant: "outlined",
            color: "secondary",
        },
        id: "styledButton",
        widget: "button",
        slots: {},
        listeners: {
            onClick: [],
        },
    },
};

const queries: Record<string, QueryStateConfig> = {
    testQuery: {
        id: "testQuery",
        cells: [
            {
                id: "test",
                widget: "code",
                parameters: {
                    type: "py",
                    code: "result = 1 + 1\r\nresult",
                },
            },
        ],
    },
};

const query: RunQueryAction = {
    message: ActionMessages.RUN_QUERY,
    payload: {
        queryId: "testQuery",
    },
};

const queryBlock = {
    queryButton: {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
            label: "hi",
            loading: false,
            disabled: false,
            variant: "contained",
            color: "primary",
        },
        id: "queryButton",
        widget: "button",
        slots: {},
        listeners: {
            onClick: [query],
        },
    },
};

const mockDispatch = vi.fn();

describe("button block", () => {
    // checks button exists with correct label
    it("should render button block with label", async () => {
        const { container } = render(<ButtonBlock id="button" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='button']");

        expect(element).toBeInTheDocument();
        expect(screen.getByText("Button Test")).toBeInTheDocument();
    });

    // checks button styles
    it("has correct color, variant, dimensions", async () => {
        const { container } = render(<ButtonBlock id="styledButton" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='styledButton']");
        const buttonElement = container.querySelector("button");

        expect(element).toBeInTheDocument();
        expect(buttonElement).toHaveClass("MuiButton-outlined");
        expect(buttonElement).toHaveClass("MuiButton-outlinedSecondary");
        expect(buttonElement).toHaveStyle({ width: "30px", height: "50px" });
    });

    // checks onClick functionality
    //it("has successful onClick query", async () => {
        // mock result of useBlocks()

    //     vi.mock("@/hooks/useBlock.tsx", () => ({
    //         useBlock: () => ({
    //             state: {
    //                 dispatch: mockDispatch,
    //                 getBlock: (id: string) =>
    //                     id === "queryButton" ? queryBlock.queryButton : null,
    //             },
    //         }),
    //     }));

    //     // vi.mock("@/hooks/useBlocks.tsx", () => ({
    //     //     useBlocks: () => ({
    //     //         state: {
    //     //             dispatch: mockDispatch,
    //     //             getBlock: (id: string) =>
    //     //                 id === "queryButton" ? queryBlock.queryButton : null,
    //     //         },
    //     //     }),
    //     // }));

    //     const { container } = render(<ButtonBlock id="queryButton" />, {
    //         blocks: queryBlock,
    //         query: queries,
    //     });

    //     const buttonElement = container.querySelector("button");

    //     //console.log(container.innerHTML);

    //     fireEvent.click(buttonElement);
    
    //     // validate query dispatch
    //     expect(mockDispatch).toHaveBeenCalledWith(queries);
    //});
   // )},
});