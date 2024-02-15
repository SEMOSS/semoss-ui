import { useBlockSettings } from '@/hooks';
import { observer } from 'mobx-react-lite';

interface ConditionalVariationSettingsProps {
    /**
     * Setting to render
     */
    children: React.ReactNode;

    /**
     * Block id
     */
    id: string;

    /**
     * Variations to render for
     */
    variations?: string[] | undefined;
}

export type ConditionalVariationSettingsComponent = (
    props: ConditionalVariationSettingsProps,
) => JSX.Element;

export const ConditionalVariationSettings: ConditionalVariationSettingsComponent =
    observer(({ children, id, variations = undefined }) => {
        const { data } = useBlockSettings(id);

        // we want to show the settings for specific variations but the block doesn't have one defined or the block's variation is not in list
        if (
            Array.isArray(variations) &&
            (!data?.variation ||
                !variations.includes(data?.variation as string))
        ) {
            return <></>;
        }

        // we want to show the settings for the generic version but the block is a specific variation
        if (variations === undefined && !!data?.variation) {
            return <></>;
        }

        return <>{children}</>;
    });
