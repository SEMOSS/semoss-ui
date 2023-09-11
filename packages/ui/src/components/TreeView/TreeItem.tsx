import { SxProps, Box } from "@mui/material";
import { TreeItem as MuiTreeItem } from "@mui/x-tree-view/";
import { styled } from "../../theme";

export interface TreeItemProps {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
    /**
     * The icon used to collapse the node.
     */
    collapseIcon?: React.ReactNode;
    /**
     * If `true`, the node is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * The icon displayed next to an end node.
     */
    endIcon?: React.ReactNode;
    /**
     * The icon used to expand the node.
     */
    expandIcon?: React.ReactNode;
    /**
     * The icon to display next to the tree node's label.
     */
    icon?: React.ReactNode;
    /**
     * The tree node label.
     */
    label?: React.ReactNode;
    /**
     * The tree node label.
     */
    labelText: React.ReactNode;
    /**
     * The tree node label.
     */
    labelEndContent?: React.ReactNode;
    /**
     * The id of the node.
     */
    nodeId: string;
    /**
     * The system prop that allows defining system overrides as well as additional CSS styles.
     */
    sx?: SxProps;
}

const StyledContainer = styled(Box)({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    verticalAlign: "middle",
});
const StyledBox = styled(Box)({
    display: "inline-flex",
    verticalAlign: "middle",
});

export const TreeItem = (props: TreeItemProps) => {
    return (
        <MuiTreeItem
            label={
                <StyledContainer>
                    <Box>{props.labelText}</Box>
                    <StyledBox>{props.labelEndContent}</StyledBox>
                </StyledContainer>
            }
            {...props}
        />
    );
};
