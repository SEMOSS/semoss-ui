import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Box, CircularProgress, LinearProgress, Skeleton } from "@semoss/ui";
import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";

export interface LoaderBlockDef extends BlockDef<"loader"> {
    widget: "loader";
    data: {
        style: CSSProperties;
        variant: any;
        color: "primary" | "secondary" | "success" | "warning" | "error";
        size: number;
        thickness: number;
        show: string;
        type: string;
        width: string;
        height: string;
        animation: "pulse" | "wave" | false;
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

export const LoaderBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<LoaderBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);
    // Function to render the loader based on the type specified in the data
    const renderLoader = () => {
        // Check if the loader type is "circular"
        if (data.type === "circular") {
            // Render a circular loader
            return (
                <Box
                    sx={{
                        position: "relative",
                    }}
                >
                    <CircularProgress
                        variant="determinate"
                        value={100}
                        thickness={data.thickness}
                        size={data.size}
                        disableShrink={true}
                        sx={{ color: "#e0e0e0" }}
                    />
                    <Box
                        sx={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                        }}
                    >
                        <CircularProgress
                            variant={data.variant}
                            thickness={data.thickness}
                            size={data.size}
                            color={data.color}
                            {...attrs}
                        />
                    </Box>
                </Box>
            );
        }
        // Check if the loader type is "linear"
        else if (data.type === "linear") {
            // Render a linear loader
            return (
                <LinearProgress
                    variant={data.variant}
                    color={data.color}
                    {...attrs}
                />
            );
        }
        // Check if the loader type is "skeleton"
        else if (data.type === "skeleton") {
            // Render a skeleton
            return (
                <Skeleton
                    variant={data.variant}
                    width={data.width}
                    height={data.height}
                    animation={data.animation}
                    {...attrs}
                />
            );
        }
        return null;
    };
    // Return null if no valid loader type is specified
    return <>{renderLoader()}</>;
});
