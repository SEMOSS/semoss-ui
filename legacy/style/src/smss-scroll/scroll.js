function Scroll() {
    var API = {
        initialized: false,
        initialize: initialize,
        isWebkit: undefined,
        isMac: undefined,
        scrollBarWidth: undefined,
        scrollBarHeight: undefined,
    };

    /**
     * @name checkBrowser
     * @desc check the browswer and os
     * @returns {void}
     */
    function checkBrowser() {
        API.isWebkit =
            /webkit/i.test(navigator.userAgent) &&
            !/edge\/\d+/i.test(navigator.userAgent);
        API.isMac = /Mac/i.test(navigator.platform);
    }

    /**
     * @name getScrollDimensions
     * @desc get the dimensions of the scroll
     * @returns {void}
     */
    function getScrollDimensions() {
        //add virtual
        var virtualEle = document.createElement('div');
        virtualEle.style.width = '100px';
        virtualEle.style.height = '100px';
        virtualEle.style.overflow = 'scroll';
        virtualEle.style.position = 'absolute';
        virtualEle.style.top = '-99999px';
        virtualEle.style.left = '-99999px';
        document.body.appendChild(virtualEle);

        //set dimensions
        API.scrollBarWidth = virtualEle.offsetWidth - virtualEle.clientWidth;
        API.scrollBarHeight = virtualEle.offsetHeight - virtualEle.clientHeight;

        //remove virtual
        document.body.removeChild(virtualEle);
    }

    /**
     * @name initialize
     * @desc initialize the module
     * @returns {void}
     */
    function initialize() {
        getScrollDimensions();
        checkBrowser();

        API.initialized = true;
    }

    return API;
}

export default Scroll();
