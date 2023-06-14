![Alt text](lib/jvLogo.png?raw=true "Title")

To install:
- npm install
- run webpack
- webpack creates jvcharts-min to use on your owns
- more documentation and examples coming soon

JV Charts is a component based d3 charting library to quickly create interactive visuals.


CODE STRUCTURE 

- src/jv.js is the entry point for webpack. All of the files are bundled from here. When adding new files, be sure to reference them in jv.js
    - jv.js also appends the jvCharts, jvComment, jvBrush, jvSelect objects to the window. jvSelect is not used within SEMOSS and has not been built out to serve a tangible purpose at this point. 

- src/jvCharts.js is the file that creates the main jvCharts class. It is the meat of jvCharts due to the fact that every visual is a jvChart and relies on functions within this file to be the same across all visuals. Things like svg creation, margin calculations, basic data formatting will also happen in jvCharts.js. Anytime a function is used across many jv visuals, the functions are abstracted to be static functions within jvCharts.js to allow usage across visuals. 

    - during the creation of a new jvCharts instance, the constructor will call setData and paint functions for the specific jv type. This will look something like:

            chart[chart.config.type].setData.call(chart);
            chart[chart.config.type].paint.call(chart, animation);

        These are important in that they call the respective setData and paint functions that pertain to the visual. For example, bar charts would look like:

            chart['bar'].setData.(chart);

        Since the src/visuals/jvBar.js has extended the jvCharts prototype by adding jvCharts.prototype.bar = {setData, paint} functions to allow specific behavior for bar to be applied to the generic chart. The advantages to this design is that every visual is a jvCharts instance instead of having to define:

            -- standard way --
            bar = new jvBar(config) >>> adds to the global namespace

            -- we do instead --
            config.type = 'bar'
            bar = new jvCharts(config) >>> standard across all visuals

        Another design decision we needed to make was the complete construction (setting data, painting, binding events) of the jvChart in one call. Calling bar = new jvChart(config) should do everything that jv require. The drawbacks to this design is that jv now relies on the inherent jv strucutre to layer the data, painting, and events appropriately. This has been set up in a straightforward manner by enforcing a separation of concerns to fully finish the data phase before moving to painting and then events last. When updating the library or adding new visuals, be mindful of this flow and if 'timing' bugs start to occur.        

- src/visuals
    - Every visual has their own defined setData and paint functions that handle all of its specific functionality.

- src/jvEvents.js
    - The eventing layer is explicitly defined to handle, click, double click, hover, mouse out, and key press events. The definitions for each of these are below:
        - Click: a mouse-up event. Will be canceled if another mouse-up within 250 ms. Meaning that the click event is not fired until 250 ms after the mouse up
        - Double Click: a second mouse-up event within a 250 ms time period will fire the double click callback
        - Hover: a mouse-in event where the callback is fired when no other mouse-in or mouse-out events are fired for 3 seconds.
        - Mouse out: Event is only fired when the current event is Hover and then leaving the current element.This is done to prevent the mouse out event from firing too many times.
        - Key press: calls the key event callback whenever a key is pressed on the top level element. In order to enable key event capture, that dom element must have a defined tab index > 0 in order for the browser to catch those events.

- src/jvComment.js
    - jvComment is a layer onto any div that will position comments based on a double click event (whenever the comment mode is turned on).
        - Uses d3 to do the dom manupilation, however d3.js is not needed for comment mode.
        - How it works:
            - Double click anywhere on the HTML node
                - fires the make comment method
                - waits for user input and binds a callback to the submit comment button
            - After user submits comment
                - fires a save comment callback which only sends back the comment data
            - jvComment expects the developer to maintain the state of the comments and call the paint comment method to actually draw the comments on the HTML node. 
            - Whenever jv Comment paints comments, those comments become editable with a double click and draggable with a mouse-down and drag. Jv comment handles these interactions and then sends back the new updated state with the save comment callback.

- src/jvEdit.js
    - jvEdit is a html class based framework for editing specific styling on top of svg elements.
        - the class="editable" will define whether the element should be controlled by jvEdit.
        - jv edit has a defined list of classes that will enable different styles to be updated. some are below:

            editable-text,
            editable-num,
            editable-content,
            xLabels,
            editable-svg

        - jv edit works by having one global listener and then uses the classList of the target element to detmine which options to give the user to apply to the target element. The rest of the process is the same callback structure as comment mode above to save and paint with the new options.

- src/jvBrush.js
    1. create new jvBrush object with a config object containing the specific jvChart and an onBrushCallback
    2. jvBrush exposes startBrush and removeBrush functions
    3. if startBrush is called with a d3.event, brush will assume that a force click event should be fired at the location of the d3.event
    4. if a d3.event is not given to startBrush(), a brush lisener will be added to the visual to listen for the user to brush
    5. After the user finishs brushing an area of the chart, brushEnd() is calle.
    6. brushEnd() will create a data object for the brushed area in the format:
        {'label1': ['value1','value2']}
        Example
        {'Movie_Genre': ['Drama','Documentary','Action']}
    7. brushEnd will then call the onBrushCallback function with the above data object
    8. brushEnd will finally call the removeBrush() function

- src/jvVars.js
    - this file describes all of the defaul options for jvCharts by defining the jvChart.vars object. This object is continuously referenced throughout the library to keep a standard look and feel. Whenever making changes, be mindful that they will update on all visuals. Also when adding to the library, try to use jvVars as much as possible. The usage of defined colors, fonts, font-weights, etc in the visual files should be limited and abstracted to jvVars instead to allow easier customizability of the library. JvVars is one of the most powerful and useful features in jv charts as it is a feature that isnt included in most visualization libraries.