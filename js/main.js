var GAS_URL = 'https://script.google.com/macros/s/AKfycbw6sS6qFtJUgIzg0rs3vuSBv7eb8LHnoEKOOwVMtHiJAbDnq35sAMLaweF5RnZgMqAg/exec';
var ZUBIDA_TRACKING_KEY = 'zubida_tracking_data';

function trackEvent(eventName, eventParams) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, eventParams || {});
  }
}

function getFieldValue(id) {
  var field = document.getElementById(id);
  return field && field.value ? field.value.replace(/^\s+|\s+$/g, '') : '';
}

function addHiddenField(form, name, value) {
  var input = document.createElement('input');
  input.type = 'hidden';
  input.name = name;
  input.value = value || '';
  form.appendChild(input);
}

function getUrlParam(name) {
  try {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  } catch (err) {
    return '';
  }
}

function safeSessionGet(key) {
  try {
    return sessionStorage.getItem(key);
  } catch (err) {
    return '';
  }
}

function safeSessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch (err) {}
}

function getCurrentTrackingSnapshot() {
  return {
    utm_source: getUrlParam('utm_source'),
    utm_medium: getUrlParam('utm_medium'),
    utm_campaign: getUrlParam('utm_campaign'),
    utm_content: getUrlParam('utm_content'),
    utm_term: getUrlParam('utm_term'),
    landing_page: location.href,
    referrer: document.referrer || '',
    first_visit_time: new Date().toISOString()
  };
}

function hasUtmTracking(tracking) {
  return Boolean(
    tracking.utm_source ||
    tracking.utm_medium ||
    tracking.utm_campaign ||
    tracking.utm_content ||
    tracking.utm_term
  );
}

function initMarketingTracking() {
  var tracking = getCurrentTrackingSnapshot();
  var existingRaw = safeSessionGet(ZUBIDA_TRACKING_KEY);

  if (hasUtmTracking(tracking)) {
    if (existingRaw) {
      try {
        var existing = JSON.parse(existingRaw);
        tracking.first_visit_time = existing.first_visit_time || tracking.first_visit_time;
      } catch (err) {}
    }
    safeSessionSet(ZUBIDA_TRACKING_KEY, JSON.stringify(tracking));
    return;
  }

  if (!existingRaw) {
    safeSessionSet(ZUBIDA_TRACKING_KEY, JSON.stringify(tracking));
  }
}

function getMarketingTracking() {
  var raw = safeSessionGet(ZUBIDA_TRACKING_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (err) {}
  }
  return getCurrentTrackingSnapshot();
}

function getPageName(pathname) {
  var path = pathname || '';
  if (path.indexOf('generator-guide') !== -1) return '發電機出租指南';
  if (path.indexOf('cooler-guide') !== -1) return '水冷扇降溫指南';
  if (path.indexOf('event-equipment-guide') !== -1) return '活動設備懶人包';
  if (path.indexOf('cases') !== -1) return '活動案例';
  if (path.indexOf('generator') !== -1) return '發電機';
  if (path.indexOf('cooler') !== -1 || path.indexOf('water-cooler') !== -1) return '水冷扇';
  if (path.indexOf('tent') !== -1) return '活動帳篷';
  if (path.indexOf('404') !== -1) return '404頁面';
  if (path === '/' || path === '/ZUBIDA/' || path.indexOf('index') !== -1) return '首頁';
  return '官網頁面';
}

function getSourceName(tracking) {
  var source = (tracking.utm_source || '').toLowerCase();
  var medium = (tracking.utm_medium || '').toLowerCase();
  var referrer = (tracking.referrer || '').toLowerCase();

  if (source === 'google_business') return 'Google商家';
  if (source === 'google') return 'Google廣告或搜尋';
  if (source === 'facebook' && medium === 'fanpage') return 'Facebook粉專';
  if (source === 'facebook' && medium === 'social_post') return 'Facebook貼文';
  if (source === 'facebook_group') return 'Facebook社團';
  if (source === 'line') return 'LINE官方帳號';
  if (source === 'instagram') return 'Instagram';
  if (source) return tracking.utm_source;

  if (referrer) {
    if (referrer.indexOf('google') !== -1) return 'Google自然搜尋';
    if (referrer.indexOf('facebook') !== -1) return 'Facebook自然流量';
    if (referrer.indexOf('line') !== -1) return 'LINE自然流量';
    return '其他網站推薦';
  }

  return '直接流量';
}

function collectExtraFormNotes() {
  var fields = document.querySelectorAll('[data-form-extra]');
  var notes = [];
  for (var i = 0; i < fields.length; i += 1) {
    var label = fields[i].getAttribute('data-form-extra') || fields[i].name || fields[i].id;
    var value = fields[i].value ? fields[i].value.replace(/^\s+|\s+$/g, '') : '';
    if (value) notes.push(label + '：' + value);
  }
  return notes;
}

function initMobileMenu() {
  var btn = document.getElementById('mobile-menu-btn');
  var menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.setAttribute('type', 'button');
  btn.setAttribute('aria-controls', 'mobile-menu');
  btn.setAttribute('aria-expanded', 'false');

  function closeMenu() {
    if (menu.className.indexOf('hidden') === -1) menu.className += ' hidden';
    menu.style.display = 'none';
    btn.setAttribute('aria-expanded', 'false');
  }

  btn.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    var isHidden = menu.className.indexOf('hidden') !== -1 || menu.style.display === 'none';
    if (isHidden) {
      menu.className = menu.className.replace(/\bhidden\b/g, '').replace(/\s+/g, ' ');
      menu.style.display = 'block';
      btn.setAttribute('aria-expanded', 'true');
    } else {
      closeMenu();
    }
  });

  var links = menu.getElementsByTagName('a');
  for (var i = 0; i < links.length; i += 1) {
    links[i].addEventListener('click', closeMenu);
  }
}

function initGaClickEvents() {
  var gaElements = document.querySelectorAll('[data-ga-event]');
  for (var i = 0; i < gaElements.length; i += 1) {
    gaElements[i].addEventListener('click', function () {
      trackEvent(this.getAttribute('data-ga-event'), {
        event_label: this.getAttribute('data-ga-label') || this.textContent.replace(/^\s+|\s+$/g, ''),
        page_path: location.pathname
      });
    });
  }
}

function submitRentalForm(event) {
  if (event && event.preventDefault) event.preventDefault();

  var form = document.getElementById('rentalForm');
  var btn = document.getElementById('submitBtn');
  if (!form) return false;

  var old = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '送出中...';
  }

  var name = getFieldValue('entryName');
  var phone = getFieldValue('entryPhone');
  var service = getFieldValue('entryService');
  var date = getFieldValue('entryDate');
  var message = getFieldValue('entryMsg');
  var extraNotes = collectExtraFormNotes();
  if (extraNotes.length) {
    message = (message ? message + '\n\n' : '') + extraNotes.join('\n');
  }

  var tracking = getMarketingTracking();
  var sourceName = getSourceName(tracking);
  var pageName = getPageName(location.pathname);
  var sourcePath = sourceName + ' → ' + pageName + ' → 填表';

  var leadEventParams = {
    event_category: 'lead',
    service: service,
    source_name: sourceName,
    source_path: sourcePath,
    page_name: pageName,
    page_path: location.pathname,
    page_title: document.title
  };

  trackEvent('submit_quote_form', leadEventParams);
  trackEvent('form_submit_attempt', leadEventParams);

  var payload = {
    name: name,
    phone: phone,
    service: service,
    date: date,
    message: message,
    entryName: name,
    entryPhone: phone,
    entryService: service,
    entryDate: date,
    entryMsg: message,
    contact_name: name,
    contact_phone: phone,
    rental_item: service,
    event_date: date,
    note: message,
    userAgent: navigator.userAgent,
    utm_source: tracking.utm_source || '',
    utm_medium: tracking.utm_medium || '',
    utm_campaign: tracking.utm_campaign || '',
    utm_content: tracking.utm_content || '',
    utm_term: tracking.utm_term || '',
    landing_page: tracking.landing_page || '',
    referrer: tracking.referrer || '',
    first_visit_time: tracking.first_visit_time || '',
    source_name: sourceName,
    page_name: pageName,
    source_path: sourcePath,
    current_page: location.href,
    '姓名/單位': name,
    '電話': phone,
    '主要需求設備': service,
    '預計活動日期': date,
    '活動地點與需求備註': message,
    '來源頁面': location.href,
    '來源管道': sourceName,
    '頁面名稱': pageName,
    '來源路徑': sourcePath,
    'UTM來源': tracking.utm_source || '',
    'UTM媒介': tracking.utm_medium || '',
    'UTM活動': tracking.utm_campaign || '',
    'UTM內容': tracking.utm_content || '',
    'UTM關鍵字': tracking.utm_term || '',
    '首次到達頁': tracking.landing_page || '',
    '前頁來源': tracking.referrer || '',
    '首次到訪時間': tracking.first_visit_time || '',
    'User Agent': navigator.userAgent,
    'IP/備註': '',
    '處理狀態': '未處理',
    'Telegram通知狀態': '未通知',
    page: location.href,
    page_path: location.pathname,
    page_title: document.title,
    submitted_at: new Date().toISOString(),
    source: 'zubida_website'
  };

  var iframeName = 'gas-submit-frame';
  var iframe = document.querySelector('iframe[name="' + iframeName + '"]');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.name = iframeName;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }

  var postForm = document.createElement('form');
  postForm.method = 'POST';
  postForm.action = GAS_URL;
  postForm.target = iframeName;
  postForm.style.display = 'none';

  for (var key in payload) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      addHiddenField(postForm, key, payload[key]);
    }
  }

  document.body.appendChild(postForm);

  var finished = false;
  function finishSubmit() {
    if (finished) return;
    finished = true;
    alert('表單已送出，租必達將儘快與您聯繫。若需求急迫，也歡迎直接來電：0920-633-116');
    trackEvent('form_submit_success', leadEventParams);
    trackEvent('generate_lead', {
      currency: 'TWD',
      value: 1,
      lead_type: service,
      source_name: sourceName,
      source_path: sourcePath,
      page_name: pageName,
      page_path: location.pathname
    });
    form.reset();
    if (postForm.parentNode) postForm.parentNode.removeChild(postForm);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = old;
    }
  }

  iframe.onload = finishSubmit;
  postForm.submit();
  window.setTimeout(finishSubmit, 1800);
  return false;
}

function initRentalForm() {
  var form = document.getElementById('rentalForm');
  if (form) form.onsubmit = submitRentalForm;
}

document.addEventListener('DOMContentLoaded', function () {
  initMarketingTracking();
  initMobileMenu();
  initGaClickEvents();
  initRentalForm();
});
