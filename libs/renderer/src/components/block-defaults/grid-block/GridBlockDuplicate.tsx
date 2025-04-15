import { useState } from "react";
import { observer } from "mobx-react-lite";

import { useBlock, useFrame } from "../../../hooks";
import { BlockComponent, BlockDef } from "../../../store";
import {
    styled,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
} from "@mui/material";

import { GridBlockColumn } from "./grid-block.types";
import { GridBlockContextMenu } from "./GridBlockContextMenu";
import { VisualizationColumns } from "../echart-visualization-block";
import { Typography } from "@semoss/ui";
// import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const DEFAULT_HEIGHT = "300px";
const DEFAULT_WIDTH = "500px";
const DEFAULT_COLUMN_WIDTH = "160px";

const StyledBlock = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    height: DEFAULT_HEIGHT,
    width: DEFAULT_WIDTH,
    overflow: "hidden",
}));

const StyledTitle = styled("div")(() => ({
    display: "flex",

    justifyContent: "start",
}));

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    flex: "1",
    background: theme.palette.background.paper,
}));

const StyledTableHeadRow = styled(TableRow)(() => ({
    color: "inherit",
    backgroundColor: "inherit",
}));

const StyledTableHeadCell = styled(TableCell)(({ theme }) => ({
    textTransform: "capitalize",
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    background: theme.palette.background.paper,
}));

const StyledTableCell = styled(TableCell)(() => ({
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
}));

const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
    background: theme.palette.background.paper,
}));

export interface HeaderBackgroundSettings {
    backgroundColor: string;
    fontSize: string;
    fontColor: string;
    selectedColumn: string[];
}

export interface CellBackgroundSettings {
    backgroundColor: string;
    fontSize: string;
    fontColor: string;
    selectedColumn: string[];
}

export interface ChartTitleSettings {
    chartTitle: string;
    fontSize: string;
    fontColor: string;
}

export interface WrapTextSettings {
    selectedColumn: string[];
    textWrap: boolean;
}

export interface GridBlockDef extends BlockDef<"grid"> {
    widget: "grid";

    /** data associated with the block */
    data: {
        /** Bind the grid to a frame */
        frame: {
            name: string;
        };

        /** Column Definitions */
        columns: GridBlockColumn[];

        /** */
        style: {
            height: number;
            width: number;
            display: string | undefined;
            flexDirection: string | undefined;
            padding: string | undefined;
            gap: string | undefined;
            flexWrap: string | undefined;
        };
        option: {
            // backgroundColor: string;
            headerBackgroundSettings?: HeaderBackgroundSettings;
            cellBackgroundSettings?: CellBackgroundSettings;
            chartTitleSettings?: ChartTitleSettings;
            wrapTextSettings?: WrapTextSettings;
            rowSpanning?: boolean;
        };
        variation: undefined | string;
        show: boolean;

        /** Context Menu */
        contextMenu?: {
            /** Show the unfilter related options */
            hideUnfilter: boolean;

            /** Show the filter related options */
            hideFilter: boolean;
        };

        view?: {
            //TODO: Include limit + offset?

            /** Enable the pagination */
            pagination: boolean;
        };
    };
}

export const GridBlockDuplicate: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<GridBlockDef>(id);
    const [paginationModel, setPaginationModel] = useState({
        page: 0,
        pageSize: 50,
    });

    const [contextMenu, setContextMenu] = useState<{
        mouseX: number;
        mouseY: number;
        column: GridBlockColumn;
        value: unknown;
    } | null>(null);

    // create the selector
    const selector = `Select(${data.columns
        .map((c) => {
            return c.selector;
        })
        .join(", ")}).as([${data.columns
        .map((c) => {
            return c.name;
        })
        .join(", ")}])`;

    // get the frame
    const frame = useFrame(data.frame.name, {
        selector: selector,
        offset: paginationModel.page * paginationModel.pageSize,
        limit: paginationModel.pageSize,
        enableCount: true,
    });

    // get the total width of the table based on the columns
    const tableWidth: number = data.columns.reduce((acc, val) => {
        // if it is a number, add it
        if (!isNaN(Number(val.width))) {
            return acc + Number(val.width);
        }

        return acc + parseInt(DEFAULT_COLUMN_WIDTH);
    }, 0);

    console.log(data, "DATA");
    console.log(frame, "FRAME");

    const columns = data.columns.map((col) => ({
        field: col.name,
        headerName: col.name,
        soetable: false,
        renderHeader: () => (
            <div
                style={{
                    // Apply style if the column is selected
                    backgroundColor: headerSettings.selectedColumn.includes(
                        col.name,
                    )
                        ? headerSettings.backgroundColor
                        : "inherit",
                    color: headerSettings.selectedColumn.includes(col.name)
                        ? headerSettings.fontColor
                        : "inherit",
                    fontSize: headerSettings.selectedColumn.includes(col.name)
                        ? `${headerSettings.fontSize}px`
                        : "inherit",
                    padding: "8px",
                    width: "100%",
                    whiteSpace:
                        wrapTextSettings.textWrap &&
                        wrapTextSettings.selectedColumn.includes(col.name)
                            ? "normal"
                            : "nowrap",
                    wordBreak:
                        wrapTextSettings.textWrap &&
                        wrapTextSettings.selectedColumn.includes(col.name)
                            ? "break-word"
                            : "normal",
                }}
            >
                {col.name}
            </div>
        ),

        renderCell: (params) => {
            const isWrapEnabled =
                wrapTextSettings.textWrap &&
                wrapTextSettings.selectedColumn.includes(col.name);
            return (
                <div
                    style={{
                        // Apply style if the column is selected
                        backgroundColor: cellSettings.selectedColumn.includes(
                            col.name,
                        )
                            ? cellSettings.backgroundColor
                            : "inherit",
                        color: cellSettings.selectedColumn.includes(col.name)
                            ? cellSettings.fontColor
                            : "inherit",
                        fontSize: cellSettings.selectedColumn.includes(col.name)
                            ? `${cellSettings.fontSize}px`
                            : "inherit",
                        padding: "8px",
                        width: "100%",
                        lineHeight: isWrapEnabled ? "1.5" : "normal",
                        whiteSpace:
                            wrapTextSettings.textWrap &&
                            wrapTextSettings.selectedColumn.includes(col.name)
                                ? "normal"
                                : "nowrap",
                        wordBreak:
                            wrapTextSettings.textWrap &&
                            wrapTextSettings.selectedColumn.includes(col.name)
                                ? "break-word"
                                : "normal",
                    }}
                >
                    {params.value}
                </div>
            );
        },
    }));

    console.log(columns, "COLUMNS");

    const rows = frame.data.values.map((r, idx) => {
        const obj: Record<string, any> = { id: idx };
        columns.forEach((c, cIdx) => {
            obj[c.field] = r[cIdx];
        });
        return obj;
    });
    console.log(rows, "ROWS");

    const handlePaginationModalChange = (newmodel) => {
        // if the page size has changed reset the page
        if (newmodel.pageSize !== paginationModel.pageSize) {
            setPaginationModel({
                page: 0,
                pageSize: newmodel.pageSize,
            });
        } else {
            setPaginationModel(newmodel);
        }
    };

    const headerSettings = {
        // columns: [],
        fontSize: "16",
        fontColor: "#000000",
        selectedColumn: [],
        backgroundColor: "white",
        ...data.option?.headerBackgroundSettings,
    };

    const cellSettings = {
        // columns: [],
        fontSize: "16",
        fontColor: "#000000",
        selectedColumn: [],
        backgroundColor: "white",
        ...data.option?.cellBackgroundSettings,
    };

    const titleSettings = data.option?.chartTitleSettings || {
        chartTitle: "",
        fontSize: "16",
        fontColor: "#000000",
    };

    const wrapTextSettings = {
        selectedColumn: [],
        textWrap: false,
        ...data.option?.wrapTextSettings,
    };

    const getRowHeight = (params: any) => {
        if (data.option?.rowSpanning) {
            return 50;
        }
        return "auto";
    };

    console.log(data, "Dattaaaaaaaaa");

    return (
        <StyledBlock sx={data.style} {...attrs}>
            <StyledTitle
                sx={{
                    fontSize: `${titleSettings.fontSize}px`,
                    color: titleSettings.fontColor,
                }}
            >
                {titleSettings.chartTitle}
            </StyledTitle>

            <div
                style={{
                    flex: 1,
                    width: "440px",
                    height: "100%",
                    minHeight: "400px",
                }}
            >
                <DataGrid
                    rows={rows}
                    columns={columns}
                    pagination
                    density="compact"
                    paginationMode="server"
                    rowCount={frame.count}
                    paginationModel={paginationModel}
                    onPaginationModelChange={handlePaginationModalChange}
                    pageSizeOptions={[10, 50, 100, 500]}
                    // getRowHeight={() => "auto"}
                    getRowHeight={getRowHeight}
                    columnHeaderHeight={38}
                    disableColumnMenu
                    disableColumnSorting
                    showCellVerticalBorder
                    // showColumnVerticalBorder
                    unstable_rowSpanning={data.option?.rowSpanning}
                    sx={{
                        "& .MuiDataGrid-columnHeader": {
                            padding: "0px",
                        },
                        "& .MuiDataGrid-columnHeaderTitleContainerContent": {
                            width: "100%",
                        },
                        "& .MuiDataGrid-cell": {
                            padding: "0px",
                        },
                    }}
                />
            </div>
            <GridBlockContextMenu
                id={id}
                frame={frame}
                contextMenu={contextMenu}
                onClose={() => setContextMenu(null)}
            />
        </StyledBlock>
    );
});
