import { expect } from "vitest";
import "@testing-library/jest-dom";

import { render, fireEvent, screen, waitFor } from "../utils";
import { UploadBlock } from "@/components/block-defaults/upload-block/UploadBlock";

const blocks = {
    upload: {
        data: {
            style: {
                padding: "8px",
                border: "1px solid #ccc",
            },
            label: "Upload File",
            value: "",
            required: true,
            loading: false,
            disabled: false,
            hint: "Please upload a file",
            extensions: [".jpg", ".png"],
            multiple: false,
            show: "",
        },
        id: "upload",
        widget: "upload",
        slots: {},
        listeners: {
            onChange: [],
        },
    },
};

describe("Upload Block", () => {
    it("renders correctly with mocked provider", async () => {
        const { container } = render(<UploadBlock id="upload" />, {
            blocks: blocks,
        });
    
        const upload = container.querySelector("[data-block='upload']");
        expect(upload).toBeInTheDocument();
    });

    it("renders the label", async () => {
        render(<UploadBlock id="upload" />, {
            blocks: blocks,
        });

        expect(screen.getByText("Upload File")).toBeInTheDocument();
    });

    it("displays the hint text", async () => {
        render(<UploadBlock id="upload" />, {
            blocks: blocks,
        });

        expect(screen.getByText("Please upload a file")).toBeInTheDocument();
    });

    it("handles file upload", async () => {
        const mockFile = new File(["dummy content"], "example.jpg", {
            type: "image/jpeg",
        });
    
        render(<UploadBlock id="upload" />, {
            blocks: blocks,
        });
    
        const input = screen.getByLabelText(/Upload File/i) as HTMLInputElement;
        await fireEvent.change(input, { target: { files: [mockFile] } });
    
        await waitFor(() => {
            expect(input.files?.[0]).toBe(mockFile);
            expect(input.files?.[0].name).toBe("example.jpg");
        });
    });

    it("disables the input when loading", async () => {
        render(<UploadBlock id="upload" />, {
            blocks: {
                ...blocks,
                upload: {
                    ...blocks.upload,
                    data: {
                        ...blocks.upload.data,
                        loading: true,
                    },
                },
            },
        });

        const input = screen.getByLabelText(/Upload File/i) as HTMLInputElement;
        expect(input).toBeDisabled();
    });

    it("restricts file types based on extensions", async () => {
        render(<UploadBlock id="upload" />, {
            blocks: blocks,
        });

        const input = screen.getByLabelText(/Upload File/i) as HTMLInputElement;
        expect(input.accept).toBe(".jpg,.png");
    });

    it("allows multiple file uploads when enabled", async () => {
        render(<UploadBlock id="upload" />, {
            blocks: {
                ...blocks,
                upload: {
                    ...blocks.upload,
                    data: {
                        ...blocks.upload.data,
                        multiple: true,
                    },
                },
            },
        });

        const input = screen.getByLabelText(/Upload File/i) as HTMLInputElement;
        expect(input.multiple).toBe(true);
    });
});