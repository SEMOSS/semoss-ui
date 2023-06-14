var html = `<!--Top title bar of edit popup-->
<div class='title'>
    <div class="jv-inline">
        <b>Edit Options<div id="edit-option-element" class="jv-inline" style="visibility: hidden;"></div>:</b>
    </div>

    <div id='exitEditMode' class='jv-pull-right jv-pointer'>
        <i class='fa fa-times'></i>
    </div>
</div>

<!--Line dividing top bar with form options below-->
<hr style='margin:3px 0 3px 0;'/>

<!--Form Options-->
<div id="form'+chart.config.name+'">

    <!--Number formatting options-->
    <div class="jv-full-width editable-num-format" style="display: none;">
        <div class="jv-edit-mode-input">Number Format:
            <select id="editable-num-format">
                <option value="">--Select Option--</option>
                <option value="currency">Currency</option>
                <option value="fixedCurrency">Fixed Point Currency</option>
                <option value="percent">Percent</option>
                <option value="millions">Millions</option>
                <option value="commas">Commas</option>
                <option value="none">None</option>
            </select>
        </div>
        <br/>
    </div>

    <!--Text formatting options-->
    <div class="editable-text-size-buttons jv-center topBarOption increasefont jv-pointer" style="display: none;">
        <button id='decreaseFontSize' title='Decrease the font size' class='topbar-button font jv-button jv-pointer'><i class='fa fa-font'></i><i class='fa fa-long-arrow-down'></i></button>
        <button id='increaseFontSize' title='Increase the font size' class='topbar-button font jv-button jv-pointer'><i class='fa fa-font'></i><i class='fa fa-long-arrow-up'></i></button>
    </div>


    <div class="jv-full-width editable-text-color" style="display: none;">
        <div class="jv-edit-mode-input">Text Color:
            <input type="color" id="editable-text-color" value="#000000">
        </div>
        <br/>
    </div>

    <div class="jv-full-width editable-text-size" style="display: none;">
        <div class="jv-edit-mode-input">Text Size:
            <input type="number" id="editable-text-size" min="0" max="30" value="12" step="0.5">
        </div>
        <br/>
    </div>

    <div class="jv-full-width editable-content" style="display: none;">
        <div class="jv-edit-mode-input">Text:
            <input type="text" id="editable-content" placeholder="Enter text here">
        </div>
        <br/>
    </div>

    <!--bar chart formatting-->
    <div class="jv-full-width editable-bar" style="display: none;">
        <div class="jv-edit-mode-input">Bar Color:
            <input type="color" id="editable-bar" value="#aaaaaa">
        </div>
        <br/>
    </div>

    <!--pie chart formatting-->
    <div class="jv-full-width editable-pie" style="display: none;">
        <div class="jv-edit-mode-input">Pie Slice Color:
            <input type="color" id="editable-pie" value="#aaaaaa">
        </div>
        <br/>
    </div>

    <!--scatter plot formatting-->
    <div class="jv-full-width editable-scatter" style="display: none;">
        <div class="jv-edit-mode-input">Scatter Circle Color:
            <input type="color" id="editable-scatter" value="#aaaaaa">
        </div>
        <br/>
    </div>

    <!--bubble chart formatting-->
    <div class="jv-full-width editable-bubble" style="display: none;">
        <div class="jv-edit-mode-input">Bubble Color:
            <input type="color" id="editable-bubble" value="#aaaaaa">
        </div>
        <br/>
    </div>

    <!--box and whisker plot formatting-->
    <div class="jv-full-width editable-box" style="display: none;">
        <div class="jv-edit-mode-input">Box Color:
            <input type="color" id="editable-box" value="#aaaaaa">
        </div>
        <br/>
    </div>

    <!--Submit button-->
    <div class="editable-default-and-apply">
        <button id="submitEditModeDefault" class="jv-button jv-pull-left">Default</button>
        <button id="submitEditMode" class="jv-button jv-button-green jv-pull-right">Apply</button>
    </div>
</div>`;

export default html;
