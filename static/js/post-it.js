(function ($, $S) {
    // $jQuery
    // $S window.localStorage
    // Variable declaration
    var $board = $('#board'),
        // Placement of the Post-Its
        Postick, //Singleton Object containing the functions to work on the LocalStorage
        len = 0,
        // Number of objects in the LocalStorage
        currentNotes = '',
        // Storage of the HTML code of the Post-It element
        o; // Current data of the Post-It in the localStorage
   
   
   
    // Manage the Post-Its in the LocalStorage
	  // Each object is stored in the localStorage as an Object
    Postick = {
        add: function (obj) {
            obj.id = $S.length;
            $S.setItem(obj.id, JSON.stringify(obj));
        },

        retrive: function (id) {
            return JSON.parse($S.getItem(id));
        },

        remove: function (id) {
            $S.removeItem(id);
        },

        removeAll: function () {
            $S.clear();
        }

    };

    // If Post-Its exist, create them
    len = $S.length;
    if (len) {
        for (var i = 0; i < len; i++) {
            // Creation of all the Post-Its found in the localStorage
            var key = $S.key(i);
            o = Postick.retrive(key);
            currentNotes += '<div class="postick"';
            currentNotes += ' style="left:' + o.left;
            currentNotes += 'px; top:' + o.top;
						// The data-key attribute tells which note will be deleted in the localStorage
            currentNotes += 'px"><div class="toolbar"><span class="delete" data-key="' + key;
            currentNotes += '">x</span></div><div contenteditable="true" class="editable">';
            currentNotes += o.text;
            currentNotes += '</div></div>';
        }

        // Adds all the Post-Its to the dashboard
        $board.html(currentNotes);
    }

    // As soon as the document is loaded, we make all the Post-Its Draggable
    $(document).ready(function () {
        $(".postick").draggable({
            cancel: '.editable',
			"zIndex": 3000,
			"stack" : '.postick'
        });
    });

    // Deletion of the Post-It
    $('span.delete').live('click', function () {
        if (confirm('Etes vous sûr de vouloir supprimer cette note ?')) {
            var $this = $(this);
					  // The data-key attribute tells which note will be deleted in the localStorage
            Postick.remove($this.attr('data-key'));
            $this.closest('.postick').fadeOut('slow', function () {
                $(this).remove();
            });
        }
    });

    // Creation of the Post-It
    $('#btn-addNote').click(function () {
        $board.append('<div class="postick" style="left:20px;top:70px"><div class="toolbar"><span class="delete" title="Fermer">x</span></div><div contenteditable class="editable"></div></div>');
        $(".postick").draggable({
            cancel: '.editable'
        });
    });

    // Saves all the Post-Its when the user leaves the page
    window.onbeforeunload = function () {
        // Cleanup of the localStorage
        Postick.removeAll();
        // Then we insert each Post-It into the LocalStorage
				// Saves the Post-It position, so as to replace it when the page is loaded again
        $('.postick').each(function () {
            var $this = $(this);
            Postick.add({
                top: parseInt($this.position().top),
                left: parseInt($this.position().left),
                text: $this.children('.editable').text()
            });
        });
    }
})(jQuery, window.localStorage);