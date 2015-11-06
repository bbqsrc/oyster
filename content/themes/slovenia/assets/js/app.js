$(function() {
  'use strict';

  $(window).resize(function() {
    if ($(window).width() < 500) {
      $('.oyster-motion .btn-group')
          .removeClass('btn-group btn-group-justified')
          .addClass('btn-group-vertical')
          .css('width', '100%');
    } else {
      $('.oyster-motion .btn-group-vertical')
          .removeClass('btn-group-vertical')
          .addClass('btn-group btn-group-justified')
          .css('width', '');
    }
  }).resize();

  $(".oyster-motion .btn").click(function() {
    $(this).closest('.panel').find('.panel-heading').slideUp();

    var body = $(this).closest('.oyster-motion');
    var panel = $(this).closest('.panel').addClass('oyster-motion-selected');

    body.removeClass('oyster-motion-success oyster-motion-danger oyster-motion-warning');

    if ($(this).hasClass('btn-success')) {
      body.addClass('oyster-motion-success');
    } else if ($(this).hasClass('btn-danger')) {
      body.addClass('oyster-motion-danger');
    } else if ($(this).hasClass('btn-warning')) {
      body.addClass('oyster-motion-warning');
    }
  });

  $(".oyster-method-approval .btn").click(function() {
    var $node = $(this);
    var body = $node.closest('.oyster-method-approval-state');

    body.removeClass('oyster-motion-success oyster-motion-danger oyster-motion-warning');

    if ($node.hasClass('btn-success')) {
      body.addClass('oyster-motion-success');
    } else if ($node.hasClass('btn-danger')) {
      body.addClass('oyster-motion-danger');
    } else if ($node.hasClass('btn-warning')) {
      body.addClass('oyster-motion-warning');
    }
  });

  // Stop the disappointing enter.
  $(window).keydown(function(e) {
    if (e.keyCode == 13) {
      e.preventDefault();
      return false;
    }
  });

  $('form').submit(function() {
    var win = window.confirm("Are you sure you want to submit?");

    if (win) {
      // Ensure '0' is sent!
      $("input.oyster-candidate-input[type=checkbox]").each(function() {
        var n = document.createElement('input');
        n.type = 'hidden';
        n.name = this.name;
        n.value = this.checked ? '1' : '0';

        $(this).replaceWith(n);
      });
    }

    return win;
  });

  $(".oyster-main").addClass("oyster-loaded");
});
