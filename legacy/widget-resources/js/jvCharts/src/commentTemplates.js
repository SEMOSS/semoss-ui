export default {
    create: `
        <div class='title'>
            <b>Add New Comment</b>
        </div>

        <textarea class='comment-textarea' 
            placeholder='Enter comment...' 
            form='commentform' 
            class='comment-textarea' 
            style='width:200px; 
            height: 90px;' name='comment' id = 'textarea1'>
        </textarea>

        <br>
        <input type='checkBox' class='commentbox-display' id ='display'> Display as marker
        <br>
        <input type='checkBox' class='commentbox-display' id ='global'> Appear across all visualizations
        <br>

        <button class='commentbox-close' id ='cancel'>
            <i class='fa fa-close'></i>
        </button>

        <button class='smss-btn smss-btn-updated smss-btn-primary commentbox-submit' id = 'submit'>
            Submit Comment
        </button>`,

    edit: (text) => `
        <div class='title'>
            <b>Edit Comment</b>
        </div>

        <textarea id='edit' class='comment-textarea' style='width:200px; height: 90px;' name='comment'>${text}</textarea>

        <br>
        <input type='checkBox' class='commentbox-display' id ='display'> Display as marker
        <br>
        <input type='checkBox' class='commentbox-display' id ='global'> Appear across all visualizations
        <br>

        <button class='commentbox-close' id ='cancel-edit'>
            <i class='fa fa-close'></i>
        </button>

        <button class='smss-btn smss-btn-updated smss-btn-flat' id ='delete'>
            Delete
        </button>

        <button class='smss-btn smss-btn-updated smss-btn-primary' id = 'save'>
            Save
        </button>`
};
