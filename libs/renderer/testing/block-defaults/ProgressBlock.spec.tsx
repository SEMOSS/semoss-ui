import { ProgressBlock } from "@/components/block-defaults/progress-block/ProgressBlock";
import { render, screen } from "../utils";

const blocks = {
    "progress-id": {
        data: {
            type: "linear",
            value: 25,
            includeLabel: true,
            size: "300px",
            show: "true",
        },
        id: "progress-id",
        widget: "progress",
        slots: {
            children: {
                children: [],
                name: "",
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

describe("Progress Block", async () => {
    it("Should render the Progress Block", async () => {
        render(<ProgressBlock data-testid="progressId" id="progress-id" />, {
            blocks: blocks,
        });

        const element = screen.queryByRole("progressbar");
        // screen.debug()
        expect(element).toBeInTheDocument();
    });
    it("Should not render the Progress Block", async () => {
        const localBlocks = {
            "progress-id": {
                ...blocks["progress-id"],
                data: {
                    type: "linear",
                    value: 25,
                    includeLabel: true,
                    size: "300px",
                    show: "false",
                },
            },
        };
        await render(<ProgressBlock id="progress-id" />, {
            blocks: localBlocks,
        });
        // screen.debug();
        const element = screen.queryByRole("progressbar");
        expect(element).not.toBeInTheDocument();
    });
    it("Should do not include label", async () => {
        const localBlocks = {
            "progress-id": {
                ...blocks["progress-id"],
                data: {
                    type: "linear",
                    value: 25,
                    includeLabel: false,
                    size: "300px",
                    show: "true",
                },
            },
        };
        await render(<ProgressBlock id="progress-id" />, {
            blocks: localBlocks,
        });
        // screen.debug();
        expect(screen.queryByText("25%")).not.toBeInTheDocument();
    });

    it("Should render 0%", async () => {
        render(<ProgressBlock data-testid="progressId" id="progress-id" />, {
            blocks: {
                "progress-id": {
                    ...blocks["progress-id"],
                    data: {
                        type: "linear",
                        value: 0,
                        includeLabel: true,
                        size: "300px",
                        show: "true",
                    },
                },
            },
        });
        expect(screen.getByText("0%")).toBeInTheDocument();
    });
    it("Should render 25%", async () => {
        render(<ProgressBlock data-testid="progressId" id="progress-id" />, {
            blocks: blocks,
        });
        expect(screen.getByText("25%")).toBeInTheDocument();
    });
    it("Should render 100%", async () => {
        render(<ProgressBlock data-testid="progressId" id="progress-id" />, {
            blocks: {
                "progress-id": {
                    ...blocks["progress-id"],
                    data: {
                        type: "linear",
                        value: 100,
                        includeLabel: true,
                        size: "300px",
                        show: "true",
                    },
                },
            },
        });
        expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("Should check if type is circular", async () => {
        render(<ProgressBlock data-testid="progressId" id="progress-id" />, {
            blocks: {
                "progress-id": {
                    ...blocks["progress-id"],
                    data: {
                        type: "circular",
                        value: 25,
                        includeLabel: true,
                        size: "300px",
                        show: "true",
                    },
                },
            },
        });
        // expect(container.getAttribute("class")).toContain("MuiCircularProgress-root")
        const element = screen.getByRole("progressbar");
        expect(element).toHaveClass("MuiCircularProgress-root");
    });
    it("Should check if type is linear", async () => {
        render(<ProgressBlock data-testid="progressId" id="progress-id" />, {
            blocks: {
                "progress-id": {
                    ...blocks["progress-id"],
                    data: {
                        type: "linear",
                        value: 25,
                        includeLabel: true,
                        size: "300px",
                        show: "true",
                    },
                },
            },
        });
        // expect(container.getAttribute("class")).toContain("MuiCircularProgress-root")
        const element = screen.getByRole("progressbar");
        expect(element).toHaveClass("MuiLinearProgress-root");
    });
});
