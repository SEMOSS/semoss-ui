import { Position } from 'react-flow-renderer';

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
const getNodeIntersection = (intersectionNode, targetNode) => {
    // https://math.stackexchange.com/questions/1724792/an-algorithm-for-finding-the-intersection-point-between-a-center-of-vision-and-a
    const {
        width: intersectionNodeWidth,
        height: intersectionNodeHeight,
        positionAbsolute: intersectionNodePosition,
    } = intersectionNode;
    const targetPosition = targetNode.positionAbsolute;

    const w = intersectionNodeWidth / 2;
    const h = intersectionNodeHeight / 2;

    const x2 = intersectionNodePosition.x + w;
    const y2 = intersectionNodePosition.y + h;
    const x1 = targetPosition.x + w;
    const y1 = targetPosition.y + h;

    const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
    const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
    const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
    const xx3 = a * xx1;
    const yy3 = a * yy1;
    const x = w * (xx3 + yy3) + x2;
    const y = h * (-xx3 + yy3) + y2;

    return { x, y };
};

// returns the position (top,right,bottom or right) passed node compared to the intersection point
const getEdgePosition = (node, intersectionPoint) => {
    const n = { ...node.positionAbsolute, ...node };
    const nx = Math.round(n.x);
    const ny = Math.round(n.y);
    const px = Math.round(intersectionPoint.x);
    const py = Math.round(intersectionPoint.y);

    if (px <= nx + 1) {
        return Position.Left;
    }
    if (px >= nx + n.width - 1) {
        return Position.Right;
    }
    if (py <= ny + 1) {
        return Position.Top;
    }
    if (py >= n.y + n.height - 1) {
        return Position.Bottom;
    }

    return Position.Top;
};

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
export const getEdgeParams = (source, target) => {
    const sourceIntersectionPoint = getNodeIntersection(source, target);
    const targetIntersectionPoint = getNodeIntersection(target, source);

    const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
    const targetPos = getEdgePosition(target, targetIntersectionPoint);

    return {
        sx: sourceIntersectionPoint.x,
        sy: sourceIntersectionPoint.y,
        tx: targetIntersectionPoint.x,
        ty: targetIntersectionPoint.y,
        sourcePos,
        targetPos,
    };
};

// returns data type format options
export const getDefaultOptions = () => {
    let formatOptions = [];
    formatOptions = [
        {
            display: 'String',
            value: 'STRING',
            formats: [],
        },
        {
            display: 'Integer',
            value: 'INT',
            formats: [
                {
                    display: '1000',
                    value: 'int_default',
                    isDefault: true,
                },
                {
                    display: '1,000',
                    value: 'int_comma',
                },
                {
                    display: '$1000',
                    value: 'int_currency',
                },
                {
                    display: '$1,000',
                    value: 'int_currency_comma',
                },
                {
                    display: '10%',
                    value: 'int_percent',
                },
                {
                    display: '1.00k',
                    value: 'thousand',
                },
                {
                    display: '1.00M',
                    value: 'million',
                },
                {
                    display: '1.00B',
                    value: 'billion',
                },
                {
                    display: '1.00T',
                    value: 'trillion',
                },
                {
                    display: 'Accounting ($)',
                    value: 'accounting',
                },
                {
                    display: 'Scientific (1.00E+03)',
                    value: 'scientific',
                },
                {
                    value: 'Custom',
                    display: 'Custom Number Format',
                    options: {
                        dimension: '',
                        dimensionType: '',
                        model: '',
                        type: 'Default',
                        delimiter: 'Default',
                        prepend: '',
                        append: '',
                        round: 0,
                        appliedString: '',
                        layout: '',
                        date: 'Default',
                    },
                },
            ],
        },
        {
            display: 'Double',
            value: 'DOUBLE',
            formats: [
                {
                    display: '1000.00',
                    value: 'double_round2',
                    isDefault: true,
                },
                {
                    display: '1000.0',
                    value: 'double_round1',
                },
                {
                    display: '1000.000',
                    value: 'double_round3',
                },
                {
                    display: '1,000.0',
                    value: 'double_comma_round1',
                },
                {
                    display: '1,000.00',
                    value: 'double_comma_round2',
                },
                {
                    display: '$1,000.00',
                    value: 'double_currency_comma_round2',
                },
                {
                    display: '10.0%',
                    value: 'double_percent_round1',
                },
                {
                    display: '10.00%',
                    value: 'double_percent_round2',
                },
                {
                    display: '1.00k',
                    value: 'thousand',
                },
                {
                    display: '1.00M',
                    value: 'million',
                },
                {
                    display: '1.00B',
                    value: 'billion',
                },
                {
                    display: '1.00T',
                    value: 'trillion',
                },
                {
                    display: 'Accounting ($)',
                    value: 'accounting',
                },
                {
                    display: 'Scientific (1.00E+03)',
                    value: 'scientific',
                },
                {
                    value: 'Custom',
                    display: 'Custom Number Format',
                    options: {
                        dimension: '',
                        dimensionType: '',
                        model: '',
                        type: 'Default',
                        delimiter: 'Default',
                        prepend: '',
                        append: '',
                        round: 2,
                        appliedString: '',
                        layout: '',
                        date: 'Default',
                    },
                },
            ],
        },
        {
            display: 'Date',
            value: 'DATE',
            formats: [
                {
                    display: '1879-03-14',
                    value: 'yyyy-MM-dd',
                    isDefault: true,
                },

                {
                    display: '03/14/1879',
                    value: 'MM/dd/yyyy',
                },
                {
                    display: '3/14/1879',
                    value: 'M/d/yyyy',
                },

                {
                    display: '03/14/79',
                    value: 'MM/dd/yy',
                },

                {
                    display: '03/14',
                    value: 'MM/dd',
                },

                {
                    display: 'March 14, 1879',
                    value: 'MMMMM d, yyyy',
                },

                {
                    display: '14-Mar',
                    value: 'dd-MMM',
                },

                {
                    display: '14-Mar-79',
                    value: 'dd-MMM-yy',
                },

                {
                    display: '14-Mar-1879',
                    value: 'dd-MMM-yyyy',
                },

                {
                    display: 'Mar-79',
                    value: 'MMM-yy',
                },

                {
                    display: 'Friday, March 14, 1879',
                    value: 'EEEEE, MMMMM d, yyyy',
                },
                {
                    display: '1879',
                    value: 'yyyy',
                },
                {
                    display: '187903',
                    value: 'yyyyMM',
                },
                {
                    display: '18790314',
                    value: 'yyyyMMdd',
                },
                {
                    display: 'Custom Date Format',
                    value: 'Custom',
                    options: {
                        dimension: '',
                        dimensionType: '',
                        model: '',
                        type: 'Default',
                        delimiter: 'Default',
                        prepend: '',
                        append: '',
                        round: '',
                        appliedString: '',
                        layout: '',
                        date: '',
                    },
                },
            ],
        },
        {
            display: 'Timestamp',
            value: 'TIMESTAMP',
            formats: [
                {
                    display: '1879-03-14 13:30:55',
                    value: 'yyyy-MM-dd HH:mm:ss',
                    isDefault: true,
                },
                {
                    display: '1879-03-14 1:30 PM',
                    value: 'yyyy-MM-dd hh:mm a',
                },
                {
                    display: '1879-03-14 13:30',
                    value: 'yyyy-MM-dd HH:mm',
                },
                {
                    display: '1879-03-14 1:30',
                    value: 'yyyy-MM-dd hh:mm',
                },
                {
                    display: '3/14/79 13:30:55',
                    value: 'M/d/yy HH:mm:ss',
                },
                {
                    display: '3/14/79 1:30 PM',
                    value: 'M/d/yy hh:mm a',
                },
                {
                    display: '3/14/79 13:30',
                    value: 'M/d/yy HH:mm',
                },
                {
                    display: '3/14/79 1:30',
                    value: 'M/d/yy hh:mm',
                },
                {
                    display: 'Custom Timestamp Format',
                    value: 'Custom',
                    options: {
                        dimension: '',
                        dimensionType: '',
                        model: '',
                        type: 'Default',
                        delimiter: 'Default',
                        prepend: '',
                        append: '',
                        round: '',
                        appliedString: '',
                        layout: '',
                        date: '',
                    },
                },
            ],
        },
    ];
    return formatOptions;
};
