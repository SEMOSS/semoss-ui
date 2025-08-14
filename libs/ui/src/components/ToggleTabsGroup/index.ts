import { ToggleTab } from "./ToggleTab";
import { ToggleTabsGroup, type ToggleTabsProps } from "./ToggleTabsGroup";

const ToggleTabsGroupNameSpace = Object.assign(ToggleTabsGroup, {
	Item: ToggleTab,
});

export type { ToggleTabsProps };

export { ToggleTabsGroupNameSpace as ToggleTabsGroup };
