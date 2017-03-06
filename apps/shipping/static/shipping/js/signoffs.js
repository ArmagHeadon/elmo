/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/* global $, diffData, permissions, next_push_date */

var dropMode = null;
function dropDiff(event, ui) {
  $(this).append(ui.draggable);
  ui.draggable.css('top', 0);
}

$(document).ready(function() {
  $('.diffanchor').draggable({
     appendTo: 'body',
    axis: 'y',
    revert: true,
    start: function(event, ui) {
      if (dropMode != 'diff') {
        $('.ui-droppable').droppable('destroy');
        $('.diff').droppable({
           drop: dropDiff
        });
        dropMode = 'diff';
      }
    }
  });

  function openDiffTab(event) {
    event.stopPropagation();
    var dfs = $('.diffanchor').parent().prev().find('.shortrev');
    if (dfs.length < 2 || dfs[0].textContent == dfs[1].textContent) return;
    var params = {
      from: dfs[1].textContent,
      to: dfs[0].textContent,
      repo: $(dfs[0]).data('repo')
    };
    params = $.param(params);
    window.open(diffData.url + "?" + params);
  }
  $('.diff').click(openDiffTab);

  function hoverSO(showOrHide) {
    return function() {
      var q = $('input[data-push=' + this.getAttribute('data-push') + ']')
        .not('.suggested')
          .not('.clicked');
      if (showOrHide === 'hide') {
        q.addClass('hidden');
      } else {
        q.removeClass('hidden');
      }
    };
  }

  function clickSO() {
    var self = $(this);
    var so = $('input[data-push=' + this.getAttribute('data-push') + ']')
      .not('.suggested');
    if (! so.length) { return; }
    var wasClicked = so.hasClass('clicked');
    so.toggleClass('clicked');
    // XXXX, guess what touch would do
    if (wasClicked != so.hasClass('hidden')) {
      so.toggleClass('hidden');
    }
  }

  $('.pushrow').hover(hoverSO('show'), hoverSO('hide'))
    .click(clickSO);

  if (permissions && permissions.canAddSignoff) {
    $('input.do_signoff').click(doSignoff);
    $('#add_signoff').dialog({
      autoOpen: false,
      width: 600,
      minWidth: 300,
      title: 'New Sign-off'
    });

    $('#cancel_signoff').dialog({
      autoOpen: false,
      width: 600,
      minWidth: 300,
      title: 'Cancel'
    });

    $('#reopen_signoff').dialog({
      autoOpen: false,
      width: 600,
      minWidth: 300,
      title: 'Re-open'
    });
    $('.cancel_signoff,.reopen_signoff').click(onSignoffAction);

  }

  if (permissions && permissions.canReviewSignoff) {
    $('#review_signoff').dialog({
      autoOpen: false,
      width: 600,
      minWidth: 300,
      title: 'Review'
    });
    $('.review_signoff').click(onSignoffAction);
  }

  $('button.load-more').click(function() {
    var button = $(this);
    var this_row = button.parents('tr');
    var url = location.pathname;
    // `next_push_date` is defined in the global window scope
    var req = $.get(url + '/more/', {push_date: next_push_date});
    req.then(function(response) {
      var new_rows = $(response.html);
      new_rows.filter('.pushrow').hover(hoverSO('show'), hoverSO('hide'))
        .click(clickSO);
      new_rows.find('.diff').click(openDiffTab);
      new_rows.insertBefore(this_row);
      if (!response.pushes_left) {
        button.attr('disabled', 'disabled');
      } else {
        next_push_date = response.next_push_date;
      }
      if (permissions && permissions.canReviewSignoff) {
        new_rows.find('.review_signoff').click(onSignoffAction);
      }
      if (permissions && permissions.canAddSignoff) {
        new_rows.find('input.do_signoff').click(doSignoff);
        new_rows.find('.cancel_signoff,.reopen_signoff').click(onSignoffAction);
      }
      $('.pushes-left', this_row).text(response.pushes_left);
    });
    return false;
  });

  // Firefox has a tendency to "cache" that a button should remain disabled
  // even if you refresh the page without a force-refresh
  $('button.load-more[disabled=""]').removeProp('disabled')

});

var Review = {
   accept: function(event) {
     var frm = event.target.form;
     frm.querySelector('[type=submit]').disabled = false;
     frm.comment.disabled = true;
     frm.clear_old.disabled = true;
   },
  reject: function(event) {
    var frm = event.target.form;
    frm.querySelector('[type=submit]').disabled = false;
    frm.comment.disabled = false;
    frm.clear_old.disabled = false;
    frm.comment.focus();
  }
};

function showSignoff(details_content) {
  $('#signoff_desc').html(details_content);
  $('#add_signoff').dialog('open');

  // In first sign-offs, add checkboxes that will have to be checked before
  // the user can click the Sign-off button.
  var needed_checkboxes = $('.first_signoff_needed');
  if (needed_checkboxes.length > 0) {
    var signoff_button = document.querySelector('#add_signoff input[type=submit]');
    signoff_button.disabled = true;

    needed_checkboxes.click(function (e) {
      // If all needed checkboxes are checked, enable the button.
      signoff_button.disabled = !!document.querySelector('.first_signoff_needed:not(:checked)');
    });
  }
}

function doSignoff(event) {
  event.stopPropagation();
  var t = $(event.target);
  var push = t.attr('data-push');
  var sf = $('#signoff_form');
  sf.children('[name=push]').val(push);
  var run = t.attr('data-run');
  sf.children('[name=run]').val(run);
  $.get(signoffDetailsURL, {push: push, run: run, first: firstSignoff}, showSignoff, 'html');
}

function onSignoffAction(event) {
  var signoff_id = $(this).data('signoff');
  var rs = $('#' + this.classList[0]);
  $('input[name="signoff_id"]', rs).val(signoff_id);
  rs.dialog('open');
  return false;
}
