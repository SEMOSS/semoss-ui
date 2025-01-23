import { BlockJSON } from "../../store";

import {
    CLASS_DIAGRAM,
    ENTITY_RELATIONSHIP_DIAGRAM,
    GANTT,
    SEQUENCE_DIAGRAM,
    STATE_DIAGRAM,
    USER_JOURNEY,
    PIE_CHART,
    QUADRANT_CHART,
    REQUIREMENT_DIAGRAM,
    GIT_DIAGRAM,
    C4_DIAGRAM,
    MINDMAP,
    TIMELINE,
    SANKEY,
    XY_Chart,
    BLOCK_DIAGRAM,
    GENERAL_MERMAID,
} from "./mermaid-block";

import type { DesignerMenuItem } from "./menu-types";

const SECTION_GENERAL_VISUALIZATION = "General";
const SECTION_MERMAID = "Mermaid";
const SECTION_AREA_CHART = "Area Chart";
const SECTION_BAR_CHART = "Bar Chart";
const SECTION_LINE_CHART = "Line Chart";
const SECTION_PIE_CHART = "Pie Chart";
const SECTION_SCATTER_PLOTS = "Scatter Plot";

/**
 * Show the visualizations in the menu
 */
export const VISUALIZATION_MENU: DesignerMenuItem[] = [
    {
        section: SECTION_GENERAL_VISUALIZATION,
        name: "Vega",
        json: {
            widget: "vega",
            data: {
                specJson: "",
                variation: undefined,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_GENERAL_VISUALIZATION,
        name: "Grid",
        json: {
            widget: "grid",
            data: {
                frame: {
                    name: "",
                },
                columns: [],
                view: {
                    pagination: true,
                },
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_BAR_CHART,
        name: "Bar Chart",
        json: {
            widget: "vega",
            data: {
                variation: "bar-chart",
                specJson: JSON.stringify(
                    {
                        $schema:
                            "https://vega.github.io/schema/vega-lite/v5.json",
                        title: "Bar Chart",
                        width: 300,
                        height: 300,
                        data: {
                            values: [
                                { a: "A", b: 28 },
                                { a: "B", b: 55 },
                                { a: "C", b: 43 },
                                { a: "D", b: 91 },
                                { a: "E", b: 81 },
                                { a: "F", b: 53 },
                                { a: "G", b: 19 },
                                { a: "H", b: 87 },
                                { a: "I", b: 52 },
                            ],
                        },
                        mark: "bar",
                        encoding: {
                            x: { field: "a", type: "ordinal" },
                            y: { field: "b", type: "quantitative" },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_BAR_CHART,
        name: "Grouped Bar Chart",
        json: {
            widget: "vega",
            data: {
                variation: "grouped-bar-chart",
                specJson: JSON.stringify(
                    {
                        $schema:
                            "https://vega.github.io/schema/vega-lite/v5.json",
                        title: "Grouped Bar Chart",
                        width: 300,
                        height: 300,
                        data: {
                            values: [
                                { category: "A", group: "x", value: 0.1 },
                                { category: "A", group: "y", value: 0.6 },
                                { category: "A", group: "z", value: 0.9 },
                                { category: "B", group: "x", value: 0.7 },
                                { category: "B", group: "y", value: 0.2 },
                                { category: "B", group: "z", value: 1.1 },
                                { category: "C", group: "x", value: 0.6 },
                                { category: "C", group: "y", value: 0.1 },
                                { category: "C", group: "z", value: 0.2 },
                            ],
                        },
                        mark: "bar",
                        encoding: {
                            x: { field: "category" },
                            y: { field: "value", type: "quantitative" },
                            xOffset: { field: "group" },
                            color: { field: "group" },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_PIE_CHART,
        name: "Pie Chart",
        json: {
            widget: "vega",
            data: {
                variation: "pie-chart",
                specJson: JSON.stringify(
                    {
                        $schema:
                            "https://vega.github.io/schema/vega-lite/v5.json",
                        title: "Pie Chart",
                        width: 300,
                        height: 300,
                        description: "A simple pie chart with embedded data.",
                        data: {
                            values: [
                                { category: 1, value: 4 },
                                { category: 2, value: 6 },
                                { category: 3, value: 10 },
                                { category: 4, value: 3 },
                                { category: 5, value: 7 },
                                { category: 6, value: 8 },
                            ],
                        },
                        mark: "arc",
                        encoding: {
                            theta: { field: "value", type: "quantitative" },
                            color: { field: "category", type: "nominal" },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_PIE_CHART,
        name: "Radial Plot",
        json: {
            widget: "vega",
            data: {
                variation: "radial-plot",
                specJson: JSON.stringify(
                    {
                        $schema:
                            "https://vega.github.io/schema/vega-lite/v5.json",
                        title: "Radial Plot",
                        width: 300,
                        height: 300,
                        description:
                            "A simple radial chart with embedded data.",
                        data: {
                            values: [12, 23, 47, 6, 52, 19],
                        },
                        layer: [
                            {
                                mark: {
                                    type: "arc",
                                    innerRadius: 20,
                                    stroke: "#fff",
                                },
                            },
                            {
                                mark: { type: "text", radiusOffset: 10 },
                                encoding: {
                                    text: {
                                        field: "data",
                                        type: "quantitative",
                                    },
                                },
                            },
                        ],
                        encoding: {
                            theta: {
                                field: "data",
                                type: "quantitative",
                                stack: true,
                            },
                            radius: {
                                field: "data",
                                scale: {
                                    type: "sqrt",
                                    zero: true,
                                    rangeMin: 20,
                                },
                            },
                            color: {
                                field: "data",
                                type: "nominal",
                                legend: null,
                            },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_LINE_CHART,
        name: "Line Chart",
        json: {
            widget: "vega",
            data: {
                variation: "line-chart",
                specJson: JSON.stringify(
                    {
                        $schema:
                            "https://vega.github.io/schema/vega-lite/v5.json",
                        title: "Line Chart",
                        width: 300,
                        height: 300,
                        data: {
                            values: [
                                { a: "A", b: 28 },
                                { a: "B", b: 55, predicted: false },
                                { a: "D", b: 91, predicted: false },
                                { a: "E", b: 81, predicted: false },
                                { a: "E", b: 81, predicted: true },
                                { a: "G", b: 19, predicted: true },
                                { a: "H", b: 87, predicted: true },
                            ],
                        },
                        mark: "line",
                        encoding: {
                            x: { field: "a", type: "ordinal" },
                            y: { field: "b", type: "quantitative" },
                            strokeDash: { field: "predicted", type: "nominal" },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_AREA_CHART,
        name: "Area Chart",
        json: {
            widget: "vega",
            data: {
                variation: "area-chart",
                specJson: JSON.stringify(
                    {
                        $schema:
                            "https://vega.github.io/schema/vega-lite/v5.json",
                        title: "Area Chart",
                        width: 300,
                        height: 300,
                        data: {
                            values: [
                                { a: "A", b: 28 },
                                { a: "B", b: 55 },
                                { a: "D", b: 91 },
                                { a: "E", b: 81 },
                                { a: "E", b: 81 },
                                { a: "G", b: 19 },
                                { a: "H", b: 87 },
                            ],
                        },
                        mark: "area",
                        encoding: {
                            x: {
                                field: "a",
                            },
                            y: {
                                aggregate: "sum",
                                field: "b",
                                title: "count",
                            },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_AREA_CHART,
        name: "Area Chart with Gradient",
        json: {
            widget: "vega",
            data: {
                variation: "area-chart-with-gradient",
                specJson: JSON.stringify(
                    {
                        $schema:
                            "https://vega.github.io/schema/vega-lite/v5.json",
                        title: "Area Chart with Gradient",
                        width: 300,
                        height: 300,
                        description: "Simple area chart with gradient.",
                        data: {
                            values: [
                                { a: "A", b: 28 },
                                { a: "B", b: 55 },
                                { a: "D", b: 91 },
                                { a: "E", b: 81 },
                                { a: "E", b: 81 },
                                { a: "G", b: 19 },
                                { a: "H", b: 87 },
                            ],
                        },
                        mark: {
                            type: "area",
                            line: {
                                color: "darkgreen",
                            },
                            color: {
                                x1: 1,
                                y1: 1,
                                x2: 1,
                                y2: 0,
                                gradient: "linear",
                                stops: [
                                    {
                                        offset: 0,
                                        color: "white",
                                    },
                                    {
                                        offset: 1,
                                        color: "darkgreen",
                                    },
                                ],
                            },
                        },
                        encoding: {
                            x: {
                                field: "a",
                            },
                            y: {
                                aggregate: "sum",
                                field: "b",
                                title: "count",
                            },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_SCATTER_PLOTS,
        name: "Scatter Plot",
        json: {
            widget: "vega",
            data: {
                variation: "scatter-plot",
                specJson: JSON.stringify(
                    {
                        $schema:
                            "https://vega.github.io/schema/vega-lite/v5.json",
                        title: "Scatter Plot",
                        width: 300,
                        height: 300,
                        description: "A scatterplot.",
                        data: {
                            values: [
                                { a: 10, b: 28 },
                                { a: 20, b: 55 },
                                { a: 30, b: 91 },
                                { a: 40, b: 81 },
                                { a: 50, b: 81 },
                                { a: 60, b: 19 },
                                { a: 70, b: 87 },
                            ],
                        },
                        mark: "point",
                        encoding: {
                            x: { field: "a", type: "quantitative" },
                            y: { field: "b", type: "quantitative" },
                        },
                    },
                    null,
                    2,
                ),
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "General Mermaid",
        json: {
            widget: "mermaid",
            data: {
                text: GENERAL_MERMAID,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Class Diagram",
        json: {
            widget: "mermaid",
            data: {
                text: CLASS_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Sequence Diagram",
        json: {
            widget: "mermaid",
            data: {
                text: SEQUENCE_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "State Diagram",
        json: {
            widget: "mermaid",
            data: {
                text: STATE_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Entity Relationship Diagram",
        json: {
            widget: "mermaid",
            data: {
                text: ENTITY_RELATIONSHIP_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "User Journey",
        json: {
            widget: "mermaid",
            data: {
                text: USER_JOURNEY,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Gantt",
        json: {
            widget: "mermaid",
            data: {
                text: GANTT,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Pie Chart",
        json: {
            widget: "mermaid",
            data: {
                text: PIE_CHART,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Quadrant Chart",
        json: {
            widget: "mermaid",
            data: {
                text: QUADRANT_CHART,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Requirement Diagram",
        json: {
            widget: "mermaid",
            data: {
                text: REQUIREMENT_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Git Diagram",
        json: {
            widget: "mermaid",
            data: {
                text: GIT_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "C4 Diagram",
        json: {
            widget: "mermaid",
            data: {
                text: C4_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Mindmap",
        json: {
            widget: "mermaid",
            data: {
                text: MINDMAP,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Timeline",
        json: {
            widget: "mermaid",
            data: {
                text: TIMELINE,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Sankey",
        json: {
            widget: "mermaid",
            data: {
                text: SANKEY,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "XY Chart",
        json: {
            widget: "mermaid",
            data: {
                text: XY_Chart,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
    {
        section: SECTION_MERMAID,
        name: "Block Diagram",
        json: {
            widget: "mermaid",
            data: {
                text: BLOCK_DIAGRAM,
            },
            listeners: {},
            slots: {} as BlockJSON["slots"],
        },
    },
];
