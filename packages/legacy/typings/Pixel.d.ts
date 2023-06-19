// Type definitions for Pixel

interface PixelPayload {
    insightID: string;
    commandList: PixelCommand[];
    listeners?: string[];
    direction?: string;
    responseObject?: { response: string; widgetId: string; payload?: any };
    response?: string;
    disableLogging?: boolean;
}

interface PixelReturn {
    isMeta: boolean;
    operationType: string[];
    output: any;
    pixelExpression: string;
    additionalOutput?: any;
}

interface PixelReturnPayload {
    insightID: string;
    pixelReturn: PixelReturn[];
}

interface PixelCommand {
    type: string;
    components: any[];
    terminal?: boolean;
    meta?: boolean;
}

interface PixelChange {
    insight: {
        new?: boolean; // is it a new insight
        closed?: boolean; // has the insight been closed,
        saved?: boolean; // message that it has been recently saved
    };
    alerts: {
        panel: string | boolean;
        color: 'success' | 'warn' | 'error';
        text: string;
    }[];
    frames: {
        frame?: {
            updated: boolean; // has the underlying frame been updated? This is the top message.
            filtered?: boolean; // has the frame been filtered?
            headersChanged?: boolean; // has headers changed for the frame and do we need to fetch new headers?,
            tasks: [];
        };
    };
    presentation?: boolean; // open in presentation
    selected?: string; // selected workbook
    worksheets: {
        sheetId?: {
            added?: boolean; // is this a new worksheet?
            closed?: boolean; // has the worksheet closed?
            configured?: boolean; // has the worksheet been configured?
            worksheet?: {}; // temporary object that shows changes to the worksheet (from the pixel)
        };
    };
    panels: {
        panelId?: {
            added?: boolean; // has the panel been added? this can be a new panel or one that already exists, but is reset
            closed?: boolean; // has the panel closed?
            configured?: boolean; // has the panel been configured?
            panel?: {}; // temporary object that shows changes to the panel (from the pixel)

            filtered?: boolean; // has the panel been filtered
            //task relevant this will probably get broken out with layers
            newTask?: boolean; // has a new task been run
            updatedTask?: boolean; // has a new task been updated?
            view?: boolean; // did the view change for this?,
            ornaments?: boolean; // has ornaments been added
            colorByValue?: boolean; // has colorByValue been added
        };
    };
    messages: {
        //miscellaneous messages
        message: string;
        payload: any;
    }[];
    cached?: boolean;
}
