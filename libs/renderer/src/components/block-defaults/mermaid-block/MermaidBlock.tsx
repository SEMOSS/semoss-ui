import { BlockComponent, BlockDef } from "../../../store";
import { observer } from "mobx-react-lite";
import mermaid from "mermaid";
import { useEffect, useState } from "react";
import { useBlock } from "../../../hooks";
import { Alert, styled } from "@mui/material";

const StyledContainer = styled("div")(() => ({
    width: "100%",
    minHeight: "10%",
}));

// Container for Mermaid Diagram
const MermaidContainer = styled("div")(() => ({
    width: "fit-content",
    height: "fit-content",
}));

// Styled Alert for Error Display
const ErrorAlert = styled(Alert)(() => ({
    borderRadius: "4px",
}));

// Interface for Mermaid Block Definition
export interface MermaidBlockDef extends BlockDef<"mermaid"> {
    widget: "mermaid";
    data: {
        text: string;
    };
    slots: never;
}

// MermaidBlock Component
export const MermaidBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs } = useBlock<MermaidBlockDef>(id);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Initialize Mermaid (without renderError in config)
    mermaid.initialize({
        startOnLoad: false,
    });

    // Helper Function: Global Error Handler
    const handleMermaidError = (id: string, error: Error) => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = `<div style="color: red; font-weight: bold;">Mermaid Error: ${error.message}</div>`;
        }
    };

    // Helper Function: Validate Mermaid Syntax
    const isMermaidSyntaxValid = async (text: string): Promise<boolean> => {
        try {
            await mermaid.parse(text);
            return true;
        } catch (error) {
            return false;
        }
    };

    // Helper Function: Initialize Mermaid Diagram
    const initializeMermaid = (id: string, text: string) => {
        const element = document.getElementById(id);
        if (element) {
            try {
                element.removeAttribute("data-processed");
                element.innerHTML = text; // Set the Mermaid diagram text
                mermaid.init(undefined, element); // Initialize the Mermaid rendering
            } catch (error) {
                handleMermaidError(id, error as Error); // Handle rendering errors
            }
        }
    };

    useEffect(() => {
        const renderMermaid = async () => {
            if (!data.text) {
                setErrorMessage(null);
                return;
            }

            // Validate Mermaid syntax
            if ((await isMermaidSyntaxValid(data.text)) === false) {
                setErrorMessage("Invalid Mermaid syntax");
                return;
            }

            // Clear error message and render Mermaid
            setErrorMessage(null);
            initializeMermaid(id, data.text);
        };

        renderMermaid();
    }, [id, data.text]);

    // Render Block
    return (
        <StyledContainer {...attrs}>
            <MermaidContainer
                className="mermaid-container"
                id={`mermaid-container-${id}`}
            >
                {/* Mermaid Diagram */}
                <pre
                    className="mermaid"
                    id={id}
                    style={{
                        display: errorMessage || !data.text ? "none" : "block",
                    }}
                >
                    {data.text}
                </pre>
            </MermaidContainer>
            {/* Error UI */}
            {errorMessage && (
                <div className="mermaid-error-ui">
                    <ErrorAlert
                        severity="error"
                        sx={{ backgroundColor: "#fdeded" }}
                    >
                        {errorMessage}
                    </ErrorAlert>
                </div>
            )}

            {/* Suggestion: Warning Alert for undefined can be added instead of not shwowing */}
            {!data.text && <div></div>}
        </StyledContainer>
    );
});
