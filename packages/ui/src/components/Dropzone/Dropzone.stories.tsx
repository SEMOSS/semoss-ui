import type { Meta, StoryObj } from '@storybook/react';
import { DropzoneArea } from '../Dropzone/index';

const meta: Meta<typeof DropzoneArea> = {
    title: 'Components/Dropzone',
    component: DropzoneArea,
}

export default meta;

type Story = StoryObj<typeof DropzoneArea>

export const Default: Story = {
    render: () => 
    <>
        <DropzoneArea />
        <div>There are a lot of functions built into the useDropzone function. One of them is acceptedFiles which is a very useful array</div>
        <div>https://react-dropzone.org/</div>
    </>
}