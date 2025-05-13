import { Migration } from "./migration.types";

/**
 * @name config
 * @description - This addresses a change in how we store our variables.
 *
 * 1. Go through blocks and add the onMount listeners to all blocks that received a new listener
 * Accordion
 *  */
const config: Migration = {
    versionFrom: "1.0.0-alpha.4",
    versionTo: "1.0.0-alpha.5",
    run: (state) => {
        const newState = { ...state };

        Object.entries(newState.blocks).forEach((keyValue) => {
            const block = keyValue[1];

            if (block.widget === "accordion") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "container") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "flip-card") {
                block.listeners["preProcess"] = [];
            }  else if (block.widget === "popover") {
                block.listeners["onOpen"] = [];
                block.listeners["onClose"] = [];

                delete block.listeners["onClick"];
            } else if (block.widget === "modal") {
                block.listeners["preProcess"] = [];
                block.listeners["onClose"] = [];

                delete block.listeners["onSubmit"];
            } else if (block.widget === "sidebar") {
                block.listeners["preProcess"] = [];
                block.listeners["postProcess"] = [];
            } else if (block.widget === "iteration") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "link") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "logs") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "markdown") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "text") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "audio-input") {
                block.listeners["preProcess"] = [];
                block.listeners["onComplete"] = [];
            } else if (block.widget === "audio-player") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "button") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "checkbox") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "input") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "radio") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "select") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "slider") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "switch") {
                block.listeners["preProcess"] = [];
                block.listeners["onChange"] = [];
            } else if (block.widget === "timepicker") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "toggle-button") {
                block.listeners["preProcess"] = [];
                block.listeners["onChange"] = [];
            } else if (block.widget === "upload") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "chip") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "divider") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "iframe") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "image") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "pdfViewer") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "progress") {
                block.listeners["preProcess"] = [];
            } else if (block.widget === "ratings") {
                block.listeners["preProcess"] = [];
            }
        });

        return newState;
    },
};

export default config;
