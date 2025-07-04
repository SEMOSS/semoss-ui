import { render, screen } from "../utils";
import { expect } from "vitest";
import "@testing-library/jest-dom";

import { LogsBlock } from "@/components/block-defaults/logs-block/LogsBlock";
import { QueryStateConfig } from "@/store";

const blocks = {
    logs: {
        data: {
            style: {
                display: "flex",
                flexDirection: "column",
                padding: "4px",
                gap: "8px",
                flexWrap: "wrap",
            },
            queryId: "test-query-id",
        },
        id: "logs",
        widget: "logs",
        slots: {
            children: {
                children: [],
                name: "",
            },
        },
        listeners: {
            onChange: [],
        },
    },
};

const queries: Record<string, QueryStateConfig> = {
    "test-query-id": {
        id: "test-query-id",
        cells: [
            { id: "test1", widget: "", parameters: {} },
            { id: "test2", widget: "", parameters: {} },
            { id: "test3", widget: "", parameters: {} },
        ],
    },
};

describe("logs block", () => {
    it("renders correctly with mocked provider and no query", async () => {
        const { container } = render(<LogsBlock id="logs" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='logs']");
        console.log({ element });

        expect(element).toBeInTheDocument();
        expect(element.tagName).equal("DIV", "element is type div");
        expect(screen.getByText("Attach Query")).toBeInTheDocument();
    });

    it("renders correctly with mocked provider and query", async () => {
        const { container } = render(<LogsBlock id="logs" />, {
            blocks: blocks,
            queryConfig: queries,
        });

        const element = container.querySelector("[data-block='logs']");
        console.log({ element });

        expect(element).toBeInTheDocument();
        expect(element.tagName).equal("DIV", "element is type div");
        expect(() => screen.getByText("Attach Query")).toThrow();
    });
});
