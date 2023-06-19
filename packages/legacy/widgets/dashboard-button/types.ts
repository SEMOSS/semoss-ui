export enum EVENT_TYPE {
    EXPORT_FILE = 'Export to File',
    EXPORT_DASHBOARD = 'Export Dashboard',
    EXPORT_IMAGE = 'Export Image',
    OPEN_URL = 'Open URL',
    OPEN_INSIGHT = 'Open Insight',
    CUSTOM_SCRIPT = 'Custom Script',
}

export interface options {
    label: string;
    event: EVENT_TYPE;
    eventScript: string;
    eventOptions: {
        // Export to File Event
        file?: 'CSV' | 'TSV' | 'Excel' | 'Text';
        delimiter?: string;

        // Export Dashboard Event
        dashboard?:
            | 'PowerPoint Native'
            | 'PowerPoint Non-Native'
            | 'Excel Native'
            | 'Excel Non-Native';

        // Export Image Event
        imageType?: 'Panel' | 'Sheet';
        imageId?: string;

        // Open URL Event
        url?: string;

        // Open Insight Event
        appId?: string;
        insightId?: string;

        // Custom Script Event
        script?: string;
    };
    style: {
        background: string;
        border: {
            width: {
                size: number;
                unit: 'px' | 'em';
            };
            style: 'none' | 'dotted' | 'dashed' | 'solid' | 'double';
            color: string;
        };
        height: {
            size: number;
            unit: 'px' | 'em' | '%';
        };
        width: {
            size: number;
            unit: 'px' | 'em' | '%';
        };
        color: string;
        fontSize: {
            size: number;
            unit: 'px' | 'em' | '%';
        };
        alignment: {
            horizontal: string;
        };
    };
}

export const FILE_TYPE = {
    CSV: 'toCsv',
    TSV: 'toTsv',
    Excel: 'toExcel',
    Text: 'toTxt',
};
