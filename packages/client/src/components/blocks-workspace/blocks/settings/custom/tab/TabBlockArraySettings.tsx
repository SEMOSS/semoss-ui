import { observer } from "mobx-react-lite";
import { ArraySettings } from "../../shared/ArraySettings";
import { ActionMessages, useBlocks } from "@semoss/renderer";

interface TabBlockArraySettingsProps {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label to display above the array
     */
    label: string;

    /**
     * Path to the array in the block data
     */
    path: string;

    /**
     * Description text to help users understand the setting
     */
    description?: string;

    /**
     * Placeholder text for new items
     */
    placeholder?: string;

    /**
     * Minimum number of items required
     */
    minItems?: number;

    /**
     * Maximum number of items allowed
     */
    maxItems?: number;
}

export const TabBlockArraySettings = observer(({
    id,
    label,
    path,
    description,
    placeholder,
    minItems,
    maxItems,
}: TabBlockArraySettingsProps) => {
    // Pass all the basic props down to ArraySettings

    const { state } = useBlocks();
    // use state.dispatch to update tab block slots

    const addTab = (newItem: string, index: number, allItems: string[]) => {
        console.log('add')

        state.dispatch({
            message: ActionMessages.ADD_DYNAMIC_SLOT,
            payload: {
                id: id
            }
        })
    }

    const removeTab = (removedItem: string, index: number, allItems: string[]) => {
        console.log('remove')

        state.dispatch({
            message: ActionMessages.REMOVE_DYNAMIC_SLOT,
            payload: {
                id: id, 
                indexToRemove: index,
            }
        })

    }

    return (
        <ArraySettings
            id={id}
            label={label}
            path={path}
            description={description}
            placeholder={placeholder}
            minItems={minItems}
            maxItems={maxItems}
            onRemoveItem={removeTab}
            onAddItem={addTab}
        />
    );
})
