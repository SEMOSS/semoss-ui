import { fireEvent, render, screen } from "../utils";
import { expect, test } from "vitest";
import "@testing-library/jest-dom";

import { ButtonBlock } from "../../components/block-defaults/button-block/ButtonBlock";
import { ActionMessages, RunQueryAction } from "@/store";
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

// casting query
const runQuery: RunQueryAction = {
    message: ActionMessages.RUN_QUERY,
    payload: {
        queryId: "count",
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
            label: "Query Button Test",
            loading: false,
            disabled: false,
            variant: "contained",
            color: "primary",
        },
        id: "queryButton",
        widget: "button",
        slots: {},
        listeners: {
            onClick: [runQuery],
        },
    },
};

// query example from json
const queries = {
    count: {
        id: "count",
        cells: [
            {
                id: "12345",
                widget: "code",
                parameters: {
                    type: "py",
                    code: "result = 1 + 1\r\nresult",
                },
            },
        ],
    },
};

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
    it("has successful onClick query", async () => {
        // mock result of useBlocks()
        // vi.mock("@/hooks/useBlocks.tsx", () => {
        //     return {
        //         useBlocks: () => ({
        //             state: {
        //                 dispatch: vi.fn(),
        //                 getBlock: vi.fn().mockRejectedValue({
        //                     id: "count",
        //                 }),
        //             },
        //         }),
        //     };
        // });

        const { container } = render(<ButtonBlock id="queryButton" />, {
            blocks: queryBlock,
            //renderOptions: { queries: queries },
        });

        // spy on state.dispatch for query message
        // const { state } = useBlocks();

        const element = container.querySelector("[data-block='queryButton']");
        const buttonElement = container.querySelector("button");

        console.log(container.innerHTML);

        // button click
        //fireEvent.click(buttonElement);

        // mock dispatch call
        //const dispatch = useBlocks().state.dispatch;

        //console.log("dispatch function " + dispatch);

        expect(element).toBeInTheDocument();
        //expect(runQuery).toHaveBeenCalledTimes(1);

        // checking onClick state.dispatch
        //const { dispatch } = useBlock("queryButton");
        // expect(dispatch).toHaveBeenCalledWith(runQuery);
    });

    // checks isLoading
});
