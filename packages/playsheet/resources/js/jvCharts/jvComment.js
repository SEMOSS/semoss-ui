/***  jvComment ***/
function jvComment(configObj) {
    "use strict";
    var commentObj = this;
    commentObj.chartDiv = configObj.chartDiv;
    commentObj.showComments = false;
    commentObj.comments = configObj.comments;
    commentObj.disabled = false;
}


/********************************************* All Comment Mode Functions **************************************************/
jvComment.prototype.makeComment = function (event) {
    var commentObj = this;

    console.log('makeComment');

    commentObj.showComments = false;

    commentObj.chartDiv.selectAll(".commentbox-readonly").remove();

    if (commentObj.chartDiv.selectAll(".commentbox")[0].length === 0 && commentObj.chartDiv.selectAll(".commentbox-edit")[0].length === 0) {
        var x = parseInt(d3.mouse(event)[0]);
        var y = parseInt(d3.mouse(event)[1]);

        //calculate position of overlay div
        var commentHeight = 145,
            commentWidth = 200,
            position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);

        commentObj.chartDiv.append('div')
            .attr("class", "commentbox")
            .attr("id", "commentbox")
            .style("opacity", 1)
            //.style("border", "1px solid black")
            .html("<div class='title'><b>Add New Comment</b></div><hr style='margin:3px 0 5px 0;'/>" +
                "<textarea placeholder='Enter comment...' form='commentform' style='resize:none' class='textarea' rows='4' cols='27' name='comment' id = 'textarea1'></textarea>" +
                "<br><button class='btn-flat sm-btn absolute top right' id ='cancel'><i class='fa fa-close'></i></button>" +
                "<button class='btn-green pull-right right xs-right-margin xs-left-margin' style='border-radius:3px' id = 'submit'>Submit Comment</button>")
            .style("position", "absolute")
            .style("left", position.x + "px")
            .style("top", position.y + "px");

        //Autofocus on the text area
        document.getElementById("textarea1").focus();

        commentObj.chartDiv.selectAll(".commentbox").select("#cancel")
            .on("click.delete", function () {
                commentObj.removeComment();
            });

        var commentType = 'svgMain';

        commentObj.chartDiv.selectAll(".commentbox").select("#submit")
            .on("click.save", function () {
                var commentText = commentObj.chartDiv.select("#commentbox").select("#textarea1")[0][0].value,
                    newCommentObj = {
                        'commentText': commentText,
                        'groupID': 0,
                        'type': commentType,
                        'binding': {
                            'x': x,
                            'y': y,
                            'xChartArea': commentObj.chartDiv[0][0].clientWidth,
                            'yChartArea': commentObj.chartDiv[0][0].clientHeight,
                            'currentX': x,
                            'currentY': y
                        }
                    };
                commentObj.chartDiv.select(".commentbox").remove();
                if(isNaN(commentObj.comments.maxId)) {
                    commentObj.comments.maxId = -1;
                }
                commentObj.localCallbackSaveComment(newCommentObj, ++commentObj.comments.maxId, 'add');
            });
    }

};

jvComment.prototype.removeComment = function () {
    var commentObj = this;
    var chartDiv = commentObj.chartDiv;
    chartDiv.selectAll('.commentbox').remove();
};

jvComment.prototype.showAllComments = function () {
    var commentObj = this;

    //Remove any comment boxes if comments are being toggled
    commentObj.chartDiv.selectAll(".commentbox").remove();
    commentObj.chartDiv.selectAll(".commentbox-edit").remove();

    if (commentObj.showComments === false) {
        for (var i in commentObj.comments.list) {

            if (!commentObj.comments.list[i]['binding']) {
                console.log("Comment is in old format, will not display");
                return;
            }

            var value = commentObj.comments.list[i];

            var chartAreaWidth = commentObj.chartDiv[0][0].clientWidth;
            var chartAreaHeight = commentObj.chartDiv[0][0].clientHeight;

            var x = (commentObj.comments.list[i]['binding'].x / commentObj.comments.list[i]['binding'].xChartArea * chartAreaWidth);
            var y = (commentObj.comments.list[i]['binding'].y / commentObj.comments.list[i]['binding'].yChartArea * chartAreaHeight);

            var commentText = value['commentText'];

            var commentHeight = 80,
                commentWidth = 185,
                position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);

            commentObj.chartDiv.append('div')
                .attr("class", "commentbox-readonly")
                .attr("id", "commentbox-readonly" + i)
                .style("position", "absolute")
                .style("opacity", 1)
                //.style("border", "1px solid black")
                .html("<textarea readonly style='resize:none' class='textarea' rows='4' cols='27' name='comment'>" + commentText + "</textarea>")
                .style("left", position.x + "px")
                .style("top", position.y + "px")

        }
        commentObj.showComments = true;
        //chart.toolBar.select("#topBarButton"+chart.config.name+"showallcomments").select('button').classed('toggled', true);
    }
    else {
        commentObj.chartDiv.selectAll(".commentbox-readonly").remove();
        commentObj.showComments = false;
        //chart.toolBar.select("#topBarButton"+chart.config.name+"showallcomments").select('button').classed('toggled', false);
    }
};

jvComment.prototype.drawCommentNodes = function () {
    var commentObj = this;

    var comments = commentObj.comments.list;
    var chartDiv = commentObj.chartDiv;
    var svg = chartDiv.select("svg");

    svg.selectAll(".min-comment").remove();

    for (var i in comments) {

        if (!comments[i]['binding'] || !chartDiv[0][0]) {
            console.log("Comment data is in old format, will not display or chart div doesnt exist");
            return;
        }


        var chartAreaWidth = chartDiv[0][0].clientWidth;
        var chartAreaHeight = chartDiv[0][0].clientHeight;

        var x = (comments[i]['binding'].x / comments[i]['binding'].xChartArea * chartAreaWidth);
        var y = (comments[i]['binding'].y / comments[i]['binding'].yChartArea * chartAreaHeight);

        comments[i]['binding'].currentX = (comments[i]['binding'].x / comments[i]['binding'].xChartArea * chartAreaWidth);
        comments[i]['binding'].currentY = (comments[i]['binding'].y / comments[i]['binding'].yChartArea * chartAreaHeight);

        var commentNode = svg.append("text")
            .attr("class", "min-comment")
            .attr("id", "node" + i)
            .attr("fill", "#e6e6e6")
            .attr("x", x)
            .attr("y", y)
            .attr("font-family", "FontAwesome")
            .attr("stroke", "darkgray")
            .attr('font-size', function (d) {
                return '15px';
            })
            .text(function (d) {
                return '\uf0e5';
            })
            .attr("opacity", 1)
            .on("dblclick.comment", function (node) {//Edit text or delete the comment
                if (chartDiv.selectAll(".commentbox-edit")[0].length === 0 && chartDiv.selectAll(".commentbox")[0].length === 0) {//No comments are open
                    if (commentObj.localCallbackGetMode() === 'comment') {
                        commentObj.showComments = false;
                        chartDiv.selectAll(".commentbox-readonly").remove();
                        var commentText = "";
                        var currentComment;

                        for (var j in commentObj.comments.list) {
                            if (Math.round(commentObj.comments.list[j]['binding'].currentX) === Math.round(this.x.baseVal[0].value)) {
                                if (Math.round(commentObj.comments.list[j]['binding'].currentY) === Math.round(this.y.baseVal[0].value)) {
                                    commentText = commentObj.comments.list[j].commentText;
                                    x = commentObj.comments.list[j]['binding'].currentX;
                                    y = commentObj.comments.list[j]['binding'].currentY;
                                    currentComment = j;
                                }
                            }
                        }
                        var commentHeight = 145,
                            commentWidth = 200,
                            position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);
                        chartDiv.append('div')
                            .attr("class", "commentbox-edit")
                            .style("opacity", 1)
                            .style("left", position.x + "px")
                            .style("top", position.y + "px")
                            .style("position", "absolute")
                            //.style("border", "1px solid black")
                            .html("<div class='title'><b>Edit Comment</b></div><hr style='margin:3px 0 5px 0;'/>" +
                                "<textarea id='edit' style='resize:none' class='textarea' rows='4' cols='27' name='comment'>" + commentText + "</textarea>" +
                                "<br><button class='btn-flat sm-btn absolute top right' id ='cancel-edit'><i class='fa fa-close'></i></button>" +
                                "<button class='btn-light pull-left left xs-left-margin' style='border-radius:3px' id ='delete'>Delete</button>" +
                                "<button class='btn-green pull-right right xs-right-margin' style='border-radius:3px' id = 'save'>Save</button>");

                        chartDiv.selectAll(".commentbox-edit").select("#delete")
                            .on("click.delete", function () {
                                chartDiv.select(".commentbox-edit").remove();
                                chartDiv.select(".commentbox-readonly").remove();
                                chartDiv.select("#node" + currentComment).attr("display", "none");


                                //redraw comment nodes with new indexes
                                commentObj.localCallbackSaveComment(commentObj.comments.list[currentComment], currentComment, 'remove');
                            });

                        chartDiv.selectAll(".commentbox-edit").select("#save")
                            .on("click.save", function () {
                                var commentText = chartDiv.select(".commentbox-edit").select("#edit")[0][0].value;
                                commentObj.comments.list[currentComment].commentText = commentText;
                                chartDiv.select(".commentbox-readonly").remove();
                                chartDiv.select(".commentbox-edit").remove();
                                commentObj.localCallbackSaveComment(commentObj.comments.list[currentComment], currentComment, 'edit');
                            });

                        chartDiv.selectAll(".commentbox-edit").select("#cancel-edit")
                            .on("click.cancel-edit", function () {
                                chartDiv.select(".commentbox-readonly").remove();
                                chartDiv.select(".commentbox-edit").remove();
                            });
                    }
                    else {
                        return null;
                    }
                }
            })
            .on("mouseenter.comment", function (d) {//Show hover over box when mouse enters node
                if (commentObj.showComments === false) {
                    var commentText = "";

                    for (var j in commentObj.comments.list) {
                        if (Math.round(commentObj.comments.list[j]['binding'].currentX) === Math.round(this.x.baseVal[0].value)) {
                            if (Math.round(commentObj.comments.list[j]['binding'].currentY) === Math.round(this.y.baseVal[0].value)) {
                                commentText = commentObj.comments.list[j]['commentText'];
                                x = commentObj.comments.list[j]['binding'].currentX;
                                y = commentObj.comments.list[j]['binding'].currentY;
                            }
                        }
                    }

                    var commentHeight = 80,
                        commentWidth = 185,
                        position = commentObj.overlayDivPosition(commentWidth, commentHeight, x, y);

                    var commentDiv = chartDiv.append('div')
                        .attr("class", "commentbox-readonly")
                        .style("opacity", 1)
                        .style("position", "absolute")
                        //.style("border", "1px solid black")
                        .html("<textarea readonly rows='4' style='resize:none' cols='27' class='textarea' name='comment'>" + commentText + "</textarea>")
                        .style("left", position.x + "px")
                        .style("top", position.y + "px");
                }
            })
            .on("mouseout.comment", function (d) {//Remove hover over box when mouse moves away
                if (commentObj.showComments === false) {
                    chartDiv.select(".commentbox-readonly").remove();
                }
            });

    }
};


/******************************* Utility functions **********************************************/

jvComment.prototype.overlayDivPosition = function (divWidth, divHeight, mouseX, mouseY) {
    var commentObj = this;
    var position = {};
    if (mouseX > (parseInt(commentObj.chartDiv.style('width'))) / 2) {
        position.x = mouseX - divWidth;
    } else {
        position.x = mouseX;
    }
    if (mouseY - divHeight - 10 > 0) {
        position.y = mouseY - divHeight - 10;
    } else {
        position.y = mouseY + 10;
    }
    return position;
};