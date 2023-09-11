import React from "react";
import { TreeView } from "./";
import { ExpandMore, ChevronRight } from "@mui/icons-material/";

export default {
    title: "Components/TreeView",
    component: TreeView,
    argTypes: {},
};

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
        <TreeView
            {...args}
            aria-label="controlled"
            defaultCollapseIcon={<ExpandMore />}
            defaultExpandIcon={<ChevronRight />}
            expanded={expanded}
            selected={selected}
            onNodeToggle={handleToggle}
            onNodeSelect={handleSelect}
            multiSelect
        >
            <TreeView.Item nodeId="1" label="Applications">
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
        </TreeView>
    );
};

export const Default = Template.bind({});

Default.args = {};
