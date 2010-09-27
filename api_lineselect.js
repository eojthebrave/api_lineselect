// $Id;$

/**
 * Add line number and selection to PHP code blocks.
 */
Drupal.behaviors.api_lineselect = function(context) {
  // Strip all new lines from inside of the title attribute of <a> tags
  // Sometimes these contain extra new lines since the title attribute is the
  // short function documentation.
  $('.php code a').each(function() {
    title = $(this).attr('title').replace(/\n/g, '');
    $(this).attr('title', title);
  });

  // Find the code block on the page.
  // @TODO: Make this work on pages with more than one code block.
  var code = $('.php code', context).html() || false;
  if (!code) {
    return;
  }

  // More cleanup. If there is a closing <span> tag on a line of its own we
  // shift it up to the previous line, unless it is the first line.
  code = code.replace(/[^<?php][\n]<\/span>/g, '</span>');

  // Split up the code based on newlines. Then put it into a table with line
  // numbers in the left column and code in the right. We put it in a table so
  // that when using shift select you're not also highlighting all the code
  // using the browser native text selection.
  var new_code = '';
  var lines = code.split("\n");
  var pad_length = lines.length.toString().length;

  var line_numbers = '';
  $.each(lines, function(index, value) {
    // Wrap each line in a div, add a line number, and then wrap the contents
    // of the line with a <pre> tag to preserve spacing.
    line_numbers = line_numbers +  '<span class="linenumber" rel="#L' + (index + 1) + '" ><pre>' + Drupal.api_lineselect_pad((index + 1), pad_length) + '</pre></span>';

    // Make sure that blank lines are preserved.
    if (value.length == 0) {
      value = " ";
    }
    new_code =  new_code + '<div class="line" id="L' + (index + 1) + '"><pre>' + value + '</pre></div>';
  });

  // Replace the existing highlighted code with our modified version.
  output = '<table class="php"><tr><td>' + line_numbers + '</td><td width="100%">' + new_code + '</td></tr></table>';
  $('.php code', context).parent().replaceWith(output);

  // Bind click event handler to all line numbers.
  $('.linenumber', context).api_lineselectShiftSelect();

  // If there is a location hash with line numbers highlight those.
  if (window.location.hash) {
    hash = window.location.hash.replace('#','');
    // The first letter is the identifier.
    id = hash[0];
    hash = hash.replace(id, '');
    if (hash.indexOf('-') > 0) {
      // This is a range.
      n = hash.split('-');
      n.sort;
      for (i = parseInt(n[0]); i <= parseInt(n[1]); i++) {
        $('#' + id + i).addClass('selected');
      }
    }
    else {
      // Single line.
      $('#' + id + hash).addClass('selected');
    }

    // Jump to the first selected row.
    window.scrollTo(0, $('.selected:first').offset().top - 50);
  }
}

/**
 * Helper function; Pad an integer to a specified length by adding leading
 * zeros as necessary.
 */
Drupal.api_lineselect_pad = function(number, length) {
  var str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  }
  return str;  
}

/**
 * Function for binding and handing click events to line numbers. Allows for
 * single line and multiple line selection if the user holds down the Shift
 * key.
 */
jQuery.fn.api_lineselectShiftSelect = function() {
  var lines = this;
  var last_selected;

  $(this).click(function(event) {
    var last_index;
    var select_index;

    // Clear any existing highlighting from all lines;
    $('.selected').removeClass('selected');

    // Select the line that was just clicked on.
    $($(this).attr('rel')).addClass('selected');

    // If the shift key is being held down we allow selection of a range of
    // lines.
    if (event.shiftKey) {
      select_index = lines.index(this);
      last_index = lines.index(last_selected);
      var end = Math.max(select_index, last_index);
      var start = Math.min(select_index, last_index);
      for (i = start; i <= end; i++) {
        $($(lines[i]).attr('rel')).addClass('selected');
      }
    }

    // Keep track of the last line that was clicked with or without shift held
    // down so that we can do ranges on the next click if necessary.
    last_selected = this;

    // Figure out what to place as the hash.
    var hash = '';
    if (last_index && select_index) {
      // Range.
      hash = '#L' + last_index + '-' + select_index;
    }
    else {
      // Single.
      hash = $(this).attr('rel');
    }

    // Update the address bar.
    window.location = window.location.href.replace(window.location.hash, '') + hash;
    return false;
  });
}
