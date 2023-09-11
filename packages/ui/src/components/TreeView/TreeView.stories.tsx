import React from "react";
import { TreeView } from "./";
import { styled } from "../../theme";
import { Mail, StarRounded } from "@mui/icons-material";
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

const StyledIcon = styled(StarRounded)({
    fontSize: "16px",
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
            multiSelect
        >
            <TreeView.Item
                nodeId="1"
                icon={<Mail color="primary" />}
                labelText="All Mail"
                labelEndContent={<StyledIcon />}
            >
                <TreeView.Item nodeId="2" labelText="Calendar" />
                <TreeView.Item nodeId="3" labelText="Chrome" />
                <TreeView.Item nodeId="4" labelText="Webstorm" />
            </TreeView.Item>
            <TreeView.Item nodeId="5" labelText="Documents">
                <TreeView.Item nodeId="6" labelText="MUI">
                    <TreeView.Item nodeId="7" labelText="src">
                        <TreeView.Item nodeId="8" labelText="index.js" />
                        <TreeView.Item nodeId="9" labelText="tree-view.js" />
                    </TreeView.Item>
                </TreeView.Item>
            </TreeView.Item>
        </StyledTreeView>
    );
};

export const Default = Template.bind({});

Default.args = {};
