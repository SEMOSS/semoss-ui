'use strict';
// add all required files
import './jvVars.js';
import './jvEvents.js';
import './jvTip.js';
import './jvBrush.js';
import './jvComment.js';
import './jvEdit.js';
import './visuals/jvBar.js';
import './visuals/jvPie.js';
import './visuals/jvLine.js';
import './visuals/jvScatter.js';
import './visuals/jvArea.js';
import './visuals/jvGantt.js';
import './visuals/jvHeatmap.js';
import './visuals/jvPack.js';
import './visuals/jvRadial.js';
import './visuals/jvSankey.js';
import './visuals/jvSingleAxis.js';
import './visuals/jvSunburst.js';
import './visuals/jvTreemap.js';
import './visuals/jvWordCloud.js';
import './visuals/jvBoxWhisker.js';
import './visuals/jvBubble.js';
import './visuals/jvClustergram.js';

// attach jv charts objects to the window
import jvCharts from './jvCharts.js';
import jvBrush from './jvBrush.js';
import jvComment from './jvComment.js';
import jvEdit from './jvEdit.js';
import jvSelect from './jvSelect';

// Comment out to remove from window object - if you are not using jvCharts as a minified file
window.jvCharts = jvCharts;
window.jvBrush = jvBrush;
window.jvComment = jvComment;
window.jvEdit = jvEdit;
window.jvSelect = jvSelect;
