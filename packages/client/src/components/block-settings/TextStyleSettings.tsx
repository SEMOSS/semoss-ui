import { observer } from 'mobx-react-lite';
import { Stack, Typography, ButtonGroup } from '@semoss/ui';
import { BlockDef } from '@/stores';
import { TextStyleSettingButton } from './TextStyleSettingButton';

interface TextStyleSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
}

export const TextStyleSettings = observer(
    <D extends BlockDef = BlockDef>({ id }: TextStyleSettingsProps<D>) => {
        return (
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
            >
                <Typography variant="body2">Style</Typography>
                <Stack
                    direction="row"
                    flex={'1'}
                    justifyContent="end"
                    spacing={2}
                >
                    <ButtonGroup>
                        <TextStyleSettingButton
                            id={id}
                            path="style.fontWeight"
                            type="bold"
                        />
                        <TextStyleSettingButton
                            id={id}
                            path="style.fontStyle"
                            type="italic"
                        />
                        <TextStyleSettingButton
                            id={id}
                            path="style.textDecoration"
                            type="underlined"
                        />
                    </ButtonGroup>
                </Stack>
            </Stack>
        );
    },
);
