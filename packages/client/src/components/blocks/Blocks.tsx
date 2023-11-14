import { StateStoreImplementation, Registry } from '@/stores';
import { BlocksContext } from '@/contexts';

export interface BlocksProps<R extends Registry> {
    /** Content to render  */
    children: React.ReactNode;

    /** Store to connect to */
    state: StateStoreImplementation;

    /** Widgets available to all of the blocks */
    registry: R;
}

export const Blocks = <R extends Registry = Registry>(
    props: BlocksProps<R>,
) => {
    const { children, registry, state } = props;

    if (!state) {
        return null;
    }

    return (
        <BlocksContext.Provider
            value={{
                registry: registry,
                state: state,
            }}
        >
            {children}
        </BlocksContext.Provider>
    );
};
