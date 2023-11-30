import { BlockDef } from '@/stores';
import {
    InputSettings,
    JsonSettings,
    ListenerSettings,
} from '@/components/block-settings';
import { TextAlignSettings } from '../block-settings/TextAlignSettings';
import { VerticalAlignSettings } from '../block-settings/VerticalAlignSettings';
import { HorizontalAlignSettings } from '../block-settings/HorizontalAlignSettings';
import { SpacingSettings } from '../block-settings/SpacingSettings';
import { TextStyleSettings } from '../block-settings/TextStyleSettings';
import { FontFamilySettings } from '../block-settings/FontFamilySettings';
import { FontSizeSettings } from '../block-settings/FontSizeSettings';
import { SizeSettings } from '../block-settings/SizeSettings';
import { ColorSettings } from '../block-settings/ColorSettings';
import { BorderSettings } from '../block-settings/BorderSettings';

/**
 * Build the Editor Section
 * @returns an editor section
 */
export const buildEditorSection = () => ({
    name: 'Dimensions',
    children: [
        {
            description: 'Edit the underlying block data',
            render: ({ id }) => <JsonSettings id={id} />,
        },
    ],
});

/**
 * Build the Layout Section
 */
export const buildLayoutSection = () => ({
    name: 'Layout',
    children: [
        {
            description: 'Vertical Align',
            render: ({ id }) => (
                <VerticalAlignSettings id={id} path="style.alignItems" />
            ),
        },
        {
            description: 'Horitzontal Align',
            render: ({ id }) => (
                <HorizontalAlignSettings id={id} path="style.justifyContent" />
            ),
        },
        {
            description: 'Gap',
            render: ({ id }) => (
                <SpacingSettings id={id} label="Gap" path="style.gap" />
            ),
        },
    ],
});

/**
 * Build the Spacing Section
 * @returns a spacing section
 */
export const buildSpacingSection = () => ({
    name: 'Spacing',
    children: [
        {
            description: 'Margin',
            render: ({ id }) => (
                <SpacingSettings id={id} label="Margin" path="style.margin" />
            ),
        },
        {
            description: 'Padding',
            render: ({ id }) => (
                <SpacingSettings id={id} label="Padding" path="style.padding" />
            ),
        },
    ],
});

/**
 * Build the Dimensions Section
 * @returns a dimension section
 */
export const buildDimensionsSection = () => ({
    name: 'Dimensions',
    children: [
        {
            description: 'Width',
            render: ({ id }) => (
                <SizeSettings id={id} label="Width" path="style.width" />
            ),
        },
        {
            description: 'Max Width',
            render: ({ id }) => (
                <SizeSettings id={id} label="Max Width" path="style.maxWidth" />
            ),
        },
        {
            description: 'Height',
            render: ({ id }) => (
                <SizeSettings id={id} label="Height" path="style.height" />
            ),
        },
        {
            description: 'Max Height',
            render: ({ id }) => (
                <SizeSettings
                    id={id}
                    label="Max Height"
                    path="style.maxHeight"
                />
            ),
        },
    ],
});

/**
 * Build the Style Section
 * @returns a style section
 */
export const buildStyleSection = () => ({
    name: 'Color',
    children: [
        {
            description: 'Background Color',
            render: ({ id }) => (
                <ColorSettings
                    id={id}
                    label="Background Color"
                    path="style.backgroundColor"
                />
            ),
        },
        {
            description: 'Color',
            render: ({ id }) => (
                <ColorSettings id={id} label="Color" path="style.color" />
            ),
        },
        {
            description: 'Border',
            render: ({ id }) => <BorderSettings id={id} path="style.border" />,
        },
    ],
});

/**
 * Build the Typography Section
 * @returns a typography section
 */
export const buildTypographySection = () => ({
    name: 'Text',
    children: [
        {
            description: 'Style',
            render: ({ id }) => <TextStyleSettings id={id} />,
        },
        {
            description: 'Font',
            render: ({ id }) => (
                <FontFamilySettings id={id} path="style.fontFamily" />
            ),
        },
        {
            description: 'Type',
            render: ({ id }) => (
                <FontSizeSettings
                    id={id}
                    sizePath="style.fontSize"
                    weightPath="style.fontWeight"
                />
            ),
        },
    ],
});

/**
 * Build the Listeners Section
 * @returns the Listener Section
 */
export const buildListenersSection = <D extends BlockDef = BlockDef>(
    triggers: Extract<keyof D['listeners'], string>[] = [],
) => ({
    name: 'Listeners',
    children: [
        ...triggers.map((t) => ({
            description: t,
            render: ({ id }) => <ListenerSettings id={id} listener={t} />,
        })),
    ],
});
