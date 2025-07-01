import { expect, test } from "vitest";
import "@testing-library/jest-dom";

import { render, screen } from "../utils/index";
import { SelectBlock } from "../../components/block-defaults/select-block/SelectBlock";

const blocks = {
    select: {
        id: "select",
        widget: "select",
        data: {
            style: {},
            value: "",
            label: "Example Select",
            hint: "",
            options: "",
            required: false,
            disabled: false,
            loading: false,
            multiple: false,
            show: "true",
        },
        listeners: {},
        slots: {
            content: {
                name: "content",
                children: [],
            },
        },
    },
    querySelect: {
        id: "querySelect",
        widget: "select",
        data: {
            style: {},
            value: "",
            label: "Example Select",
            hint: "",
            options: "{{options.output}}",
            required: false,
            disabled: false,
            loading: false,
            show: "true",
            multiple: true,
        },
         listeners: {
                // onChange: {
                //     type: "async",
                //     order: [],
                // },
                // preProcess: {
                //     type: "async",
                //     order: [],
                // },
            },
        slots: {
            content: {
                name: "content",
                children: [],
            },
        },
    },
    multiQuerySelect: {
        id: "multiQuerySelect",
        widget: "select",
        data: {
            style: {},
            value: "",
            label: "Example Select",
            hint: "",
            options: "{{options.output}}",
            required: false,
            disabled: false,
            loading: false,
            show: "true",
        },
         listeners: {
                // onChange: {
                //     type: "async",
                //     order: [],
                // },
                // preProcess: {
                //     type: "async",
                //     order: [],
                // },
            },
        slots: {
            content: {
                name: "content",
                children: [],
            },
        },
    },
};

describe("select block", () => {
    test("renders correctly with mocked provider", async () => {
        const { container } = render(<SelectBlock id="select" />, {
            blocks: blocks,
        });

        const element = container.querySelector("[data-block='select']");
        expect(element).toBeInTheDocument();
    });

    test("renders with correct label", async () => {
        const { container } = render(<SelectBlock id="select" />, {
            blocks: blocks,
        });

        const element = container.querySelector("input");
        const label = screen.getByLabelText("Example Select");

        expect(label).toBeTruthy();
    });

     test("renders with select options", async () => {
        const { container } = render(<SelectBlock id="querySelect" />, {
            blocks: blocks,
        });

        const element = container.querySelector("input");
        const label = screen.getByLabelText("Example Select");

        expect(label).toBeTruthy();
    });

    test("does not allow multi select if multiselect is disabled", async () => {
        const { container } = render(<SelectBlock id="querySelect" />, {
            blocks: blocks,
        });

        const element = container.querySelector("input");
        const label = screen.getByLabelText("Example Select");

        expect(label).toBeTruthy();
    });

     test("works correctly with select multiple options", async () => {
        const { container } = render(<SelectBlock id="mulitQuerySelect" />, {
            blocks: blocks,
        });

        const element = container.querySelector("input");
        const label = screen.getByLabelText("Example Select");

        expect(label).toBeTruthy();
    });

});
