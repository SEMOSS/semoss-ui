'use strict';

export default angular
    .module('app.filters', [])
    .filter('shortenValueFilter', shortenValueFilter)
    .filter(
        'replaceForwardSlashWithCaretFilter',
        replaceForwardSlashWithCaretFilter
    )
    .filter('namespaceFilter', namespaceFilter)
    .filter('relationshipsFilter', relationshipsFilter)
    .filter('startFrom', startFrom)
    .filter('beforeFilter', beforeFilter)
    .filter('afterFilter', afterFilter)
    .filter('shortenAndReplaceUnderscores', shortenAndReplaceUnderscores)
    .filter('replaceUnderscores', replaceUnderscores)
    .filter('replaceSpaces', replaceSpaces)
    .filter('propertyTypeFilter', propertyTypeFilter)
    .filter('reduceStringLength', reduceStringLength)
    // .filter('unsafe', unsafe)
    .filter('toStr', toStr)
    .filter('reverse', reverse)
    .filter('orderByObject', orderByObject)
    .filter('orderObjectBy', orderObjectBy)
    .filter('camelCaseToTitleCase', camelCaseToTitleCase)
    .filter('removeTimeInDate', removeTimeInDate)
    .filter(
        'upperCamelCaseToCapitalizedString',
        upperCamelCaseToCapitalizedString
    )
    .filter('decode', decode);

shortenValueFilter.$inject = [];
replaceForwardSlashWithCaretFilter.$inject = [];
namespaceFilter.$inject = [];
relationshipsFilter.$inject = [];
startFrom.$inject = [];
beforeFilter.$inject = [];
afterFilter.$inject = [];
shortenAndReplaceUnderscores.$inject = [];
replaceUnderscores.$inject = [];
replaceSpaces.$inject = [];
propertyTypeFilter.$inject = [];
reduceStringLength.$inject = [];
// unsafe.$inject = ["$sce"];
toStr.$inject = [];
reverse.$inject = [];
orderByObject.$inject = [];
orderObjectBy.$inject = [];
camelCaseToTitleCase.$inject = [];
removeTimeInDate.$inject = [];
upperCamelCaseToCapitalizedString.$inject = [];
decode.$inject = [];

function orderByObject() {
    return function (items) {
        var sorted = Object.keys(items);
        sorted.sort();

        return sorted;
    };
}

function orderObjectBy() {
    return function (items, field, reverse) {
        function isNumeric(n) {
            return !isNaN(parseFloat(n)) && isFinite(n);
        }

        var filtered = [];

        angular.forEach(items, function (item, key) {
            item.key = key;
            filtered.push(item);
        });

        function index(obj, i) {
            return obj[i];
        }

        filtered.sort(function (a, b) {
            var comparator;
            var reducedA = field.split('.').reduce(index, a).toLowerCase();
            var reducedB = field.split('.').reduce(index, b).toLowerCase();

            if (isNumeric(reducedA) && isNumeric(reducedB)) {
                reducedA = Number(reducedA);
                reducedB = Number(reducedB);
            }

            if (reducedA === reducedB) {
                comparator = 0;
            } else {
                comparator = reducedA > reducedB ? 1 : -1;
            }

            return comparator;
        });

        if (reverse) {
            filtered.reverse();
        }

        return filtered;
    };
}

/* filters */
function shortenValueFilter() {
    // gets last value in url after the /
    return function (str) {
        // convert to string
        str = String(str);
        var returnStr = '',
            shortStr = '',
            myRe;
        if (str.indexOf('"') === 0) {
            shortStr = str.substring(1, str.length);
            returnStr = shortStr.substring(0, shortStr.indexOf('"'));
            return returnStr;
        }
        /*
            This section of the code attempts to figure out if the instance value
            is a URL, and sets it up as a hyperlink if so.

            There are two conditions for a hyperlink:
                1) if the instance value contains the substring 'http://' twice, then we
                    assume that the last occasion of 'http' is the beginning of our hyperlink.
                2) if the instance value contains 'www', 'http', '.com', '.org', '.net', '.edu', 
                    or '.gov', but not 'ontologies', then we assume that it is a hyperlink and not 
                    part of our URI.

            Author: Jason
        */
        if (str.indexOf('http://') !== -1 || str.indexOf('https://') !== -1) {
            var condition1 = str.split('http').length > 2;
            var condition2 =
                str.indexOf('ontologies') == -1 &&
                (str.indexOf('.net') !== -1 ||
                    str.indexOf('www.') !== -1 ||
                    str.indexOf('.edu') !== -1 ||
                    str.indexOf('.com') !== -1 ||
                    str.indexOf('.gov') !== -1 ||
                    str.indexOf('.org') !== -1);
            if (condition1 || condition2) {
                if (str.indexOf('http://') !== -1) {
                    returnStr = str.split('http://');
                } else {
                    returnStr = str.split('https://');
                }
                var instance = returnStr[returnStr.length - 1];
                return (
                    "<a href='http://" +
                    instance +
                    "' target='_blank'>" +
                    instance +
                    '</a>'
                );
            }
            myRe = new RegExp('([^/]*)$');
            returnStr = myRe.exec(str);
            return returnStr[0];
        }

        return str;
    };
}

function replaceForwardSlashWithCaretFilter() {
    return function (str) {
        // console.log('replaceForwardSlashWithUnderscoreFilter ' + str);
        if (str) {
            return str.replace(new RegExp(/\//g), '^');
        }

        return str;
    };
}

function namespaceFilter() {
    // returns value in url before the last / and then takes the last letter off that value
    return function (str) {
        if (str) {
            var myRegExp = new RegExp('^(.*[/])'),
                regStr = myRegExp.exec(str);

            if (regStr !== null) {
                return regStr[0].substring(0, regStr[0].length - 1);
            }
        }

        return str;
    };
}

function relationshipsFilter($filter) {
    // gets last value in url after the /
    return function (data) {
        var returnData = [],
            i = 0;
        if (data) {
            for (i = 0; i < data.length; i++) {
                if (
                    data[i].binding[1].uri[0].Text.indexOf(
                        'http://health.mil/ontologies/dbcm/Relation/'
                    ) !== -1 &&
                    data[i].binding[1].uri[0].Text.indexOf(
                        'http://health.mil/ontologies/dbcm/Relation/Contains'
                    ) === -1 &&
                    data[i].binding[1].uri[0].Text.indexOf(
                        $filter('shortenValueFilter')(
                            data[i].binding[0].uri[0].Text
                        )
                    ) === -1
                ) {
                    returnData.push(data[i]);
                }
            }
            return returnData;
        }

        return data;
    };
}

function startFrom() {
    return function (input, start) {
        if (input) {
            start = +start; // parse to int
            return input.slice(start);
        }

        return;
    };
}

function beforeFilter() {
    // returns everything before the removePt character
    return function (str, removePt) {
        var returnStr = '',
            endPt;
        if (str) {
            if (str.indexOf(removePt) !== -1) {
                endPt = str.indexOf(removePt);
                returnStr = str.substring(0, endPt);
                return returnStr;
            }
            return str;
        }

        return str;
    };
}

function afterFilter() {
    // returns everything after the removePt character
    return function (str, removePt) {
        var returnStr = '',
            startPt;
        if (str) {
            if (str.indexOf(removePt) !== -1) {
                startPt = str.indexOf(removePt) + 1;
                returnStr = str.substring(startPt, str.length);
                return returnStr;
            }

            return str;
        }

        return str;
    };
}

function shortenAndReplaceUnderscores() {
    // will take the string after the last slash and will replaces underscores with spaces
    return function (str) {
        str = String(str);
        var returnStr = '',
            shortStr = '',
            result = '',
            myRe;

        if (str.indexOf('"') === 0) {
            shortStr = str.substring(1, str.length);
            returnStr = shortStr
                .substring(0, shortStr.indexOf('"'))
                .replace(/_/g, ' ');
            return returnStr;
        }
        if (str.indexOf('http://') !== -1) {
            returnStr = '';
            myRe = new RegExp('([^/]*)$');
            shortStr = myRe.exec(str);
            result = shortStr[0].replace(/_/g, ' ');
            /* if (result.length > 20) {
                returnStr = result.replace(/.{20}\S*\s+/g, "$&@").split(/\s+@/);
                if (returnStr.length > 1) {
                return returnStr[0] + "...";
                }

                return returnStr[0];
                }*/

            return result;
        }
        return str.replace(/_/g, ' ');

        return str;
    };
}

function replaceUnderscores() {
    return function (str) {
        str = String(str);
        /* var myRe = new RegExp("([^/]*)$"),
            shortStr = myRe.exec(str),
            result = shortStr[0].replace(/_/g, " ");*/

        var result = str.replace(/_/g, ' ');

        return result;
    };
}

function replaceSpaces() {
    return function (str) {
        str = String(str);
        var myRe = new RegExp('([^/]*)$'),
            shortStr = myRe.exec(str),
            result = shortStr[0].replace(/ /g, '_');

        return result;
    };
}

function propertyTypeFilter() {
    // returns everything after the removePt character
    return function (str) {
        var returnStr = '',
            startPt;
        if (str.indexOf('^^') === -1) {
            return 'string';
        }
        if (str) {
            if (str.indexOf('#') !== -1) {
                startPt = str.indexOf('#') + 1;
                returnStr = str.substring(startPt, str.length);
                return returnStr;
            }

            return str;
        }

        return str;
    };
}

function reduceStringLength() {
    // returns the string
    return function (str, length) {
        if (str) {
            if (!length) {
                length = 15;
            }

            if (str.length > length) {
                return str.substring(0, length) + '...';
            }

            return str;
        }

        return '';
    };
}

/* function unsafe($sce) {
    return $sce.trustAsHtml;
}*/

function toStr() {
    return function (item) {
        return String(item);
    };
}

function reverse() {
    return function (items) {
        if (items !== undefined) {
            return items.slice().reverse();
        }
    };
}

function camelCaseToTitleCase() {
    return function (camelCase) {
        var returnCamel;
        returnCamel = camelCase.replace(/([a-z])([A-Z])/g, '$1 $2');
        returnCamel = returnCamel.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');
        returnCamel = returnCamel.split('');
        returnCamel[0] = returnCamel[0].toUpperCase();
        returnCamel = returnCamel.join('');

        return returnCamel;
    };
}

function removeTimeInDate() {
    var timeRegexStr = 'T.*Z$',
        timeRegex = new RegExp(timeRegexStr, 'g');
    return function (str) {
        str = str.replace(timeRegex, '');

        return str;
    };
}

function upperCamelCaseToCapitalizedString() {
    return function (str) {
        str = String(str);

        // Insert a space before all caps and then replace
        // any spaces after numbers (3 D --> 3D) then trim
        // to get rid of the leading space
        var result = str
            .replace(/([A-Z]+)/g, ' $1')
            .replace(/([0-9])([' '])/g, '$1')
            .trim();

        return result;
    };
}

function decode() {
    return function (str) {
        var decoded = String(str);
        // if component is deformed, or the string itself could be misinterpreted
        // as malformed, just return what the string is
        try {
            return decodeURIComponent(decoded);
        } catch (err) {
            return decoded;
        }
    };
}
