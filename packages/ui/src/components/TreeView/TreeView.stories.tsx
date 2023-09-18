import React from "react";
import { TreeView } from "./";
import { styled } from "../../theme";
import { Mail } from "@mui/icons-material";
import { ExpandMore, ChevronRight } from "@mui/icons-material/";

export default {
    title: "Components/TreeView",
    component: TreeView,
    argTypes: {},
};

const StyledTreeView = styled(TreeView)({
    height: 264,
    flexGrow: 1,
    maxWidth: 400,
    overflowY: "auto",
});

const Template = (args) => {
    const [expanded, setExpanded] = React.useState<string[]>([]);
    const [selected, setSelected] = React.useState<string[]>([]);

    const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setExpanded(nodeIds);
    };

    const handleSelect = (event: React.SyntheticEvent, nodeIds: string[]) => {
        setSelected(nodeIds);
    };

    return (
        <StyledTreeView
            {...args}
            aria-label="controlled"
            expanded={expanded}
            selected={selected}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
            defaultCollapseIcon={<ExpandMore />}
            defaultExpandIcon={<ChevronRight />}
            multiSelect
        >
            <TreeView.Item
                nodeId="1"
                icon={<Mail color="primary" />}
                label="All Mail"
            >
                <TreeView.Item nodeId="2" label="Calendar" />
                <TreeView.Item nodeId="3" label="Chrome" />
                <TreeView.Item nodeId="4" label="Webstorm" />
            </TreeView.Item>
            <TreeView.Item nodeId="5" label="Documents">
                <TreeView.Item nodeId="6" label="MUI">
                    <TreeView.Item nodeId="7" label="src">
                        <TreeView.Item nodeId="8" label="index.js" />
                        <TreeView.Item nodeId="9" label="tree-view.js" />
                    </TreeView.Item>
                </TreeView.Item>
            </TreeView.Item>
        </StyledTreeView>
    );
};

export const Default = Template.bind({});

Default.args = {};
