import * as d3 from 'd3';

var comment = function (configObj) {
    this.chartDiv = d3.select('#chart-container');
    this.mode = configObj.mode;
    this.onSaveCallback = configObj.onSaveCallback;
    this.showComments = false;
    this.tempComments = configObj.comments;
};

comment.prototype.isSameLocation = function (x1, x2, y1, y2) {
    return Math.round(x1) === Math.round(x2) && Math.round(y1) === Math.round(y2);
};

/**
* @name setCommentsList
* @desc sets the appropriate comments object for a comments object
* @param {object} comments - list of comments to paint
* @return {comments} - object with comments list and max id
*/
comment.prototype.setCommentsList = function (comments = {}) {
    var newComments =
        {
            list: {},
            maxId: 0
        },
        keys = Object.keys(comments);

    if (keys.length > 0) {
        newComments.list = comments;
        newComments.maxId = Math.max(...Object.keys(newComments.list));
        if (Number.isNaN(newComments.maxId)) {
            newComments.maxId = 0;
        }
    }
    return newComments;
};

/**
* @name rescale
* @desc sets the children of the ele param to 100 percent height and width
* @param {d3node} ele - node to start recursive function
* @param {htmlNode} commentNode - unused parent node that can be used to calcualte percent height and widths
* @return {undefined} - no return
*/
comment.prototype.rescale = function (ele, commentNode) {
    var node = ele.node(),
        width = 100,
        height = 100;

    if (ele && ele.node() && (ele.node().nodeName.indexOf('DIV') > -1 || ele.node().nodeName.indexOf('IFRAME') > -1)) {
        ele.style('width', width + '%');
        ele.style('height', height + '%');
        for (let child of node.childNodes) {
            this.rescale(d3.select(child), commentNode);
        }
    }
};

comment.prototype.rescaleComment = function (bindingObj, chartRectObj) {
    var newHeight = chartRectObj.height,
        newWidth = chartRectObj.width,
        oldHeight = bindingObj.clientHeight,
        oldWidth = bindingObj.clientWidth,
        newBindingObj = bindingObj;

    newBindingObj.clientHeight = newHeight;
    newBindingObj.clientWidth = newWidth;
    newBindingObj.y = Math.round((newHeight / oldHeight) * bindingObj.y);
    newBindingObj.x = Math.round((newWidth / oldWidth) * bindingObj.x);

    return newBindingObj;
};

comment.prototype.generateComment = function (text) {
    var commentText = text || '',
        html = '<div id="smss-comment" class="smss-comment">' +
            '    <div class="smss-comment-header-section">';

    if (commentText !== '') {
        html += '        <div class="smss-comment-title">Edit Comment</div>';
    } else {
        html += '        <div class="smss-comment-title">Add New Comment</div>';
    }

    html += '        <div class="smss-comment-exit-btn" id="cancel">' +
            '            <i class="fa fa-times"></i>' +
            '        </div>' +
            '    </div>' +
            '    <div class="smss-comment-textarea-container">' +
            '        <textarea rows="3" id="comment-textarea" class="smss-textarea" placeholder="Enter comment here...">' + commentText + '</textarea>' +
            '    </div>' +
            '    <div class="smss-comment-checkbox">' +
            '        <div class="smss-comment-radio-container">' +
            '            <label class="smss-checkbox">' +
            '                <input class="smss-checkbox-input" type="checkbox" id="displayAsMarker"></input>' +
            '                <span class="smss-checkbox-mark"></span>' +
            '            </label>' +
            '        </div>' +
            '        <div class="smss-comment-radio-desc">Appear as Marker</div>' +
            '    </div>' +
            '    <div class="smss-comment-checkbox">' +
            '        <div class="smss-comment-radio-container">' +
            '            <label class="smss-checkbox">' +
            '                <input class="smss-checkbox-input" type="checkbox" id="appearGlobally"></input>' +
            '                <span class="smss-checkbox-mark"></span>' +
            '            </label>' +
            '        </div>' +
            '        <div class="smss-comment-radio-desc">Show on any Visualization</div>' +
            '    </div>' +
            '    <div class="smss-comment-submit-section">';

    if (commentText !== '') {
        html += '    <smss-btn class="smss-btn--text" id="delete">Delete</smss-btn>';
    }

    html += '        <smss-btn id="submit">Submit</smss-btn>' +
            '    </div>' +
            '</div>';

    return html;
};

/**
* @name makeComment
* @desc creates the comment entry box on the screen and attaches listeners to the save delete and cancel options
* @param {object} event - event that holds the mouse position for where the user wants to place the comment
* @return {undefined} - no return
*/
comment.prototype.makeComment = function () {
    var commentObj = this,
        x = parseInt(d3.mouse(this.chartDiv.node())[0], 10),
        y = parseInt(d3.mouse(this.chartDiv.node())[1], 10),
        commentHeight = 218,
        commentWidth = 248,
        position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y),
        commentType = 'echarts',
        commentDiv,
        vizType = commentObj.chartDiv._groups[0][0].parentElement.nodeName.split('-')[0],
        smssComment = d3.select('.smss-comment-container')._groups[0][0];

    if (smssComment) {
        return;
    }

    commentObj.chartDiv.selectAll('.smss-comment-popout').remove();
    commentObj.showComments = false;
    commentDiv = commentObj.chartDiv.append('div')
        .attr('class', 'smss-comment-container')
        .style('opacity', 1)
        .on('mouseover', function () {
            d3.event.stopPropagation();
        })
        .html(commentObj.generateComment())
        .style('position', 'absolute')
        .style('left', position.x + 'px')
        .style('top', position.y + 'px');

    commentDiv.select('.smss-textarea')
        .node().focus();

    commentDiv.select('#cancel')
        .on('click.delete', commentObj.removeComment.bind(commentObj));

    commentDiv.select('#submit')
        .on('click.save', () => {
            var commentText = commentDiv.select('#comment-textarea')._groups[0][0].value,
                showAsMarker = commentDiv.select('#displayAsMarker')._groups[0][0].checked,
                alwaysDisplay = commentDiv.select('#appearGlobally')._groups[0][0].checked,
                newCommentObj;

            newCommentObj = {
                'commentText': commentText,
                'type': commentType,
                'binding': {
                    'x': x,
                    'y': y,
                    'clientWidth': commentObj.chartDiv._groups[0][0].clientWidth,
                    'clientHeight': commentObj.chartDiv._groups[0][0].clientHeight,
                    'showAsMarker': showAsMarker ? 'true' : 'false',
                    'height': false,
                    'width': false
                },
                'vizType': vizType,
                'alwaysDisplay': alwaysDisplay
            };
            commentDiv.remove();

            if (isNaN(commentObj.comments.maxId)) {
                commentObj.comments.maxId = -1;
            }

            commentObj.onSaveCallback(newCommentObj, ++commentObj.comments.maxId, 'add');
        });
};

/**
* @name removeComment
* @desc function to remove comment entry box
* @return {undefined} - no return
*/
comment.prototype.removeComment = function () {
    this.chartDiv.selectAll('.smss-comment-container').remove();
};

/**
* @name overlayDivPosition
* @desc function to determine the placement of the div on the visual
* @param {number} divWidth - width of the comment entry box
* @param {number} divHeight - height of the comment entry box
* @param {number} mouseX - x position of the click event
* @param {number} mouseY - y position of the click event
* @return {object} - position of div
*/
comment.prototype.overlayDivPosition = function (divWidth, divHeight, mouseX, mouseY) {
    let editObj = this,
        position = {
            x: mouseX,
            y: mouseY + 10
        };
    if (mouseX > parseInt(editObj.chartDiv.style('width'), 10) / 2) {
        position.x = mouseX - divWidth;
    }
    if (mouseY - divHeight - 10 > 0) {
        position.y = mouseY - divHeight - 10;
    }
    return position;
};

/**
* @name createMoveListener
* @desc creates the mousemove listener to determine if the user moves or resizes a comment
* @param {object} commentNode - comment that the user clicked on
* @return {undefined} - no return
*/
comment.prototype.createMoveListener = function (commentNode) {
    var commentObj = this,
        timeMouseDown = new Date().getTime();

    commentObj.moved = null;

    commentObj.chartDiv.on('mousemove', function () {
        // mouse move happend too quickly, chrome bug
        var timeMouseMove = new Date().getTime(),
            node = commentNode.node(),
            mouseOnComment = d3.mouse(commentNode.node()),
            mouseOnChartDiv = d3.mouse(commentObj.chartDiv.node()),
            resizeNode;

        if (timeMouseDown + 10 > timeMouseMove) {
            return;
        }

        // set the moved node, so we know to do a mouse up event
        commentObj.moved = commentNode;

        // resize in the right corner of the comment
        if (commentNode.select('.comment-padding')._groups[0][0] && ((mouseOnComment[0] + 15 > node.clientWidth && mouseOnComment[1] + 15 > node.clientHeight) || commentObj.moved.mouse)) {
            if (!commentObj.moved.mouse) {
                resizeNode = commentNode.select('.comment-padding');
                resizeNode.style('width', 'auto');
                resizeNode.style('height', 'auto');
            }
            // set the mouse event so we can update the location on mouse up
            commentObj.moved.mouse = mouseOnChartDiv;
        } else {
            // move the comment node around the visual
            if (commentNode._groups[0][0].nodeName === 'text') {
                commentObj.chartDiv.select('.smss-comment-popout').remove();
            }
            commentNode
                .style('left', mouseOnChartDiv[0] + 'px')
                .style('top', mouseOnChartDiv[1] + 'px');
            commentNode
                .attr('x', mouseOnChartDiv[0])
                .attr('y', mouseOnChartDiv[1]);
        }
    });
};

/**
* @name updatePosition
* @desc determines whether the user dragged a comment on the screen or updated its size and then creates the appropriate save function
* @return {undefined} - no return
*/
comment.prototype.updatePosition = function () {
    let commentObj = this,
        nodeToUpdate = commentObj.moved._groups[0][0],
        nodeId = nodeToUpdate.id.split('node')[1],
        commentText = commentObj.comments.list[nodeId],
        x,
        y;
    if (Array.isArray(commentObj.moved.mouse)) {
        commentText.binding.width = commentObj.moved._groups[0][0].clientWidth;
        commentText.binding.height = commentObj.moved._groups[0][0].clientHeight;
    } else {
        x = Math.round(nodeToUpdate.getAttribute('x'));
        y = Math.round(nodeToUpdate.getAttribute('y'));
        commentText.binding = {
            'x': x,
            'y': y,
            'clientWidth': commentObj.chartDiv._groups[0][0].clientWidth,
            'clientHeight': commentObj.chartDiv._groups[0][0].clientHeight,
            'showAsMarker': commentText.binding.showAsMarker,
            'height': commentText.binding.height,
            'width': commentText.binding.width
        };
    }

    commentObj.onSaveCallback(commentText, nodeId, 'edit');
};

/**
* @name drawCommentNodes
* @desc function to draw a all comments on the visual
* @return {undefined} - no return
*/
comment.prototype.drawCommentNodes = function () {
    this.chartDiv.selectAll('.smss-comment-mini-container').remove();
    Object.entries(this.comments.list).map(([id, commentObj]) => this.drawComment(commentObj, id));
};

/**
* @name drawComment
* @desc function to draw a single comment on the visual
* @param {object} commentData - data used to pain the comment
* @param {number} id - id of the specific comment
* @return {undefined} - no return
*/
comment.prototype.drawComment = function (commentData, id) {
    if (typeof this.chartDiv._groups === 'undefined') {
        console.log('Comment data is in old format, will not display or chart div doesnt exist');
        return;
    }

    if (!commentData.binding || !this.chartDiv._groups[0][0]) {
        console.log('Comment data is in old format, will not display or chart div doesnt exist');
        return;
    }

    if ((commentData.vizType !== this.chartDiv._groups[0][0].parentElement.nodeName.split('-')[0]) && commentData.alwaysDisplay === false) {
        return;
    }

    var commentObj = this,
        chartDiv = commentObj.chartDiv,
        binding = commentData.binding,
        chartAreaWidth = chartDiv._groups[0][0].clientWidth,
        chartAreaHeight = chartDiv._groups[0][0].clientHeight,
        x = (binding.x / binding.clientWidth * chartAreaWidth),
        y = (binding.y / binding.clientHeight * chartAreaHeight),
        styleString = '',
        text = '',
        resize = false,
        parent;

    if (commentData.binding.showAsMarker === 'false') {
        if (commentData.binding.width && commentData.binding.height) {
            styleString = "style='width: " + commentData.binding.width + 'px; height: ' + commentData.binding.height + "px'";
        }

        if (commentData.commentText.indexOf('<iframe') > -1 || commentData.commentText.indexOf('<img') > -1 || commentData.commentText.indexOf('<svg') > -1) {
            // contains elents that should resize
            text = "<div class='comment-padding text editable editable-text editable-comment-" + id + "' " + styleString + "><div class='user-comment'>" + commentData.commentText + '</div></div>';
            resize = true;
        } else {
            text = '<div class="text editable editable-text editable-comment-' + id + '">' + commentData.commentText + '<div/>';
        }

        chartDiv.append('div')
            .attr('class', 'smss-comment-mini-container')
            .attr('id', 'node' + id)
            .style('opacity', 1)
            .style('position', 'absolute')
            .style('left', x + 'px')
            .style('top', y + 'px')
            .on('dblclick', function () {// Edit text or delete the comment
                commentObj.doubleClick.call(commentObj, this, x, y);
            })
            // creating div for styling purposes
            .append('div')
            .attr('class', 'smss-comment-mini')
            .html(text);

        if (resize) {
            parent = d3.select('.user-comment');

            if (parent.node()) {
                commentObj.rescale(parent, parent.node());
            }
        }
    } else {
        chartDiv.append('div')
            .attr('class', 'smss-comment-mini-container')
            .attr('id', 'node' + id)
            .style('opacity', 1)
            .style('position', 'absolute')
            .style('left', x + 'px')
            .style('top', y + 'px')
            .style('font-family', 'FontAwesome')
            .style('stroke', 'darkgray')
            .style('font-size', '15px')
            .html('\uf0e5')
            .on('dblclick.comment', function () {// Edit text or delete the comment
                commentObj.doubleClick.call(commentObj, this, x, y);
            })
            .on('mouseenter.comment', function () {// Show hover over box when mouse enters node
                if (commentObj.showComments === false) {
                    var commentHeight = 80,
                        commentWidth = 185,
                        position;

                    Object.keys(commentObj.comments.list)
                        .map(key => commentObj.comments.list[key])
                        .filter(value => commentObj.isSameLocation(value.binding.x, this.offsetLeft, value.binding.y, this.offsetTop))
                        .forEach(node => {
                            position = commentObj.overlayDivPosition(commentWidth, commentHeight, node.binding.x, node.binding.y);
                            chartDiv.append('div')
                                .attr('class', 'smss-comment-popout')
                                .style('position', 'absolute')
                                .style('left', position.x + 'px')
                                .style('top', position.y + 'px')
                                .html('<textarea rows="3" class="smss-textarea" name="comment" style="resize: none;">' + node.commentText + '</textarea>');
                        });
                }
            })
            // Remove hover over box when mouse moves away
            .on('mouseout.comment', () => !commentObj.showComments && chartDiv.select('.smss-comment-popout').remove());
    }
};

/**
* @name doubleClick
* @desc click function after the user clicks on an existing comment
* @param {object} commentNode - current comment that the user clicked
* @param {number} x - x position of the click event
* @param {number} y - y position of the click event
* @return {undefined} - no return
*/
comment.prototype.doubleClick = function (commentNode, x, y) {
    d3.event.stopPropagation();

    var commentObj = this,
        editBox,
        chartDiv = commentObj.chartDiv,
        commentId = commentNode.id.split('node')[1],
        currentComment = commentObj.comments.list[commentId],
        commentHeight = 218,
        commentWidth = 248,
        position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);

    if (chartDiv.select('.smss-comment-container')._groups[0][0] || commentObj.mode !== 'commentMode') {
        // dont create new comment
        return;
    }

    commentObj.showComments = false;
    chartDiv.selectAll('.smss-comment-popout').remove();
    chartDiv.selectAll('.smss-comment-container').remove();

    editBox = chartDiv.append('div')
        .attr('class', 'smss-comment-container')
        .style('opacity', 1)
        .style('left', position.x + 'px')
        .style('top', position.y + 'px')
        .style('position', 'absolute')
        .html(commentObj.generateComment(currentComment.commentText));

    editBox.select('.smss-textarea')
        .node().focus();

    editBox.select('#displayAsMarker')._groups[0][0].checked = currentComment.binding.showAsMarker === 'true';
    editBox.select('#appearGlobally')._groups[0][0].checked = currentComment.alwaysDisplay === true;

    editBox.select('#delete')
        .on('click.delete', function () {
            editBox.remove();
            chartDiv.select('.smss-comment-popout').remove();
            chartDiv.select('#node' + commentId).attr('display', 'none');
            // redraw comment nodes with new indexes
            commentObj.onSaveCallback(currentComment, commentId, 'remove');
        });

    editBox.select('#submit')
        .on('click.submit', function () {
            var showAsMarker = editBox.select('#displayAsMarker')._groups[0][0].checked,
                alwaysDisplay = editBox.select('#appearGlobally')._groups[0][0].checked;

            currentComment.commentText = editBox.select('#comment-textarea')._groups[0][0].value;
            currentComment.binding.showAsMarker = showAsMarker ? 'true' : 'false';
            currentComment.alwaysDisplay = alwaysDisplay;
            chartDiv.select('.smss-comment-popout').remove();
            editBox.remove();
            commentObj.onSaveCallback(currentComment, commentId, 'edit');
        });

    editBox.select('#cancel')
        .on('click.cancel', function () {
            chartDiv.select('.smss-comment-popout').remove();
            editBox.remove();
        });
};

comment.prototype.rescaleComments = function () {
    var commentObj = this.comments.list,
        commentObjLength = Object.keys(commentObj).length,
        key;

    if (commentObjLength > 0) {
        for (key in commentObj) {
            if (commentObj.hasOwnProperty(key)) {
                this.comments.list[key].binding = this.rescaleComment(commentObj[key].binding, this.chartDiv._groups[0][0].getBoundingClientRect());
            }
        }

        this.drawCommentNodes();
    }
};

export default comment;