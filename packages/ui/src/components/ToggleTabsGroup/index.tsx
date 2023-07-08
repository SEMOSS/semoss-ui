import {
    ToggleTabsGroup as _ToggleTabsGroup,
    ToggleTabsProps,
} from "./ToggleTabsGroup";
import { ToggleTab } from "./ToggleTab";

const ToggleTabsGroupNameSpace = Object.assign(_ToggleTabsGroup, {
    Item: ToggleTab,
});

export type { ToggleTabsProps };

export { ToggleTabsGroupNameSpace as ToggleTabsGroup };
