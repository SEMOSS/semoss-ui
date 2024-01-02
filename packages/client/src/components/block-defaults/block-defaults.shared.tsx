import { BlockDef } from '@/stores';
import { ListenerSettings } from '@/components/block-settings';
import { FontSizeSettings } from '../block-settings/custom/FontSizeSettings';
import { SizeSettings } from '../block-settings/shared/SizeSettings';
import { ColorSettings } from '../block-settings/shared/ColorSettings';
import { BorderSettings } from '../block-settings/custom/BorderSettings';
import { ButtonGroupSettings } from '../block-settings/shared/ButtonGroupSettings';
import {
    AlignHorizontalCenter,
    AlignHorizontalLeft,
    AlignHorizontalRight,
    FormatAlignCenter,
    FormatAlignJustify,
    FormatAlignLeft,
    FormatAlignRight,
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    VerticalAlignBottom,
    VerticalAlignCenter,
    VerticalAlignTop,
} from '@mui/icons-material';
import { DistinctPathButtonGroupSettings } from '../block-settings/shared/DistinctPathButtonGroupSettings';
import { SelectInputSettings } from '../block-settings/shared/SelectInputSettings';

/**
 * Build the Layout Section
 */
export const buildLayoutSection = () => ({
    name: 'Layout',
    children: [
        {
            description: 'Vertical Align',
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.alignItems"
                    label="Vertical Align"
                    options={[
                        {
                            value: 'start',
                            icon: VerticalAlignTop,
                            title: 'Top',
                            isDefault: true,
                        },
                        {
                            value: 'center',
                            icon: VerticalAlignCenter,
                            title: 'Center',
                            isDefault: false,
                        },
                        {
                            value: 'end',
                            icon: VerticalAlignBottom,
                            title: 'Bottom',
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
        {
            description: 'Horitzontal Align',
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.justifyContent"
                    label="Horizontal Align"
                    options={[
                        {
                            value: 'left',
                            icon: AlignHorizontalLeft,
                            title: 'Top',
                            isDefault: true,
                        },
                        {
                            value: 'center',
                            icon: AlignHorizontalCenter,
                            title: 'Center',
                            isDefault: false,
                        },
                        {
                            value: 'right',
                            icon: AlignHorizontalRight,
                            title: 'Right',
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
        {
            description: 'Gap',
            render: ({ id }) => (
                <SelectInputSettings
                    id={id}
                    path="style.gap"
                    label="Gap"
                    resizeOnSet
                    options={[
                        {
                            value: '1rem',
                            display: 'Small',
                        },
                        {
                            value: '2rem',
                            display: 'Medium',
                        },
                        {
                            value: '3rem',
                            display: 'Large',
                        },
                        {
                            value: '4rem',
                            display: 'X-Large',
                        },
                    ]}
                    allowUnset
                />
            ),
        },
    ],
});

export const buildTextAlignSection = () => ({
    name: 'Layout',
    children: [
        {
            description: 'Text Align',
            render: ({ id }) => (
                <ButtonGroupSettings
                    id={id}
                    path="style.textAlign"
                    label="Text Align"
                    options={[
                        {
                            value: 'left',
                            icon: FormatAlignLeft,
                            title: 'Left',
                            isDefault: true,
                        },
                        {
                            value: 'right',
                            icon: FormatAlignRight,
                            title: 'Right',
                            isDefault: false,
                        },
                        {
                            value: 'center',
                            icon: FormatAlignCenter,
                            title: 'Center',
                            isDefault: false,
                        },
                        {
                            value: 'justify',
                            icon: FormatAlignJustify,
                            title: 'Justify',
                            isDefault: false,
                        },
                    ]}
                />
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
                <SelectInputSettings
                    id={id}
                    path="style.margin"
                    label="Margin"
                    resizeOnSet
                    options={[
                        {
                            value: 'auto',
                            display: 'Auto',
                        },
                        {
                            value: '1rem',
                            display: 'Small',
                        },
                        {
                            value: '2rem',
                            display: 'Medium',
                        },
                        {
                            value: '3rem',
                            display: 'Large',
                        },
                        {
                            value: '4rem',
                            display: 'X-Large',
                        },
                    ]}
                    allowUnset
                />
            ),
        },
        {
            description: 'Padding',
            render: ({ id }) => (
                <SelectInputSettings
                    id={id}
                    path="style.padding"
                    label="Padding"
                    resizeOnSet
                    options={[
                        {
                            value: '1rem',
                            display: 'Small',
                        },
                        {
                            value: '2rem',
                            display: 'Medium',
                        },
                        {
                            value: '3rem',
                            display: 'Large',
                        },
                        {
                            value: '4rem',
                            display: 'X-Large',
                        },
                    ]}
                    allowUnset
                />
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
 * Build the Color Section
 * @returns a color section
 */
export const buildColorSection = () => ({
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
    ],
});

/**
 * Build the Border Section
 * @returns a border section
 */
export const buildBorderSection = () => ({
    name: 'Border',
    children: [
        {
            description: 'Border',
            render: ({ id }) => <BorderSettings id={id} path="style.border" />,
        },
        {
            description: 'Border Radius',
            render: ({ id }) => (
                <SizeSettings
                    id={id}
                    label="Border Radius"
                    path="style.border-radius"
                />
            ),
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
            render: ({ id }) => (
                <DistinctPathButtonGroupSettings
                    id={id}
                    label="Style"
                    options={[
                        {
                            value: 'bold',
                            icon: FormatBold,
                            path: 'style.fontWeight',
                            title: 'Bold',
                            isDefault: false,
                        },
                        {
                            value: 'italic',
                            icon: FormatItalic,
                            path: 'style.fontStyle',
                            title: 'Italic',
                            isDefault: false,
                        },
                        {
                            value: 'underline',
                            icon: FormatUnderlined,
                            path: 'style.textDecoration',
                            title: 'Underlined',
                            isDefault: false,
                        },
                    ]}
                />
            ),
        },
        {
            description: 'Font',
            render: ({ id }) => (
                <SelectInputSettings
                    id={id}
                    path="style.fontFamily"
                    label="Font"
                    options={[
                        {
                            value: 'Roboto',
                            display: 'Roboto',
                        },
                        {
                            value: 'Helvetica',
                            display: 'Helvetica',
                        },
                        {
                            value: 'Arial',
                            display: 'Arial',
                        },
                        {
                            value: 'Times New Roman',
                            display: 'Times New Roman',
                        },
                        {
                            value: 'Georgia',
                            display: 'Georgia',
                        },
                    ]}
                    allowUnset
                />
            ),
        },
        {
            description: 'Font Size',
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
 * Build the Listener Section
 * @returns the Listener Section
 */
export const buildListener = <D extends BlockDef = BlockDef>(
    trigger: Extract<keyof D['listeners'], string>,
) => [
    {
        description: trigger,
        render: ({ id }) => <ListenerSettings id={id} listener={trigger} />,
    },
];
