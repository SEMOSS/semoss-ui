import { observer } from 'mobx-react-lite';
import { Stack, Typography, ButtonGroup } from '@semoss/ui';
import { Paths } from '@/types';
import { Block, BlockDef } from '@/stores';
import { DistinctPathButtonGroupButton } from './DistinctPathButtonGroupButton';

/**
 * Each button in this component points to a distinct path
 * Used when buttons should thematically be grouped together but don't point to the same
 * underlying style path
 */

interface DistinctPathButtonGroupSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Label for setting
     */
    label: string;

    /**
     * Button options
     */
    options: Array<{
        value: string;
        icon: any;
        path: Paths<Block<D>['data'], 4>;
        title: string;
        isDefault: boolean;
    }>;
}

export const DistinctPathButtonGroupSettings = observer(
    <D extends BlockDef = BlockDef>({
        id,
        label,
        options,
    }: DistinctPathButtonGroupSettingsProps<D>) => {
        return (
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
            >
                <Typography variant="body2">{label}</Typography>
                <Stack
                    direction="row"
                    flex={'1'}
                    justifyContent="end"
                    spacing={2}
                >
                    <ButtonGroup>
                        {Array.from(options, (option, i) => {
                            return (
                                <DistinctPathButtonGroupButton
                                    key={i}
                                    id={id}
                                    path={option.path}
                                    styleValue={option.value}
                                    title={option.title}
                                    isDefault={option.isDefault}
                                    ButtonIcon={option.icon}
                                />
                            );
                        })}
                    </ButtonGroup>
                </Stack>
            </Stack>
        );
    },
);
