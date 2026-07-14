(function () {
  'use strict';

  var storageKey = 'zubida_rental_inquiry_cart';
  var cart = loadCart();
  var hasTrackedBeginCheckout = false;

  function getValue(selector, root) {
    var node = (root || document).querySelector(selector);
    return node && typeof node.value === 'string' ? node.value.trim() : '';
  }

  function getText(id, fallback) {
    var node = document.getElementById(id);
    return node && typeof node.value === 'string' && node.value.trim() ? node.value.trim() : fallback;
  }

  function toQuantity(value) {
    var quantity = parseInt(value, 10);
    return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
  }

  function getUnit(category) {
    if (category === '活動帳篷') return '頂';
    if (category === '發電機') return '台';
    return '台';
  }

  function getDisplayName(item) {
    if (!item) return '';
    if (item.category === '水冷扇') return item.name;
    if (item.spec && item.spec.indexOf(item.name) !== -1) return item.spec;
    return item.spec ? item.spec + '｜' + item.name : item.name;
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(storageKey);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch (error) {}
  }

  function track(eventName, params) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, Object.assign({
          page_path: location.pathname,
          page_title: document.title
        }, params || {}));
      }
    } catch (error) {}
  }

  function getCartItemsForGA4(sourceItems) {
    return (sourceItems || cart).map(function (item) {
      return {
        item_name: getDisplayName(item),
        item_category: item.category,
        item_variant: item.spec || '',
        quantity: item.quantity
      };
    });
  }

  function getTotalQuantity() {
    return cart.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);
  }

  function trackBeginCheckout() {
    if (hasTrackedBeginCheckout) return;
    hasTrackedBeginCheckout = true;
    track('begin_checkout', {
      currency: 'TWD',
      item_count: cart.length,
      total_quantity: getTotalQuantity(),
      items: getCartItemsForGA4()
    });
  }

  function getCartLines() {
    if (!cart.length) return ['尚未加入設備。'];
    return cart.map(function (item, index) {
      return (index + 1) + '. ' + getDisplayName(item) + ' × ' + item.quantity + ' ' + item.unit;
    });
  }

  function renderCart() {
    var countNode = document.getElementById('cartCount');
    var itemsNode = document.getElementById('cartItems');
    var summaryNode = document.getElementById('cartSummary');
    var total = cart.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);

    if (countNode) countNode.textContent = String(total);

    if (summaryNode) {
      summaryNode.value = getCartLines().join('\n');
    }

    if (!itemsNode) return;

    if (!cart.length) {
      itemsNode.innerHTML = '<p class="text-gray-500">尚未加入設備，請先選擇規格與數量。</p>';
      return;
    }

    itemsNode.innerHTML = cart.map(function (item, index) {
      return [
        '<div class="cart-row border-b border-gray-100 py-3 last:border-b-0">',
        '<div class="flex items-start justify-between gap-3">',
        '<div>',
        '<p class="font-bold text-gray-900">' + escapeHtml(getDisplayName(item)) + '</p>',
        '<p class="text-xs text-gray-500 mt-1">' + escapeHtml(item.category) + '｜數量 ' + item.quantity + ' ' + escapeHtml(item.unit) + '</p>',
        '</div>',
        '<button type="button" class="text-red-500 text-xs font-bold hover:text-red-700" data-remove-cart="' + index + '">移除</button>',
        '</div>',
        '</div>'
      ].join('');
    }).join('');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function addItemFromCard(card) {
    var name = getValue('[data-cart-name]', card);
    var category = getValue('[data-cart-category]', card);
    var spec = getValue('[data-cart-spec]', card);
    var quantity = toQuantity(getValue('[data-cart-qty]', card));
    if (!name || !category) return;

    var unit = getUnit(category);
    var existing = cart.find(function (item) {
      return item.name === name && item.category === category && item.spec === spec;
    });

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        name: name,
        category: category,
        spec: spec,
        quantity: quantity,
        unit: unit
      });
    }

    saveCart();
    renderCart();
    var addedItem = existing || cart[cart.length - 1];
    track('add_to_cart', {
      currency: 'TWD',
      items: [{
        item_name: getDisplayName(addedItem),
        item_category: category,
        item_variant: spec || '',
        quantity: quantity
      }]
    });
  }

  function clearCart() {
    cart = [];
    saveCart();
    renderCart();
    track('inquiry_cart_clear');
  }

  function removeItem(index) {
    var removed = cart.splice(index, 1)[0];
    saveCart();
    renderCart();
    if (removed) {
      track('remove_from_cart', {
        currency: 'TWD',
        items: getCartItemsForGA4([removed])
      });
    }
  }

  function buildFullSummary() {
    var note = getText('entryMsg', '無');
    return [
      '【租必達設備詢價】',
      '',
      '姓名：' + getText('entryName', '未填'),
      '電話：' + getText('entryPhone', '未填'),
      '活動日期：' + getText('entryDate', '未填'),
      '租賃天數：' + getText('entryRentalDays', '未填'),
      '活動地點：' + getText('entryLocation', '未填'),
      '使用場景：' + getText('entryScene', '未填'),
      '配送需求：' + getText('entryDelivery', '未填'),
      '搭建需求：' + getText('entryInvoice', '未填'),
      '',
      '詢價設備：',
      getCartLines().join('\n'),
      '',
      '備註：',
      note
    ].join('\n');
  }

  function prepareInquirySummary(event) {
    if (!cart.length) {
      if (event && event.preventDefault) event.preventDefault();
      alert('請先加入至少一項設備，再送出詢價。');
      return false;
    }

    var summaryNode = document.getElementById('inquiryCartFullSummary');
    if (summaryNode) summaryNode.value = buildFullSummary();

    trackBeginCheckout();

    track('inquiry_cart_submit_ready', {
      item_count: cart.length,
      total_quantity: getTotalQuantity()
    });

    return true;
  }

  function init() {
    document.addEventListener('click', function (event) {
      var addButton = event.target.closest('[data-add-cart]');
      if (addButton) {
        addItemFromCard(addButton.closest('[data-product-card]'));
        return;
      }

      var removeButton = event.target.closest('[data-remove-cart]');
      if (removeButton) {
        removeItem(parseInt(removeButton.getAttribute('data-remove-cart'), 10));
      }
    });

    var clearButton = document.getElementById('clearCart');
    if (clearButton) clearButton.addEventListener('click', clearCart);

    var form = document.getElementById('rentalForm');
    if (form) {
      form.addEventListener('focusin', function (event) {
        if (event.target && event.target.matches && event.target.matches('input, select, textarea')) {
          trackBeginCheckout();
        }
      });
      form.addEventListener('submit', prepareInquirySummary, true);
    }

    renderCart();
  }

  window.getZubidaRentalCartItemsForGA4 = getCartItemsForGA4;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
