import { ToggleTabsGroup, ToggleTabsProps } from "./ToggleTabsGroup";
import { ToggleTab } from "./ToggleTab";

const ToggleTabsGroupNameSpace = Object.assign(ToggleTabsGroup, {
    Item: ToggleTab,
});

export type { ToggleTabsProps };

export { ToggleTabsGroupNameSpace as ToggleTabsGroup };
