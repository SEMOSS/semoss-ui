import { useState } from "react";
import { Button, Dialog, FieldContent, FieldSet } from "@semoss/ui/next";

export const AddPixelModal = (props: {
    isOpen: boolean;
    setPixelOpen: (open: boolean) => void;
    builder: { pixel: string };
    setBuilderField: (field: string, value: string | string[]) => void;
}) => {
    const { isOpen, builder, setBuilderField, setPixelOpen } = props;
    const [pixel, setPixel] = useState(builder.pixel);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => setPixelOpen(open)}
        >
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg mt-10">
                    <FieldSet className="flex h-[625px] flex-col">
                        <legend className="mb-4 font-semibold text-lg">Pixel</legend>
                        <FieldContent className="flex-1">
                            <textarea
                                className="h-full w-full resize-none rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={pixel}
                                onChange={(e) => setPixel(e.target.value)}
                            />
                        </FieldContent>
                        <div className="mt-6 flex justify-end space-x-4">
                            <Button
                                variant="ghost"
                                className="text-gray-600 hover:text-gray-800"
                                onClick={() => setPixelOpen(false)}
                            >
                                Back
                            </Button>
                            <Button
                                variant="default"
                                className="bg-blue-500 text-white hover:bg-blue-600"
                                onClick={() => {
                                    setBuilderField("pixel", pixel);
                                    setPixelOpen(false);
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    </FieldSet>
                </div>
            </div>
        </Dialog>
    );
};