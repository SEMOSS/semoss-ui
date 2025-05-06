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
        style: Pick<React.CSSProperties, "height" | "width">;

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

export const GridBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<GridBlockDef>(id);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

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
        offset: rowsPerPage * page,
        limit: rowsPerPage,
        enableCount: true,
    });

    // get the headers as as a map (header -> idx)
    const headerMap: Record<string, number> = frame.data.headers.reduce(
        (acc, val, idx) => {
            acc[val] = idx;

            return acc;
        },
        {},
    );

    // get the total width of the table based on the columns
    const tableWidth: number = data.columns.reduce((acc, val) => {
        // if it is a number, add it
        if (!isNaN(Number(val.width))) {
            return acc + Number(val.width);
        }

        return acc + parseInt(DEFAULT_COLUMN_WIDTH);
    }, 0);

    /**
     * Handle the callback for the context menu
     * @param event - triggered event
     * @param column - selected column
     * @param row - value
     */
    const handleTableCellOnContextMenu = (
        event: React.MouseEvent,
        column: GridBlockColumn,
        value: unknown,
    ) => {
        // prevent the default interaction
        event.preventDefault();

        // open the menu and save the data
        setContextMenu(
            contextMenu === null
                ? {
                      mouseX: event.clientX + 2,
                      mouseY: event.clientY - 6,
                      column: column,
                      value: value,
                  }
                : // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
                  // Other native context menus might behave different.
                  // With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
                  null,
        );
    };

    return (
        <StyledBlock sx={data.style} {...attrs}>
            <StyledTableContainer>
                <Table
                    size="small"
                    stickyHeader={true}
                    sx={{ minWidth: tableWidth }}
                >
                    <TableHead>
                        <StyledTableHeadRow>
                            {data.columns.map((c, cIdx) => {
                                return (
                                    <StyledTableHeadCell
                                        component={"th"}
                                        key={cIdx}
                                        align="left"
                                        title={c.name}
                                        sx={{
                                            //This component is weird because it is a table / has a special layout, you have to either use minWidth or maxWidth
                                            maxWidth: !isNaN(Number(c.width))
                                                ? c.width
                                                : DEFAULT_COLUMN_WIDTH,
                                        }}
                                    >
                                        {c.name}
                                    </StyledTableHeadCell>
                                );
                            })}
                        </StyledTableHeadRow>
                    </TableHead>
                    <TableBody>
                        {frame.isLoading ? (
                            <LinearProgress />
                        ) : (
                            frame.data.values.map((r, rIdx) => {
                                return (
                                    <TableRow key={rIdx}>
                                        {data.columns.map((c, cIdx) => {
                                            let headerExists = false;
                                            // check if the header exists
                                            if (
                                                Object.prototype.hasOwnProperty.call(
                                                    headerMap,
                                                    c.name,
                                                )
                                            ) {
                                                headerExists = true;
                                            }

                                            // get the value
                                            const value = r[headerMap[c.name]];

                                            // str for rendering and title
                                            const str =
                                                typeof value !== "string"
                                                    ? JSON.stringify(value)
                                                    : value;

                                            return (
                                                <StyledTableCell
                                                    key={cIdx}
                                                    align="left"
                                                    title={str}
                                                    sx={{
                                                        //This component is weird because it is a table / has a special layout, you have to either use minWidth or maxWidth
                                                        maxWidth: !isNaN(
                                                            Number(c.width),
                                                        )
                                                            ? c.width
                                                            : DEFAULT_COLUMN_WIDTH,
                                                    }}
                                                    onContextMenu={(e) => {
                                                        // don't open context menu
                                                        if (!headerExists) {
                                                            return;
                                                        }

                                                        handleTableCellOnContextMenu(
                                                            e,
                                                            c,
                                                            value,
                                                        );
                                                    }}
                                                >
                                                    {str}
                                                </StyledTableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </StyledTableContainer>
            <GridBlockContextMenu
                id={id}
                frame={frame}
                contextMenu={contextMenu}
                onClose={() => setContextMenu(null)}
            />
            {data.view?.pagination && (
                <StyledTablePagination
                    rowsPerPageOptions={[10, 50, 100, 500]}
                    count={frame.count}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value));
                        setPage(0);
                    }}
                />
            )}
        </StyledBlock>
    );
});
