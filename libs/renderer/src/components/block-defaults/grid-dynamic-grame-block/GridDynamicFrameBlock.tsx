import { observer } from "mobx-react-lite";
import { useState } from "react";

import { useBlock, useFrame } from "../../../hooks";
import { BlockComponent, BlockDef } from "../../../store";
import { DataGrid } from "@mui/x-data-grid";

export interface GridDynamicFrameBlockDef
    extends BlockDef<"grid-dynamic-frame"> {
    widget: "grid-dynamic-frame";

    /** data associated with the block */
    data: {
        /** Bind the grid to a frame */
        frame: {
            name: string;
        };
        show: boolean;
    };
}

export const GridDynamicFrameBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<GridDynamicFrameBlockDef>(id);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(50);

    // create the selector
    // const selector = `Select(${data.columns
    //     .map((c) => {
    //         return c.selector;
    //     })
    //     .join(", ")}).as([${data.columns
    //     .map((c) => {
    //         return c.name;
    //     })
    // .join(", ")}])`;

    // get the frame
    const frame = useFrame("NLP_FRAME", {
        selector: "QueryAll()",
        offset: rowsPerPage * page,
        limit: rowsPerPage,
        enableCount: true,
    });

    console.log("Dynamic Frame", frame);

    const columns = frame.data.headers.map((col) => ({
        field: col,
        headerName: col,
        sortable: false,
        renderHeader: () => <div>{col}</div>,

        renderCell: (params) => {
            return <div>{params.value}</div>;
        },
    }));

    const rows = frame.data.values.map((r, idx) => {
        const obj: Record<string, any> = { id: idx };
        columns.forEach((c, cIdx) => {
            obj[c.field] = r[cIdx];
        });
        return obj;
    });

    return (
        <div {...attrs}>
            Frame:
            {data.frame.name}
            <DataGrid
                rows={rows}
                columns={columns}
                pagination
                density="compact"
                paginationMode="server"
                rowCount={frame.count}
                pageSizeOptions={[10, 50, 100, 500]}
                columnHeaderHeight={50}
                disableColumnMenu
                disableRowSelectionOnClick
                disableColumnSorting
                sx={{
                    borderRadius: "0",
                    "& .MuiDataGrid-columnHeaderTitleContainer": {
                        fontWeight: "bold",
                    },
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
    );
});
