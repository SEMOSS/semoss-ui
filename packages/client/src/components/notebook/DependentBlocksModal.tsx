import { useState, useMemo } from 'react';
import { X, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Button,
    RadioGroup, 
    RadioGroupItem,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Badge,
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@semoss/ui/next';
import { useBlocks } from '@semoss/renderer';

interface CellReplacement {
    label: string;
    options: string[];
}

interface DependentBlocksModalProps {
    open: boolean;
    onClose: () => void;
    onDelete: () => void;
    onReplace: (replacements: { [blockId: string]: string }) => void;
    dependents: string[];
    replacementOptions?: CellReplacement[];
}

export const DependentBlocksModal = (props: DependentBlocksModalProps) => {
    const { 
        open, 
        onClose, 
        onDelete, 
        onReplace,
        dependents, 
        replacementOptions = [],
    } = props;
    const { state } = useBlocks();
    const [replaceOption, setReplaceOption] = useState<string>('replaceAll');
    const [selectedReplacement, setSelectedReplacement] = useState<string>('');
    const [isUsageExpanded, setIsUsageExpanded] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<{
        [key: string]: boolean;
    }>({});
    const [individualReplacements, setIndividualReplacements] = useState<{
        [blockId: string]: string;
    }>({});

    // Derive dependent blocks from dependents using state.getBlock
    const dependentBlocks = useMemo(() => {
        return dependents.map(blockId => {
            const block = state.getBlock(blockId);
            return {
                blockType: block?.widget || 'Unknown',
                blockId: block?.id || blockId,
            };
        });
    }, [dependents, state]);

    const handleReplaceAll = () => {
        if (selectedReplacement) {
            const replacements: { [blockId: string]: string } = {};
            dependentBlocks.forEach(block => {
                replacements[block.blockId] = selectedReplacement;
            });
            onReplace(replacements);
            onClose();
        }
    };

    const handleReplaceIndividual = () => {
        onReplace(individualReplacements);
        onClose();
    };

    const handleDeleteAnyway = () => {
        onDelete();
        onClose();
    };

    const toggleCategory = (label: string) => {
        setExpandedCategories((prev) => ({
            ...prev,
            [label]: !prev[label],
        }));
    };

    const updateIndividualReplacement = (blockId: string, value: string) => {
        setIndividualReplacements((prev) => ({
            ...prev,
            [blockId]: value,
        }));
    };

    const isReplaceIndividualDisabled = () => {
        return dependentBlocks.some(block => !individualReplacements[block.blockId]);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent 
                className="sm:max-w-3xl p-0 gap-0"
                data-testid="delete-cell-modal"
            >
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b space-y-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-base font-semibold">
                            Delete Cell?
                        </DialogTitle>
                    </div>
                </DialogHeader>

                {/* Content */}
                <div className="px-6 py-4">
                    {/* Warning Alert */}
                    <div className="mb-4 p-3 bg-orange-50 border border-orange-300 rounded flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-800 leading-relaxed">
                            This cell is linked to multiple components in your app. Deleting it may cause errors or broken connections.
                        </p>
                    </div>

                    {/* Cell Usage Collapsible Section */}
                    <Collapsible
                        open={isUsageExpanded}
                        onOpenChange={setIsUsageExpanded}
                        className="mb-4"
                    >
                        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:no-underline">
                            <p className="text-sm font-normal text-gray-700">
                                This cell is used in :
                            </p>
                            {isUsageExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div 
                                className="flex flex-wrap gap-2 mt-2"
                                data-testid="delete-cell-modal-usage-list"
                            >
                                {dependents.map((usage, index) => (
                                    <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs font-normal bg-white border-gray-300 text-gray-700 hover:bg-white"
                                        data-testid={`delete-cell-modal-usage-${index}`}
                                    >
                                        {usage}
                                    </Badge>
                                ))}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>

                    {/* Replace Options Section */}
                    <div className="mb-4">
                        <p className="text-sm font-normal text-gray-700 mb-3">
                            You can replace the links below before continuing.
                        </p>
                        <RadioGroup
                            value={replaceOption}
                            onValueChange={setReplaceOption}
                            className="flex items-center gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="replaceAll"
                                    id="replaceAll"
                                    data-testid="delete-cell-modal-replace-all"
                                />
                                <Label
                                    htmlFor="replaceAll"
                                    className="text-sm font-normal cursor-pointer text-gray-900"
                                >
                                    Replace all
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem
                                    value="replaceIndividual"
                                    id="replaceIndividual"
                                    data-testid="delete-cell-modal-replace-individual"
                                />
                                <Label
                                    htmlFor="replaceIndividual"
                                    className="text-sm font-normal cursor-pointer text-gray-900"
                                >
                                    Replace individual
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Replace All - Single Dropdown with Replace Button */}
                    {replaceOption === 'replaceAll' && (
                        <div className="mt-4 space-y-3">
                            <Label htmlFor="replacement" className="text-sm text-gray-700 block font-normal">
                                Replace With
                            </Label>
                            <div className="border border-gray-300 rounded-md bg-white">
                                <Select
                                    value={selectedReplacement}
                                    onValueChange={setSelectedReplacement}
                                >
                                    <SelectTrigger 
                                        id="replacement"
                                        className="w-full border-0 focus:ring-0"
                                        data-testid="delete-cell-modal-replacement-select"
                                    >
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {replacementOptions.length === 0 ? (
                                            <SelectItem value="none" disabled>
                                                No options available
                                            </SelectItem>
                                        ) : (
                                            replacementOptions.map((category) => (
                                                <div key={category.label}>
                                                    <Collapsible
                                                        open={expandedCategories[category.label]}
                                                        onOpenChange={() => toggleCategory(category.label)}
                                                    >
                                                        <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer">
                                                            <span className="font-medium text-gray-900">
                                                                {category.label}
                                                            </span>
                                                            {expandedCategories[category.label] ? (
                                                                <ChevronDown className="h-4 w-4 text-gray-500" />
                                                            ) : (
                                                                <ChevronDown className="h-4 w-4 text-gray-500 -rotate-90" />
                                                            )}
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="pl-4">
                                                            {category.options.map((option) => (
                                                                <SelectItem
                                                                    key={option}
                                                                    value={option}
                                                                    className="text-sm text-gray-700"
                                                                >
                                                                    {option}
                                                                </SelectItem>
                                                            ))}
                                                        </CollapsibleContent>
                                                    </Collapsible>
                                                </div>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleReplaceAll}
                                    disabled={!selectedReplacement}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    data-testid="delete-cell-modal-replace-all-button"
                                >
                                    Replace
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Replace Individual - Table with Multiple Dropdowns */}
                    {replaceOption === 'replaceIndividual' && (
                        <div className="mt-4 space-y-3">
                            <div className="border border-gray-200 rounded-md overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Block Type
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Block ID
                                            </th>
                                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                                                Replace With
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dependentBlocks.map((block, index) => (
                                            <tr key={block.blockId}>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {block.blockType}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {block.blockId}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Select
                                                        value={individualReplacements[block.blockId] || ''}
                                                        onValueChange={(value) => updateIndividualReplacement(block.blockId, value)}
                                                    >
                                                        <SelectTrigger 
                                                            className="w-full border-gray-300"
                                                            data-testid={`delete-cell-modal-replacement-${index}`}
                                                        >
                                                            <SelectValue placeholder="Select" />
                                                        </SelectTrigger>
                                                        <SelectContent className="max-h-[300px]">
                                                            {replacementOptions.length === 0 ? (
                                                                <SelectItem value="none" disabled>
                                                                    No options available
                                                                </SelectItem>
                                                            ) : (
                                                                replacementOptions.map((category) => (
                                                                    <div key={category.label}>
                                                                        <Collapsible
                                                                            open={expandedCategories[`${category.label}-${index}`]}
                                                                            onOpenChange={() => toggleCategory(`${category.label}-${index}`)}
                                                                        >
                                                                            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer">
                                                                                <span className="font-medium text-gray-900">
                                                                                    {category.label}
                                                                                </span>
                                                                                {expandedCategories[`${category.label}-${index}`] ? (
                                                                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                                                                ) : (
                                                                                    <ChevronDown className="h-4 w-4 text-gray-500 -rotate-90" />
                                                                                )}
                                                                            </CollapsibleTrigger>
                                                                            <CollapsibleContent className="pl-4">
                                                                                {category.options.map((option) => (
                                                                                    <SelectItem
                                                                                        key={option}
                                                                                        value={option}
                                                                                        className="text-sm text-gray-700"
                                                                                    >
                                                                                        {option}
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </CollapsibleContent>
                                                                        </Collapsible>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleReplaceIndividual}
                                    disabled={isReplaceIndividualDisabled()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    data-testid="delete-cell-modal-replace-individual-button"
                                >
                                    Replace
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <DialogFooter className="px-6 py-3 border-t flex items-center justify-between sm:justify-between flex-row">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        data-testid="delete-cell-modal-cancel"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteAnyway}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        data-testid="delete-cell-modal-delete-anyway"
                    >
                        Delete Anyway
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
