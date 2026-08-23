/**
 * Click a picture to see it larger.
 *
 * The trigger is built at run time around every figure image, so a picture
 * added later needs no markup of its own: put this file on the page and it
 * works. With JavaScript off the pictures still show at their inline size,
 * which is all they did before this existed.
 */
(function () {
  'use strict';

  var images = document.querySelectorAll('figure img');
  if (!images.length || typeof HTMLDialogElement === 'undefined') return;

  var dialog, view, caption, opener;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'lightbox';

    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'lightbox-close';
    close.setAttribute('aria-label', 'Close');
    close.innerHTML = '&times;';

    view = document.createElement('img');

    caption = document.createElement('p');
    caption.className = 'lightbox-caption';
    caption.id = 'lightbox-caption';
    dialog.setAttribute('aria-labelledby', caption.id);

    dialog.appendChild(close);
    dialog.appendChild(view);
    dialog.appendChild(caption);
    document.body.appendChild(dialog);

    close.addEventListener('click', function () { dialog.close(); });

    // The open dialog covers the viewport, so a click that lands on the dialog
    // itself rather than on its contents is a click outside the picture.
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });

    // Escape closes it without this, and the browser fires close either way.
    dialog.addEventListener('close', function () {
      var root = document.documentElement;
      root.style.overflow = '';
      root.style.paddingRight = '';
      view.removeAttribute('src');
      if (opener) opener.focus();
    });
  }

  function open(img, text) {
    if (!dialog) build();
    view.src = img.currentSrc || img.src;
    view.alt = img.alt;
    caption.textContent = text;
    caption.hidden = !text;

    // Holding the page still behind the dialog would otherwise pull the
    // scrollbar away and shift the layout, so give back the width it took.
    var root = document.documentElement;
    var bar = window.innerWidth - root.clientWidth;
    root.style.overflow = 'hidden';
    if (bar > 0) root.style.paddingRight = bar + 'px';

    dialog.showModal();
  }

  Array.prototype.forEach.call(images, function (img) {
    if (img.parentNode.classList.contains('plate-open')) return;

    var figure = img.closest('figure');
    var figcaption = figure && figure.querySelector('figcaption');
    var text = figcaption ? figcaption.textContent.trim() : '';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'plate-open';
    btn.setAttribute('aria-label', text ? 'Expand: ' + text : 'Expand picture');
    img.parentNode.insertBefore(btn, img);
    btn.appendChild(img);

    btn.addEventListener('click', function () {
      opener = btn;
      open(img, text);
    });
  });
}());
