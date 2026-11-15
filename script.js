(function () {
  var S = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---- Colour palettes
  var THEMES = {
    forest: '#14543c', navy: '#1d3b66', teal: '#0f6b6b', plum: '#5b2a6e', slate: '#2f3e46'
  };
  function setTheme(name) {
    if (!THEMES[name]) name = 'forest';
    document.documentElement.setAttribute('data-theme', name);
    $$('.themes button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.t === name); });
    try { localStorage.setItem('theme', name); } catch (e) {}
  }
  var wanted = new URLSearchParams(location.search).get('theme');
  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch (e) {}
  if (S.showThemePicker) {
    var bar = document.createElement('div');
    bar.className = 'themes';
    bar.innerHTML = '<span>Palette</span>';
    Object.keys(THEMES).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.dataset.t = k; b.title = k; b.setAttribute('aria-label', k + ' palette');
      b.style.background = THEMES[k];
      b.addEventListener('click', function () { setTheme(k); });
      bar.appendChild(b);
    });
    document.body.appendChild(bar);
  }
  setTheme(wanted || (S.showThemePicker && saved) || S.theme);

  // A value is "real" only if it is set and not a placeholder.
  function real(v) { return !!v && !/X{3,}|^Your |yourname/i.test(v); }
  var hasWA = real(S.whatsapp), hasUPI = real(S.upiId);

  // ---- Branding / contact details from config.js
  $$('[data-brand]').forEach(function (e) { e.textContent = S.brand; });
  $$('[data-brand-initial]').forEach(function (e) { e.textContent = (S.brand || 'C').charAt(0); });
  document.title = document.title + ' | ' + S.brand;
  $('#yr').textContent = new Date().getFullYear();
  var em = $('[data-email-link]');
  em.textContent = S.email; em.href = 'mailto:' + S.email;
  var ph = $('[data-phone-link]');
  if (S.phone) {
    ph.textContent = real(S.phone) ? '+' + S.phone : '+91 XXXXX XXXXX';
    if (real(S.phone)) ph.href = 'tel:+' + S.phone;
  } else { $('[data-if="phone"]').hidden = true; }
  if (S.address) { $('[data-address]').textContent = S.address; } else { $('[data-if="address"]').hidden = true; }

  // ---- Mobile menu
  var burger = $('#burger'), menu = $('#menu');
  burger.addEventListener('click', function () {
    var open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#menu a').forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('open'); }); });

  // ---- Send a message via WhatsApp if configured, else email
  function send(text, subject) {
    if (hasWA) {
      window.open('https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    } else {
      window.location.href = 'mailto:' + S.email + '?subject=' + encodeURIComponent(subject || 'Enquiry') + '&body=' + encodeURIComponent(text);
    }
  }
  function req(form) {
    var ok = true;
    $$('[required]', form).forEach(function (i) {
      var bad = !i.value.trim();
      i.classList.toggle('invalid', bad);
      if (bad) ok = false;
    });
    return ok;
  }

  // ---- Lead form
  $('#lead-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    if (!req(f)) return;
    var d = new FormData(f);
    send('Hello, I am ' + d.get('name') + ' (' + d.get('phone') + ').\nService: ' + d.get('service') + '\n' + (d.get('message') || ''), 'Enquiry: ' + d.get('service'));
  });

  // ---- Chat widget
  var chat = $('#chat'), body = $('#chat-body');
  function openChat() { chat.hidden = false; $('#chat-input').focus(); }
  $$('[data-open-chat]').forEach(function (b) { b.addEventListener('click', function () { chat.hidden ? openChat() : (chat.hidden = true); }); });
  $('[data-close]', chat).addEventListener('click', function () { chat.hidden = true; });
  function say(text, who) {
    var m = document.createElement('div');
    m.className = 'msg ' + who; m.textContent = text;
    body.appendChild(m); body.scrollTop = body.scrollHeight;
  }
  function chatSend(text) {
    say(text, 'me');
    setTimeout(function () {
      say('Thanks! Opening ' + (hasWA ? 'WhatsApp' : 'your email app') + ' so we can reply to you directly.', 'bot');
      send('Hello, I need help with: ' + text, 'Chat enquiry');
    }, 400);
  }
  $$('#chips button').forEach(function (b) { b.addEventListener('click', function () { chatSend(b.textContent); }); });
  $('#chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var i = $('#chat-input'), v = i.value.trim();
    if (!v) return;
    i.value = ''; chatSend(v);
  });

  // ---- Payment modal: UPI QR by default, Razorpay only if a key is set
  var pay = $('#pay'), payForm = $('#pay-form'), upiBox = $('#upi-box');
  function closePay() { pay.hidden = true; }
  function resetPay() { payForm.hidden = false; upiBox.hidden = true; $('#pay-hint').textContent = ''; }
  $$('[data-open-pay]').forEach(function (b) {
    b.addEventListener('click', function () { resetPay(); pay.hidden = false; $('input', payForm).focus(); });
  });
  $('[data-close]', pay).addEventListener('click', closePay);
  pay.addEventListener('click', function (e) { if (e.target === pay) closePay(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePay(); chat.hidden = true; } });

  function upiLink(amount, ref) {
    var p = 'pa=' + encodeURIComponent(S.upiId).replace(/%40/g, '@') +
      '&pn=' + encodeURIComponent(S.upiName || S.brand) +
      '&am=' + amount + '&cu=INR' +
      '&tn=' + encodeURIComponent(ref || 'Professional fees');
    return 'upi://pay?' + p;
  }

  function showUpi(d, amount) {
    var link = upiLink(amount, d.get('ref'));
    var qr = window.qrcode(0, 'M');
    qr.addData(link); qr.make();
    $('#qr').innerHTML = qr.createSvgTag(5, 2);
    $('#upi-amt').textContent = '₹' + amount.toLocaleString('en-IN');
    $('#upi-id').textContent = S.upiId;
    $('#upi-open').href = link;
    $('#upi-preview').hidden = hasUPI;
    var msg = 'Hello, I have paid Rs ' + amount + ' for ' + (d.get('ref') || 'your services') +
      '. Name: ' + d.get('name') + ', phone: ' + d.get('phone') + '. UTR/screenshot attached.';
    $('#upi-done').onclick = function () { send(msg, 'Payment done'); };
    $('#upi-copy').onclick = function () {
      var b = this;
      function done() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy UPI ID'; }, 1800); }
      if (navigator.clipboard) { navigator.clipboard.writeText(S.upiId).then(done); }
      else { var t = document.createElement('textarea'); t.value = S.upiId; document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); done(); }
    };
    payForm.hidden = true; upiBox.hidden = false;
  }

  function loadRazorpay(cb) {
    if (window.Razorpay) return cb();
    var s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = cb;
    s.onerror = function () { $('#pay-hint').textContent = 'Could not load the payment window. Please try again.'; };
    document.head.appendChild(s);
  }

  payForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var hint = $('#pay-hint');
    if (!req(payForm)) return;
    var d = new FormData(payForm), amount = Math.round(Number(d.get('amount')));
    if (!(amount >= 1)) { hint.textContent = 'Enter a valid amount.'; return; }
    if (S.razorpayKey) {
      hint.textContent = '';
      loadRazorpay(function () {
        new window.Razorpay({
          key: S.razorpayKey, amount: amount * 100, currency: 'INR', name: S.brand,
          description: d.get('ref') || 'Professional fees',
          prefill: { name: d.get('name'), contact: d.get('phone') },
          theme: { color: getComputedStyle(document.documentElement).getPropertyValue('--green').trim() },
          handler: function (r) {
            closePay();
            alert('Payment received. Reference: ' + r.razorpay_payment_id + '. We will confirm shortly.');
          }
        }).open();
      });
    } else {
      showUpi(d, amount);
    }
  });
  $('#upi-back').addEventListener('click', resetPay);

})();
