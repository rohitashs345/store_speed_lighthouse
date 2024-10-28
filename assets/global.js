function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function fetchConfig(type = 'json') {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': `application/${type}` }
  };
}

function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      "summary, a[href], button:enabled, [tabindex]:not([tabindex^='-']), [draggable], area, input:not([type=hidden]):enabled, select:enabled, textarea:enabled, object, iframe"
    )
  );
}
const trapFocusHandlers = {};
function trapFocus(container, elementToFocus = container) {
  var elements = getFocusableElements(container);
  var first = elements[0];
  var last = elements[elements.length - 1];

  removeTrapFocus();

  trapFocusHandlers.focusin = (event) => {
    if(
      event.target !== container &&
      event.target !== last &&
      event.target !== first
    )
      return;

    document.addEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.focusout = function() {
    document.removeEventListener('keydown', trapFocusHandlers.keydown);
  };

  trapFocusHandlers.keydown = function(event) {
    if(event.code.toUpperCase() !== 'TAB') return; // If not TAB key
    // On the last focusable element and tab forward, focus the first element.
    if(event.target === last && !event.shiftKey) {
      event.preventDefault();
      first.focus();
    }

    //  On the first focusable element and tab backward, focus the last element.
    if(
      (event.target === container || event.target === first) &&
      event.shiftKey
    ) {
      event.preventDefault();
      last.focus();
    }
  };

  document.addEventListener('focusout', trapFocusHandlers.focusout);
  document.addEventListener('focusin', trapFocusHandlers.focusin);

  elementToFocus.focus();

  if(elementToFocus.tagName === 'INPUT' &&
    ['search', 'text', 'email', 'url'].includes(elementToFocus.type) &&
    elementToFocus.value) {
    elementToFocus.setSelectionRange(0, elementToFocus.value.length);
  }
}
function removeTrapFocus(elementToFocus = null) {
  document.removeEventListener('focusin', trapFocusHandlers.focusin);
  document.removeEventListener('focusout', trapFocusHandlers.focusout);
  document.removeEventListener('keydown', trapFocusHandlers.keydown);

  if(elementToFocus) elementToFocus.focus();
}

function pauseElementBasedMedia(element) {
  element.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  element.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  element.querySelectorAll('video').forEach((video) => video.pause());
  element.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

/*
 * Shopify Common JS
 *
 */
if ((typeof window.Shopify) == 'undefined') {
  window.Shopify = {};
}
Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  }
};
Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};
Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent('on'+eventName, callback);
};
Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options['method'] || 'post';
  var params = options['parameters'] || {};

  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);

  for(var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};
Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl         = document.getElementById(country_domid);
  this.provinceEl        = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options['hideElement'] || province_domid);

  Shopify.addListener(this.countryEl, 'change', Shopify.bind(this.countryHandler,this));

  this.initCountry();
  this.initProvince();
};
Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute('data-default');
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },

  initProvince: function() {
    var value = this.provinceEl.getAttribute('data-default');
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },

  countryHandler: function(e) {
    var opt       = this.countryEl.options[this.countryEl.selectedIndex];
    var raw       = opt.getAttribute('data-provinces');
    var provinces = JSON.parse(raw);

    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = 'none';
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement('option');
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }

      this.provinceContainer.style.display = "";
    }
  },

  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },

  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement('option');
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};
Shopify.formatMoney = function(cents, format) {
  if (typeof cents == 'string') { cents = cents.replace('.',''); }
  var value = '';
  var placeholderRegex = /\{\{\s*(\w+)\s*\}\}/;
  var formatString = (format || this.money_format);

  function defaultOption(opt, def) {
      return (typeof opt == 'undefined' ? def : opt);
  }

  function formatWithDelimiters(number, precision, thousands, decimal) {
    precision = defaultOption(precision, 2);
    thousands = defaultOption(thousands, ',');
    decimal   = defaultOption(decimal, '.');

    if (isNaN(number) || number == null) { return 0; }

    number = (number/100.0).toFixed(precision);

    var parts   = number.split('.'),
      dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
      cents   = parts[1] ? (decimal + parts[1]) : '';

    return dollars + cents;
  }

  switch(formatString.match(placeholderRegex)[1]) {
    case 'amount':
      value = formatWithDelimiters(cents, 2);
      break;
    case 'amount_no_decimals':
      value = formatWithDelimiters(cents, 0);
      break;
    case 'amount_with_comma_separator':
      value = formatWithDelimiters(cents, 2, '.', ',');
      break;
    case 'amount_no_decimals_with_comma_separator':
      value = formatWithDelimiters(cents, 0, '.', ',');
      break;
  }

  return formatString.replace(placeholderRegex, value);
}

class JSOrganizer extends HTMLElement {
  constructor() {
    super();
  }

  // function for aria-selected attr change on button
  static setAttr(element, value, attr){
    if (element instanceof Array) {
      element.forEach(function (el) {
        el.setAttribute(attr, value);
      });
    } else if (NodeList.prototype.isPrototypeOf(element)) {
      element.forEach(function (el) {
        el.setAttribute(attr, value);
      });
    } else {
      element.setAttribute(attr, value);
    }
  }

  static switchImage(mediaIdRef, sectionId, productId, template){
    const templateElement = template.content.querySelector(`[data-media-id="${mediaIdRef}"]`);
    const imageContainer = document.querySelector(`[data-container-ref="${sectionId}-${productId}_media-container"]`);
    var currentOpacity = parseFloat(imageContainer.style.opacity) || 1;
    var newOpacity = (currentOpacity === 1) ? 0 : 1;
    imageContainer.style.transition = 'opacity 0.3s ease';
    imageContainer.style.opacity = newOpacity;
    setTimeout(() => {
      imageContainer.innerHTML = templateElement.outerHTML;
      setTimeout(() => {
        imageContainer.style.opacity = 1;
      }, 0);
    }, 500);
  }

  static togglerLoader(flag){
    const loader = document.querySelector('[data-loader]');
    if(flag){
      loader.classList.remove('hidden');
    } else{
      loader.classList.add('hidden');
    }
  }
    
  static setActiveSplideThumbnail(thumbnail, mediaId){
    if (!thumbnail) return;
    const splide = thumbnail.splide;
    const thumbnailSlide = splide.Components.Slides.filter(`[data-media-id="${mediaId}"]`);
    if(!thumbnailSlide.length) return;
    splide.go(thumbnailSlide[0].index);
  }

  static updateVariantUrl(url, variantId){
    window.history.replaceState({ }, '', `${url}?variant=${variantId}`);
  }

  static addHoverOnElement(element){
    if(!element) return;
    element.addEventListener('focusin', () =>{
      element.classList.add('hover');
    });
    element.addEventListener('focusout', () =>{
      element.classList.remove('hover');
    });
  }

  static getVariantByColor(color, data) {
    var variantsByColor = data.variants.filter((variant) => {
      return variant.option1 === color || variant.option2 === color || variant.option3 === color;
    });
    var availableVariant = variantsByColor.find((variant) => {
      return variant.available;
    });
    return availableVariant || variantsByColor[0];
  }

  static renderSelectorChanges(html, parent, selector){
    let element = null;
    if(!parent){
      element = document.querySelector(selector);
    } else{
      element = parent.querySelector(selector);
    }
    if(!element) return;
    element.innerHTML = html.querySelector(selector).innerHTML;
  }

  static setCurrVariant(variant, formsStr){
    const forms = JSOrganizer.getJsonParse(formsStr);
    if(!forms) return;
    forms.forEach(form => {
      if(variant) JSOrganizer.setVariantId(form, variant.id);
      const atcBtn = form.querySelector('[name="add"]');
      if(!atcBtn) return;
      const textContainer = atcBtn.querySelector('[data-atc-text]');
      if(variant === undefined){
        JSOrganizer.setAttr(atcBtn, '', 'disabled');
        textContainer.innerText = textContainer.dataset.atcTextUnavail ? textContainer.dataset.atcTextUnavail : window.variantStrings.unavailable;
        return;
      }
      if(variant.available){
        atcBtn.removeAttribute('disabled');
        textContainer.innerText = textContainer.dataset.atcTextAvail ? textContainer.dataset.atcTextAvail : window.variantStrings.addToCart;
        return;
      }
      JSOrganizer.setAttr(atcBtn, '', 'disabled');
      textContainer.innerText = textContainer.dataset.atcTextUnavail ? textContainer.dataset.atcTextUnavail : window.variantStrings.soldOut;
    });
  }

  static switchVariantMedia(variant, parentSelector, template){
    const currMedia = variant.featured_media;
    if(!currMedia) return;
    const templateElement = template.content.querySelector(`[data-media-id="${currMedia.id}"]`);
    const parent = document.querySelector(parentSelector);
    const imageContainer = parent.querySelector('[data-switch-wrapper]');
    imageContainer.parentElement.classList.add('--anim-start');
    var currentOpacity = parseFloat(imageContainer.style.opacity) || 1;
    var newOpacity = (currentOpacity === 1) ? 0 : 1;
    imageContainer.style.transition = 'opacity 0.3s ease';
    imageContainer.style.opacity = newOpacity;
    setTimeout(() => {
      imageContainer.innerHTML = templateElement.outerHTML;
      setTimeout(() => {
        imageContainer.style.opacity = 1;
        imageContainer.parentElement.classList.remove('--anim-start');
      }, 0);
    }, 500);
  }

  static getJsonParse(attrStr){
    let arr = [];
    const strArr = attrStr ? JSON.parse(attrStr) : null;
    if(!strArr) return arr = null;
    strArr.forEach(selector => {
      let elem = document.querySelector(selector);
      arr.push(elem);
    });
    return arr;
  }

  static toggleVariantAvail(selectors, flag, parent){
    let parentElement = null;
    if(parent !== 'false') parentElement = document.querySelector(parent);
    const arr = JSON.parse(selectors);
    arr.forEach(selector => {
      const element = parentElement ? parentElement.querySelector(selector) : document.querySelector(selector);
      if(!element) return;
      flag ? element.classList.remove('--elem-opac') : element.classList.add('--elem-opac');
    });
  }

  static onVariantRender(productUrl, variantId, selectors, sectionId, updateUrl = false, loader = null, parent = null){
    JSOrganizer.togglerLoader(true);
    fetch(`${productUrl}?variant=${variantId}&section_id=${sectionId}`)
      .then((response) => response.text())
      .then((responseText) => {
        const html = new DOMParser().parseFromString(responseText, 'text/html');
        let parentElement = null;
        if(parent !== 'false') parentElement = document.querySelector(parent);
        const arr = JSON.parse(selectors);
        arr.forEach(selector => {
          const element = parentElement ? parentElement.querySelector(selector) : document.querySelector(selector);
          if(element) element.innerHTML = html.querySelector(selector).innerHTML;
        });
      })
      .catch((e) => {
        console.error(e);
        throw e;
      })
      .finally(() => {
        if(updateUrl === true || updateUrl === 'true') JSOrganizer.updateVariantUrl(productUrl, variantId);
        JSOrganizer.togglerLoader(false);
      }
    );
  }

  static setVariantId(form, variantId){
    const input = form.querySelector('[name="id"]');
    input.value = variantId;
  }

  static lineItemUpdate(line, quantity, sections, parent){
    JSOrganizer.togglerLoader(true);
    const secArr = JSON.parse(sections);
    var body = JSON.stringify({
      line,
      quantity,
      sections: secArr.map(section => section.id),
      sections_url: window.location.pathname
    });
    this.erorr = false;
    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((responseText) => {
        const response = JSON.parse(responseText);
        if(response.errors) return JSOrganizer.handleLineError(parent, response);
        JSOrganizer.sectionArrRender(secArr, response);
      }).catch((e) => {
        console.error(e);
      })
      .finally(() => {
        if(!this.erorr){
          const modal = document.querySelector('[data-modal="modal-cart-drawer"]');
          if(modal){
            if(modal.classList.contains('modal--active')){
              trapFocus(modal.content);
              modal.setListeners(true);
            }
          }
        }
        JSOrganizer.togglerLoader(false);
      }
    );
  }

  static lineItemUpdateRmover(line, quantity, secArr, config, element){
    this.proceed = false;
    var body = JSON.stringify({
      line,
      quantity
    });
    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        return response.text();
      })
      .then((responseText) => {
        this.proceed = true;
      })
      .catch(e => {
        console.error(e);
      })
      .finally(() => {
        if(this.proceed) element.fetchAtc(secArr, config);
      }
    );
  }
  
  static handleLineError(parent, response){
    const parentElement = document.querySelector(parent);
    const errorContainer = parentElement.querySelector('[data-render-error]');
    errorContainer.classList.remove('hidden');
    errorContainer.innerText = response.errors;
    const qtyInput = parentElement.querySelector('input[name="updates[]"]');
    qtyInput.value = parseFloat(parentElement.dataset.initQty);
    JSOrganizer.togglerLoader(false);
    return this.erorr = true;
  }

  static sectionArrRender(secArr, response){
    secArr.forEach(section => {
      const html = new DOMParser() .parseFromString(response.sections[section.id], 'text/html').getElementById(section.id);
      section.selectors.forEach(selector => {
        JSOrganizer.replaceInnerHtml(selector, html);
      });
    });
  }

  static replaceInnerHtml(selector, html){
    const prevElements = document.querySelectorAll(selector);
    const newElements = html.querySelectorAll(selector);
    prevElements.innerHTML = newElements.innerHTML;
    prevElements.forEach((element, index) => {
      element.outerHTML = newElements[index].outerHTML;
    });
  }

  static showCartDrawer(modalRef){
    const toggler = document.querySelector(modalRef);
    if(!toggler) return;
    toggler.dispatchEvent(new Event('click'));
  }

  static resetQty(form, parent){
    const qtyField = form.quantity;
    if(qtyField){
      qtyField.value = parseFloat(qtyField.min);
      qtyField.dispatchEvent(new Event('input'));
    }
    const parentElement = document.querySelector(parent);
    if(!parentElement) return;
    const qtyContainer = parentElement.querySelector('quantity-input');
    if(!qtyContainer) return;
    qtyContainer.input.value = parseFloat(qtyContainer.input.min);
    qtyContainer.input.dispatchEvent(new Event('input'));
  }

  static setVariantMedia(variant, galSelector, slider, parent){
    const parentElement = parent ? document.querySelector(parent) : null;
    const gallery = parentElement ? parentElement.querySelector(galSelector) : document.querySelector(galSelector);
    const currCheck = variant.featured_media;
    if (!gallery || !currCheck) return;
    if(slider === 'true'){
      const mediaId = currCheck ? currCheck.id : null;
      JSOrganizer.setActiveSplideThumbnail(gallery, mediaId);
      return;
    }
    let items = Array.from(gallery.querySelectorAll('[data-gal-item]'));
    let activeIndex = -1;
    if(currCheck){
      items.forEach((item, index) => {
        if(item.dataset.mediaId == currCheck.id) activeIndex = index;
      });
      if(activeIndex !== -1){
        const activeItem = items.splice(activeIndex, 1)[0];
        items.unshift(activeItem);
      }
    }
    gallery.innerHTML = '';
    gallery.classList.add('mango');
    items.forEach(item => gallery.appendChild(item));
  }

  static setSwatchImages(element, data){
    const labels = element.querySelectorAll('.--swatch-active');
    const placeholderUrl = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAATCAYAAACdkl3yAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABdaVRYdFNuaXBNZXRhZGF0YQAAAAAAeyJjbGlwUG9pbnRzIjpbeyJ4IjowLCJ5IjowfSx7IngiOjE4LCJ5IjowfSx7IngiOjE4LCJ5IjoxOX0seyJ4IjowLCJ5IjoxOX1dfetuk4EAAAEmSURBVDhPlZPLkkZADIXT2LGywBPg/dfKE1hT3gDFRllYMXMyf7rCjMt8VS0tlyNCm7Isd1Ls+05xHFOaph/PkWEYqK5r8jyPjDGcDxy+OGwYBCR4B0Q0VuEceIvUsZDu4r+C9tWw2bbNimH/BuTpOlNV1a9h+75PYRgeZgcQW5aFpmnimB62Wdd1F4fYvu+pbVtyXZeTBHQQRRHleW4FhG/hH+WzlXW+1/7D+ghegiKgO/6LRyEgXdzxKIQOrrrQXAqJgF4Y9lVnZhxH+zgkg3me+UzJoMUPGwQBn0UtCL8pioKzdHKSJJRlGd8DEYPtuo6aprG/htQ5CMKpF3x6AbHSJayuYSFJAvKEJ3QNePX577Cd4vK2C43U2Blho0/xW46nf6cv9tXO7HWOFxkAAAAASUVORK5CYII=')";
    labels.forEach((label, index) => {
      label.classList.add('--swatch-image');
      const inputVal = label.parentElement.querySelector('input').value;
      const variant = JSOrganizer.getVariantByColor(inputVal, data);
      const featuredMedia = variant && variant.featured_media ? variant.featured_media : null;
      if(!featuredMedia){
        label.style.setProperty('--variant-swatch', placeholderUrl);
        label.classList.add('--swatch-placeholder');
        return;
      };
      label.style.setProperty('--variant-swatch', `url(${featuredMedia.preview_image.src})`);
    });
  }

  static setHeaderTransparent(){
    let offset = 0;
    const header = document.querySelector('[data-header-transparent]');
    if(!header) return;
    if(header.dataset.headerTransparent === 'false'){
      document.body.style.removeProperty('--make-transparent-offset');
      header.classList.remove('--make-transparent');
      return;
    }
    const firstElements = document.querySelectorAll('.shopify-section-group-header-group:not(.page-main-header)');
    if(firstElements.length > 0){
      firstElements.forEach(element => {
        const height = element.getBoundingClientRect().height;
        offset += height;
      });
    }
    offset += 'px';
    document.body.style.setProperty('--make-transparent-offset', offset);
    header.classList.add('--make-transparent');
  }

  static resetRecipientForm(parent){
    const parentElement = parent ? document.querySelector(parent) : null;
    const form = parentElement ? parentElement.querySelector('recipient-form') : document.querySelector('recipient-form');
    if(!form) return;
    form.clearInputFields();
  }
  // JSOrganizer
}
customElements.define('js-organizer', JSOrganizer);

document.addEventListener('DOMContentLoaded', function (event) {
  JSOrganizer.setHeaderTransparent();
});

document.addEventListener('shopify:section:load', function (event) {
  const target = event.target;
  const checkAttr = target.querySelector('[data-header-transparent]');
  if(!checkAttr) return;
  JSOrganizer.setHeaderTransparent();
});

// custom functions
function validation() {
  let email = document.querySelectorAll('[name="contact[email]"]');
  let pattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
  
  email.forEach(input => {
    let text = input.closest('form').querySelector('.results-wrap_message');
    if (input.value.match(pattern)) {
      if(text) text.innerHTML = window.accessibilityStrings.newsletterValidMessage;
      if(text) text.style.color = 'var(--section-success-color)';
      input.classList.remove('form-control--error');
      input.closest('form').querySelector('[type="submit"]').removeAttribute('disabled');
    } else {
      if(text) text.innerHTML = window.accessibilityStrings.newsletterInValidMessage;
      if(text) text.style.color = 'var(--section-error-color)';
      input.classList.add('form-control--error');
      input.closest('form').querySelector('[type="submit"]').setAttribute('disabled', '');
      if (event.keyCode == '13') {
        event.preventDefault();
      }
    }
  
    if (input.value == '') {
      if(text) text.innerHTML = "";
      if(text) text.style.color = 'var(--section-success-color)';
      input.classList.remove('form-control--error');
      input.closest('form').querySelector('[type="submit"]').setAttribute('disabled', '');
    }
  });
};

if (!customElements.get('product-recommendations')) {
  customElements.define('product-recommendations', class ProductRecommendations extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      this.empty = true;
      const handleIntersection = (entries, observer) => {
        if (!entries[0].isIntersecting) return;
        observer.unobserve(this);
        fetch(this.dataset.url)
          .then(response => response.text())
          .then(text => {
            const html = document.createElement('div');
            html.innerHTML = text;
            const recommendations = html.querySelector('.product-recommendations');
            if (recommendations && recommendations.innerHTML.trim().length) {
              this.empty = false;
              this.innerHTML = recommendations.innerHTML;
              if(!recommendations.innerHTML.includes('data-recommend-check')){
                let recommendationAncestor = this.parentElement;
                while (recommendationAncestor && !recommendationAncestor.classList.contains('recommendation')) {
                  recommendationAncestor = recommendationAncestor.parentElement;
                }
                if(recommendationAncestor) recommendationAncestor.classList.add('hidden');
              }
            }
          })
          .catch(e => {
            console.error(e);
          })
          .finally(() => {
            if(this.empty) this.parentElement.classList.add('hidden');
          }
        );
      }
      new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
    }
  });
}

// hover class on focus
if (!customElements.get('focused-element')) {
  customElements.define('focused-element', class FocusedElement extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback(){
      JSOrganizer.addHoverOnElement(this);
    }
  });
}

function pauseElementBasedMedia(element) {
  element.querySelectorAll('.js-youtube').forEach((video) => {
    video.contentWindow.postMessage('{"event":"command","func":"' + 'pauseVideo' + '","args":""}', '*');
  });
  element.querySelectorAll('.js-vimeo').forEach((video) => {
    video.contentWindow.postMessage('{"method":"pause"}', '*');
  });
  element.querySelectorAll('video').forEach((video) => video.pause());
  element.querySelectorAll('product-model').forEach((model) => {
    if (model.modelViewerUI) model.modelViewerUI.pause();
  });
}

// deferred media
class DeferredMedia extends HTMLElement {
  constructor() {
    super();
    const poster = this.querySelector('[data-id^="Deferred-Poster-"]');
    if (!poster) return;
    poster.addEventListener('click', this.loadContent.bind(this));
  }

  loadContent(focus = true) {
    if (!this.getAttribute('loaded')) {
      const content = document.createElement('div');
      content.appendChild(this.querySelector('template').content.firstElementChild.cloneNode(true));

      this.setAttribute('loaded', true);
      if(this.dataset.sectionId){
        const section = document.getElementById(this.dataset.sectionId);
        section.classList.add('--remove-sliders');
      }
      const deferredElement = this.appendChild(content.querySelector('video, model-viewer, iframe'));
      if (focus) deferredElement.focus();
      if (deferredElement.nodeName == 'VIDEO' && deferredElement.getAttribute('autoplay')) {
        // force autoplay for safari
        deferredElement.play();
      }
    }
  }
}
customElements.define('deferred-media', DeferredMedia);

// marquee
if (!customElements.get('marquee-component')) {
  customElements.define('marquee-component', class MarqueeComponent extends HTMLElement {
    constructor() {
      super();
      this.onLoad = setTimeout(this.initialize.bind(this), 2000);
    }

    connectedCallback(){
      this.columnsCount = this.querySelectorAll('.marquee-component_col:not([class*="cloned"])').length;
      document.addEventListener('DOMContentLoaded', function(){this.onload;});
    }

    initialize(){
      this.init = null;
      this.initBounds = this.getColumnsSize() * 2;
      this.mainBounds = this.dataset.rotation ? this.getBoundingClientRect().height : this.getBoundingClientRect().width;
      this.createClones();
      this.dataset.direction === 'forward' ? this.setOnMarquee(this.initBounds * -1, this.initBounds) : this.setOnMarquee(0, this.initBounds);

      if(this.dataset.pauseOnHover === 'true'){
        this.addEventListener('mouseenter', this.setOnPause.bind(this));
        this.addEventListener('mouseleave', this.setOnResume.bind(this));
      }
    }

    setOnMarquee(pos, cycle){
      const speed = parseFloat(this.dataset.speed);
      let cycleCount = cycle;
      let container = this.querySelector('.marquee-component');
      clearInterval(this.init);
      this.init = setInterval(frame.bind(this), speed);

      function frame(){
        if(cycleCount <= 1){
          clearInterval(this.init);
          if(this.dataset.rotation){
            container.style.top = 0 + 'px';
          } else{
            container.style.left = 0 + 'px';
          }
          this.dataset.direction === 'forward' ? this.setOnMarquee(this.initBounds * -1, this.initBounds) : this.setOnMarquee(0, this.initBounds);
          this.pos = pos;
        
        } else{
          this.dataset.direction === 'forward' ? pos++ : pos--;
          cycleCount--;
          this.pos = pos;
          this.cycleCount = cycleCount;
          
          if(this.dataset.rotation){
            container.style.top = pos + 'px';
          } else{
            container.style.left = pos + 'px';
          }
        }
      }
    }

    setOnPause(){
      clearInterval(this.init);
    }

    setOnResume(){
      this.setOnMarquee(this.pos, this.cycleCount);
    }

    setContainer(size, container){
      if(this.dataset.rotation){
        container.style.height = size + 'px';
        container.style.top = (this.initBounds * -1) + 'px';
      } else{
        container.style.width = size + 'px';
        container.style.left = (this.initBounds * -1) + 'px';
      }
    }

    setTabIndexing(){
      const focusables = this.querySelectorAll('[class*="cloned"] a', '[class*="cloned"] button');
      focusables.forEach(element => {
        element.tabIndex = -1;
        element.setAttribute('aria-hidden', 'true');
      });
    }

    createClones(){
      const wrapper = this.querySelector('.marquee-component');
      this.sizes = this.getColumnsSize();
      this.clone(wrapper);

      while(this.sizes < this.mainBounds){
        this.clone(wrapper);
        this.createClones();
      }
      this.setContainer(this.sizes, wrapper);
      this.setTabIndexing();
    }

    clone(wrapper){
      const columns = this.querySelectorAll('.marquee-component_col:not([class*="cloned"])');
      for(const column of columns){
        const clonedColumn = column.cloneNode(true);
        clonedColumn.classList.add('clonedBefore');
        wrapper.insertBefore(clonedColumn, columns[0]);
      }
      for(const column of columns){
        const clonedColumn = column.cloneNode(true);
        clonedColumn.classList.add('clonedAfter');
        wrapper.appendChild(clonedColumn);
      }
    }

    getColumnsSize(){
      let widths = 0;
      const columns = this.querySelectorAll('.marquee-component_col');
      columns.forEach(column => {
        const bounds = column.getBoundingClientRect();
        widths += this.dataset.rotation ? bounds.height : bounds.width;
      });
      return widths;
    }
  });
}

// sticky block
if (!customElements.get('sticky-block')) {
  customElements.define('sticky-block', class StickyBlock extends HTMLElement {
    constructor() {
      super();
      
      if(!this.dataset.refBlock && !this.dataset.behavior) return;
      this.onLoad = setTimeout(this.initialize.bind(this), 2000);
    }
    
    connectedCallback(){
      document.addEventListener('DOMContentLoaded', function(){this.onload;});
    }
    
    initialize(){
      this.behavior = this.dataset.behavior;
      this.spacer = this.dataset.spacer;
      this.endBounds = document.body.offsetHeight + this.offsetHeight;
      
      if(this.behavior){
        switch (this.behavior) {
          case 'downwards':
            window.addEventListener('scroll', this.onDownwardScroll.bind(this));
            break;
          case 'upwards':
            window.addEventListener('scroll', this.onUpwardScroll.bind(this));
            break;
          case 'stacked':
            window.addEventListener('scroll', this.onStackedScroll.bind(this));
            break;
          case 'observer':
            window.addEventListener('scroll', this.onObservedScroll.bind(this));
            break;
          default:
            console.log('init sticky block');
            break;
        }
      }
      this.refBlock = document.querySelector(this.dataset.refBlock);
      if(!this.refBlock) return;
      this.refBoundings = this.refBlock.getBoundingClientRect();
      this.offset = this.dataset.offset ? parseFloat(this.dataset.offset) : 0;
      this.threshold = this.refBlock.offsetTop + this.refBoundings.height + this.offset;
      this.previousScrollAmount = window.screenY;
      this.percent = this.dataset.pagePercentage ? this.dataset.pagePercentage : null;
      if(this.spacer) this.height = this.refBlock.offsetHeight;
    }

    onObservedScroll(){
      let revealedAttr = true;
      const handleObserver = (entries, observer) => {
        observer.unobserve(this);
        entries.forEach(entry => {
          if(entry.isIntersecting){
            revealedAttr = false;
          } else{
            revealedAttr = true;
          }
          this.setStickyStatus(revealedAttr);
        });
      }
      new IntersectionObserver(handleObserver, {rootMargin: '0px 0px -60px 0px'}).observe(this);
    }
    
    onDownwardScroll(){
      let revealedAttr = false;
      if(this.percent){
        const pageHeight = document.documentElement.offsetHeight;
        const threshold = pageHeight * parseFloat(this.percent) / 100;
        this.threshold = threshold;
      }
      if(window.scrollY > this.threshold) revealedAttr = true;
      this.dropdownClose();
      this.setStickyStatus(revealedAttr);
    }
    
    onUpwardScroll(){
      let revealedAttr = false;
      const threshold = this.height ? this.height : this.refBlock.offsetHeight;
      
      if(window.scrollY > this.previousScrollAmount){
        revealedAttr = false;
        
      } else if (window.scrollY < this.previousScrollAmount) {
        revealedAttr = true;
        this.dropdownClose();
        if(window.scrollY < threshold) revealedAttr = false;
      }
      this.setStickyStatus(revealedAttr);
      this.previousScrollAmount = window.scrollY;
    }
    
    onStackedScroll(){
      let revealedAttr = false;
      if(this.refBoundings.y < 0) this.refBoundings.y += window.scrollY;
      if(this.refBoundings.y < window.scrollY) revealedAttr = true;
      this.dropdownClose();
      this.setStickyStatus(revealedAttr);
    }
    
    setStickyStatus(revealed){
      if(this.dataset.hideOnEnd === 'true'){
        if((window.innerHeight + window.scrollY) >= this.endBounds){
          this.stickyHide();
          return;
        }
      }
      
      if(revealed){
        this.setAttribute('data-revealed', true);
        if(this.dataset.hasHidden === 'true') this.removeAttribute('aria-hidden');
        if(this.dataset.bodyClass) document.body.classList.add(this.dataset.bodyClass);
        if(this.height){
          this.style.height = this.height + 'px';
          if(this.dataset.bodyClass) document.body.style.setProperty('--page-header-height', this.height + 'px');
        }
        return;
      }
      this.stickyHide();
    }
    
    stickyHide(){
      this.setAttribute('data-revealed', false);
      if(this.dataset.hasHidden === 'true') this.setAttribute('aria-hidden', true);
      if(this.dataset.bodyClass) document.body.classList.remove(this.dataset.bodyClass);
      if(this.height){
        this.style.removeProperty('height');
        if(this.dataset.bodyClass) document.body.style.removeProperty('--page-header-height');
      }
    }
    
    dropdownClose(){
      const dropdowns = this.querySelectorAll('dropdown-component');
      if(!dropdowns) return;
      dropdowns.forEach(dropdown => {
        if(!dropdown.button) return;
        dropdown.close();
      });
    }
  });
}

// button dropdown component
if (!customElements.get('dropdown-component')) {
  customElements.define('dropdown-component', class DropdownComponent extends HTMLElement {
    constructor() {
      super();
      
      if(this.dataset.desktopHidden === 'true' && screen.width > 767) return;
      if(this.dataset.desktopHidden === 'wide' && screen.width > 991) return;
      this.button = this.querySelector('.dropdown-component_opener:not(.hidden)');
      this.content = this.querySelector('.dropdown-component_wrapper');
      this.onButtonClick = this.toggleDropdown.bind(this);
      this.shareEvent = this.copyToClipboard.bind(this);
      this.onButtonClose = this.close.bind(this);
      this.onBodyClick = this.onBodyClick.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.button.addEventListener('click', this.onButtonClick);

      if(this.dataset.submission === 'true'){
        this.input = this.querySelector('input');
        const itemsArr = this.content.querySelectorAll('.dropdown-component_btn-submit');
        if(!itemsArr) return;
        itemsArr.forEach(item => {item.addEventListener('click', this.onItemClick.bind(this));});
      }
      
      if(this.dataset.sorting === 'true'){
        const itemsArr = this.content.querySelectorAll('[data-btn-sort]');
        if(!itemsArr) return;
        itemsArr.forEach(item => {item.addEventListener('click', this.onSort.bind(this));});
      }
      
      if(this.dataset.closeButton === 'true'){
        const closeButton = this.querySelector('[data-dropdown-close-btn]');
        if(closeButton) closeButton.addEventListener('click', this.onButtonClose);
      }
      
      if(this.dataset.share === 'true'){
        this.elements = {
          successMessage: this.querySelector('.shareMessage'),
          closeButton: this.querySelector('.share-button__close'),
          shareButton: this.querySelector('.share-button__copy'),
          urlInput: this.querySelector('.shareUrl')
        }
        if(navigator.share){
          this.button.removeEventListener('click', this.onButtonClick);
          this.button.addEventListener('click', () => { navigator.share({ url: this.elements.urlInput.value, title: document.title }); });
          return;
        }
      }

      if(this.dataset.facets === 'true') this.closeButton = this.querySelector('[data-toggle-facets="close"]');
      
      this.setIndexing(false);
    }

    toggleDetails(){
      if(!this.dataset.share) return;
      this.elements.successMessage.classList.add('hidden');
      this.elements.successMessage.textContent = '';
      this.elements.closeButton.classList.add('hidden');
    }

    copyToClipboard(){
      if(!this.dataset.share) return;
      navigator.clipboard.writeText(this.elements.urlInput.value).then(() => {
        this.elements.successMessage.classList.remove('hidden');
        this.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess;
        this.elements.closeButton.classList.remove('hidden');
      });
      this.elements.closeButton.addEventListener('click', this.onButtonClose);
    }

    open(){
      this.button.setAttribute('aria-expanded', true);
      this.content.focus();
      trapFocus(this.content);
      this.content.classList.add('dropdown--open');
      const focusables = this.dataset.dropdownLevel === '2' ? this.querySelectorAll('a[data-level="2"],button[data-level="2"]') : this.querySelectorAll('a[data-level="1"],button[data-level="1"]');
      document.body.addEventListener('click', this.onBodyClick);
      this.addEventListener('keyup', this.onKeyUp);
      if(this.dataset.facets === 'true') this.closeButton.addEventListener('click', this.onButtonClose);
      if(this.dataset.share === 'true'){
        if(!navigator.share){
          this.elements.shareButton.addEventListener('click', this.shareEvent);
        }
      }
      if(this.dataset.focusForm === 'true') this.focusForm();
      if(!focusables) return;
      this.setIndexing(true, focusables);
    }

    close(){
      this.button.setAttribute('aria-expanded', false);
      this.content.classList.remove('dropdown--open');
      removeTrapFocus(this.content);
      document.body.removeEventListener('click', this.onBodyClick);
      this.removeEventListener('keyup', this.onKeyUp);
      if(this.dataset.parentFocus){
        const parentElement = document.querySelector(this.dataset.parentFocus);
        if(!parentElement) return;
        trapFocus(parentElement);
      }
      if(this.dataset.facets === 'true') this.closeButton.removeEventListener('click', this.onButtonClose);
      if(this.dataset.share === 'true'){
        if(navigator.share){
          this.elements.shareButton.removeEventListener('click', () => { navigator.share(); });
        
        } else{
          this.elements.shareButton.removeEventListener('click', this.shareEvent);
        }
        this.toggleDetails();
      }
      const focusables = this.dataset.dropdownLevel === '2' ? this.querySelectorAll('a[data-level="2"],button[data-level="2"]') : this.querySelectorAll('a[data-level="1"],button[data-level="1"]');
      if(!focusables) return;
      this.setIndexing(false, focusables);
    }

    toggleDropdown(event){
      if(event.target.getAttribute('aria-expanded') === 'true') return this.close();
      this.open();
    }

    onBodyClick(event){
      const target = event.target;
      if(this.contains(target) || target === this || target === this.button
        && this.button.getAttribute('aria-expanded') === 'true') return;
      
      if(this.dataset.dropdownLevel === '2'){
        event.stopPropagation();
        this.close();
        return;
      }

      this.close();
    }

    onKeyUp(event){
      if(event.code.toUpperCase() !== 'ESCAPE') return;
      if(this.dataset.dropdownLevel === '2' || this.dataset.parentFocus){
        event.stopPropagation();
        this.close();
        return;
      }
      this.close();
      this.button.focus();
    }

    onItemClick(event) {
      event.preventDefault();
      const form = document.getElementById(this.dataset.formId);
      if(this.input) this.input.value = event.currentTarget.dataset.value;
      if (this.input && form) form.submit();
    }
    
    onSort(event){
      event.preventDefault();
      const sortInput = document.getElementById(this.dataset.inputId);
      let filtersForm = document.querySelector('filters-form form');
      if(!sortInput || !filtersForm) return;
      const value = event.target.dataset.value;
      const text = event.target.firstChild.textContent;
      this.button.firstChild.textContent = text;
      sortInput.value = value;
      filtersForm.dispatchEvent(new Event('input'));
    }
    
    setIndexing(flag, arr = null){
      const focusables = arr ? arr : this.content.querySelectorAll('a[data-level],button[data-level]');
      if(!focusables) return;
      focusables.forEach(element => {
        indexing(flag, element);
      });
      
      function indexing(condition, element){
        if(condition){
          element.removeAttribute('tabindex');
        
        } else{
          element.setAttribute('tabindex', '-1');
        }
      }
    }

    focusForm(){
      const label = this.querySelector('label');
      label.click();
    }
  });
}

// scroll to section anchor
if (!customElements.get('hotspot-switcher')) {
  customElements.define('hotspot-switcher', class HotspotSwitcher extends HTMLElement {
    constructor() {
      super();
      
      this.button = this.querySelector('button');
    }

    connectedCallback(){
      if(!this.button) return;
      this.initialize();
    }

    initialize(){
      this.clickRef = this.onClickRef.bind(this);
      this.button.addEventListener('click', this.clickRef);
    }
    
    onClickRef(event){
      event.preventDefault();
      const scrollParent = document.querySelector(`${this.dataset.refParent} [data-scroll-parent]`);
      const parentTop = scrollParent.getBoundingClientRect().top;
      const refProduct = document.querySelector(`${this.dataset.refProduct}`);
      const productTop = refProduct.getBoundingClientRect().top;
      scrollParent.scrollTo({
        top: scrollParent.scrollTop + (productTop - parentTop),
        behavior: "smooth"
      });
      this.removeActives();
      JSOrganizer.setAttr(this.button, true, 'data-selected');
    }

    removeActives(){
      const components = document.querySelectorAll(`${this.dataset.refParent} hotspot-switcher`);
      components.forEach(component => {
        const button = component.querySelector('button');
        JSOrganizer.setAttr(button, false, 'data-selected');
      });
    }
  });
}

// scroll to section anchor
if (!customElements.get('smooth-anchor')) {
  customElements.define('smooth-anchor', class SmoothAnchor extends HTMLElement {
    constructor() {
      super();
      
      this.anchor = this.querySelector('a') ? this.querySelector('a') : this.querySelector('button');
      this.anchor.addEventListener('click', this.onClickRef.bind(this));
    }
    
    onClickRef(){
      event.preventDefault();

      const targetId = this.anchor.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if(targetElement){
        if(this.dataset.offset){
          let offset = 0;
          const offsetElement = document.querySelector(this.dataset.offset);
          if(!offsetElement){
            doScroll();
            if(targetElement.nodeName.toLowerCase() === 'input') targetElement.focus();
            return
          };
          const elementPosition = targetElement.getBoundingClientRect().top;
          offset = elementPosition + window.scrollY - offsetElement.offsetHeight;
          window.scrollTo({
            top: offset,
            behavior: "smooth"
          });
          if(targetElement.nodeName.toLowerCase() === 'input') targetElement.focus();
          return;
        }
        doScroll();
        if(targetElement.nodeName.toLowerCase() === 'input') targetElement.focus();
      }
      function doScroll(){
        targetElement.scrollIntoView({
          behavior: "smooth"
        });
      }
    }
  });
}

// modal / drawer toggler
if (!customElements.get('modal-component-toggler')) {
  customElements.define('modal-component-toggler', class ModalComponentToggler extends HTMLElement {
    constructor() {
      super();
      
      if(this.dataset.desktopHidden && screen.width > 991) return;
      if(this.dataset.mobileHidden && screen.width < 768) return;
      this.button = this.querySelector('button');
      this.button.addEventListener('click', this.toggleModal.bind(this));
    }

    open(modal){
      modal.open(this.button);
      this.button.setAttribute('data-expanded', 'true');
    }

    close(modal){
      modal.close();
    }

    toggleModal(event){
      event.preventDefault();
      if(this.dataset.storage === 'true') localStorage.setItem(this.dataset.storageKey, this.dataset.storageValue);
      const modal = document.querySelector(`[data-modal="${this.button.dataset.modalRef}"]`);
      if(this.button.dataset.expanded === 'true') return this.close(modal);
      this.open(modal);
    }
  });
}

// modal / drawer content component
if (!customElements.get('modal-component')) {
  customElements.define('modal-component', class ModalComponent extends HTMLElement {
    constructor() {
      super();

      if(this.dataset.desktopHidden && screen.width > 991) return;
      if(this.dataset.mobileHidden && screen.width < 768) return;
      if(this.dataset.storage === 'true'){
        const keyExists = localStorage.getItem(this.dataset.storageKey);
        if(keyExists === this.dataset.storageValue) return this.remove();
      }
      this.toggler = null;
      this.parent = null;
      this.content = this.querySelector('.modal-component');
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onBodyClick = this.onBodyClick.bind(this);
      if(this.dataset.trigger === 'self' && !window.location.href.includes('challenge')) this.open();
    }

    open(toggler = null){
      this.toggler = toggler;
      if(this.dataset.container === 'body'){
        this.parent = this.parentElement;
        document.body.append(this);
      }
      this.setClasses(true);
      if(this.dataset.includes === 'compare'){
        this.showCompareResults();
      } else{
        trapFocus(this.content);
        this.setListeners(true);
      }
    }

    close(){
      if(this.dataset.container === 'body'){
        if(this.parentNode === document.body) document.body.removeChild(this);
        if(this.parent) this.parent.append(this);
      }
      if(this.toggler) this.toggler.setAttribute('data-expanded', 'false');
      this.setClasses(false);
      if(this.toggler) removeTrapFocus(this.toggler);
      this.toggler = null;
      this.parent = null;
      this.setListeners(false);
      if(this.dataset.formReset === 'true'){
        const form = this.querySelector('form');
        if(form) form.reset();
      }
      this.pauseMedia();
    }

    setClasses(flag){
      if(!flag){
        this.classList.remove('modal--active');
        document.body.classList.remove(`${this.dataset.modal}--modal-active`, 'overflow-hidden');
        return;
      }
      this.classList.add('modal--active');
      document.body.classList.add(`${this.dataset.modal}--modal-active`, 'overflow-hidden');
    }

    setListeners(flag){
      if(this.dataset.hideOutside === 'false') return;
      if(flag){
        this.addEventListener('keyup', this.onKeyUp);
        if(this.dataset.includes !== 'compare') this.addEventListener('click', this.onBodyClick);
      
      } else{
        this.removeEventListener('keyup', this.onKeyUp);
        if(this.dataset.includes !== 'compare') this.removeEventListener('click', this.onBodyClick);
      }
    }

    onBodyClick(event){
      const target = event.target;
      const boundings = this.querySelector('.modal-component_body');
      if (boundings.contains(target) || target === boundings) return;
      this.close();
    }

    onKeyUp(event){
      if (event.code.toUpperCase() !== 'ESCAPE') return;
      this.close();
    }

    showCompareResults(){
      JSOrganizer.renderCompareList(this.dataset.url, this);
    }

    pauseMedia(){
      pauseElementBasedMedia(this);
    }
  });
}

if (!customElements.get('single-variant')) {
  customElements.define('single-variant', class SingleVariant extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback(){
      this.initialize();
    }

    initialize(){
      this.json = document.querySelector(this.dataset.jsonSelector);
      if(!this.json) return;
      this.data = JSON.parse(this.json.textContent);
      if(this.dataset.swatch === 'image') JSOrganizer.setSwatchImages(this, this.data);
      this.setListeners();
    }

    setListeners(){
      this.onChange = this.onVariantChange.bind(this);
      this.addEventListener('change', this.onChange);
    }

    onVariantChange(event){
      const colorVal = event.target.value;
      const filter = this.dataset.filter;
      switch(filter){
        case 'color':
          this.currentVariant = JSOrganizer.getVariantByColor(colorVal, this.data);
          break;
        default:
          console.log('other are not defined yet.');
          break;
      }
      JSOrganizer.setCurrVariant(this.currentVariant, this.dataset.forms);
      if(this.currentVariant === undefined) return JSOrganizer.toggleVariantAvail(this.dataset.renders, false, this.dataset.parent ? this.dataset.parentSelector : null);
      JSOrganizer.toggleVariantAvail(this.dataset.renders, true, this.dataset.parent ? this.dataset.parentSelector : null);
      if(this.dataset.mediaTemplate) this.switchImage();
      if(this.dataset.dragSelector){
        const dragSlider = document.querySelector(this.dataset.dragSelector);
        dragSlider.scrollToImage(this.currentVariant);
      }
      JSOrganizer.onVariantRender(this.dataset.productUrl, this.currentVariant.id, this.dataset.renders, this.dataset.sectionId, this.dataset.updateUrl, this.dataset.loader, this.dataset.parent ? this.dataset.parentSelector : null);
    }

    switchImage(){
      const template = document.querySelector(this.dataset.mediaTemplate);
      if (!template) return;
      JSOrganizer.switchVariantMedia(this.currentVariant, this.dataset.parentSelector, template);
    }
  });
}

if (!customElements.get('drag-slider')) {
  customElements.define('drag-slider', class DragSlider extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback(){
      this.slider = this.querySelector('input');
      if(this.slider) this.setListeners();
    }

    setListeners(){
      this.change = this.onChange.bind(this);
      this.slider.addEventListener('input', this.change);
    }

    onChange(){
      const index = parseInt(this.slider.value, 10);
      const childs = this.querySelectorAll('[data-media-id]');
      const imageElement = childs[index];
      this.scrollToElement(imageElement);
    }

    scrollToImage(variant) {
      const currMedia = variant.featured_media;
      if(!currMedia) return;
      const imageElement = this.querySelector(`[data-media-id="${currMedia.id}"]`);
      if(!imageElement) return;
      const childs = Array.from(this.querySelectorAll('[data-media-id]'));
      this.slider.value = childs.indexOf(imageElement);
      this.scrollToElement(imageElement);
    }

    scrollToElement(imageElement){
      imageElement.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  });
}

// search bar reset button
if (!customElements.get('reset-input-button')) {
  customElements.define('reset-input-button', class ResetInputButton extends HTMLElement {
    constructor() {
      super();

      this.button = this.querySelector('button');
      this.form = this.button.closest('form');
    }

    connectedCallback(){
      if(!this.button || !this.form) return;
      this.initialize();
    }

    initialize(){
      this.setListners();
    }

    setListners(){
      this.resetForm = this.onResetForm.bind(this);
      this.button.addEventListener('click', this.resetForm);
    }

    onResetForm(event){
      event.preventDefault();
      if(this.dataset.predictContainer) toggleResults(false, this.dataset.predictContainer, this.dataset.parent);
      this.form.reset();
      if(!this.dataset.component) return;
      if(this.dataset.disableClose ===  'true' && window.screen.width > 991) return;
      const component = document.querySelector(this.dataset.component);
      component.close();
    }
  });
}

// quantity input
if (!customElements.get('atc-submit-form')) {
  customElements.define('atc-submit-form', class AddToCartSubmitForm extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback(){
      this.initialize();
    }

    initialize(){
      this.setListeners();
    }

    setListeners(){
      this.form = document.querySelector(this.dataset.form);
      if(!this.form) return;
      this.submit = this.onAddToCart.bind(this);
      this.form.addEventListener('submit', this.submit);
    }

    onAddToCart(event){
      event.preventDefault();
      JSOrganizer.togglerLoader(true);
      this.error = false;
      const secArr = JSON.parse(this.dataset.sections);
      const config = fetchConfig('javascript');
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      delete config.headers['Content-Type'];
      const formData = new FormData(this.form);
      formData.append('sections', secArr.map(section => section.id));
      formData.append('sections_url', window.location.pathname);
      config.body = formData;
      if(this.dataset.updateLineId) return JSOrganizer.lineItemUpdateRmover(this.dataset.updateLineId, 0, secArr, config, this);
      this.fetchAtc(secArr, config);
    }

    fetchAtc(secArr, config){
      fetch(`${routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          this.dataset.parent === 'true' ? this.handleAtcError(response, this.dataset.parentSelector) : this.handleAtcError(response);
          if(!this.error) JSOrganizer.sectionArrRender(secArr, response);
        })
        .catch((e) => {
          console.error(e);
          this.error = true;
        })
        .finally(() => {
          if(!this.error){
            if(this.dataset.modal === 'true'){
              JSOrganizer.showCartDrawer(this.dataset.modalRef);
            }
            if(this.dataset.redirectTo) return window.location.href = this.dataset.redirectTo;
            if(this.dataset.modalClose){
              const modal = document.querySelector(this.dataset.modalClose);
              if(modal){
                const toggler = modal.querySelector('modal-component-toggler');
                toggler.button.dispatchEvent(new Event('click'));
              }
            }
            JSOrganizer.resetRecipientForm(this.dataset.parent === 'true' ? this.dataset.parentSelector: null);
            this.atLast();
            return;
          }
          this.atLast();
        }
      );
    }

    atLast(){
      JSOrganizer.resetQty(this.form, this.dataset.parent === 'true' ? this.dataset.parentSelector: null);
      JSOrganizer.togglerLoader(false);
    }

    handleAtcError(response, parentSelector){
      let parentElement = null;
      if(parentSelector) parentElement = document.querySelector(parentSelector);
      const errorContainer = parentElement ? parentElement.querySelector(this.dataset.errorSelector) : document.querySelector(this.dataset.errorSelector);
      if(!errorContainer) return;
      if(response.quantity === 0) return this.hasError = true;
      const errorTextSpan = errorContainer.querySelector('[data-error]');
      errorContainer.classList.add('hidden');
      errorTextSpan.innerText = '';
      const recipientForm = document.querySelector('recipient-form');
      if(recipientForm) recipientForm.clearErrorMessage();
      if(response.message){
        this.error = true;
        let message = response.description;
        if(typeof(response.description) === 'object'){
          message = response.message;
          if(recipientForm) recipientForm.displayErrorMessage(message, response.errors);
        }
        errorContainer.classList.remove('hidden');
        errorTextSpan.innerText = message;
      }
    }
  });
}

if (!customElements.get('shipping-bar')) {
  customElements.define('shipping-bar', class ShippingBar extends HTMLElement {
    constructor() {
      super();
    }
    
    connectedCallback(){
      this.setString();
      this.setBar();
    }
    
    setString(){
      const dataRate = parseFloat(this.dataset.amount);
      const rateFactor = Shopify.currency.rate || 1;
      const amountCalc = dataRate * rateFactor;
      const html = this.innerHTML;
      const cartTotals = parseFloat(this.dataset.cartTotals) / 100;
      const amount = (amountCalc - cartTotals) * 100;
      if(amount > 0){
        this.innerHTML = html.replace(/\|\|amount\|\|/g, Shopify.formatMoney(amount, window.money_format));
      } else{
        const textContainer = this.querySelector('.shipping-bar_text');
        textContainer.innerHTML = window.cartStrings.shippingAmount;
      }
      this.threshold = amountCalc;
      this.cartTotals = cartTotals;
    }
    
    setBar(){
      const element = this.querySelector('progress');
      if(!element) return;
      const value = (this.cartTotals / this.threshold) * 100;
      element.setAttribute('value', value.toFixed(2));
      element.innerText = value.toFixed(2);
    }
  });
}

if (!customElements.get('product-variants')) {
  customElements.define('product-variants', class ProductVariants extends HTMLElement {
    constructor() {
      super();
      this.json = document.querySelector(this.dataset.jsonSelector);
    }

    connectedCallback(){
      if(!this.json) return;
      this.data = JSON.parse(this.json.textContent);
      this.initialize();
    }

    initialize(){
      if(this.dataset.swatch === 'image') JSOrganizer.setSwatchImages(this, this.data);
      this.setListeners();
    }

    setListeners(){
      this.onChange = this.onVariantChange.bind(this);
      this.addEventListener('change', this.onChange);
    }

    onVariantChange(){
      this.getSelectedVarintOptions();
      this.selectedVariantData();
      this.updateVariantStatuses();
      JSOrganizer.setCurrVariant(this.currentVariant, this.dataset.forms);
      if(this.currentVariant === undefined) return JSOrganizer.toggleVariantAvail(this.dataset.renders, false, this.dataset.parent ? this.dataset.parentSelector : null);
      if(this.dataset.mediaTemplate){
        this.switchImage();
      } else{
        JSOrganizer.setVariantMedia(this.currentVariant, this.dataset.gallery, this.dataset.slider, this.dataset.parent ? this.dataset.parentSelector : null);
      }
      JSOrganizer.toggleVariantAvail(this.dataset.renders, true, this.dataset.parent ? this.dataset.parentSelector : null);
      JSOrganizer.onVariantRender(this.dataset.productUrl, this.currentVariant.id, this.dataset.renders, this.dataset.sectionId, this.dataset.updateUrl, this.dataset.loaderSelector, this.dataset.parent ? this.dataset.parentSelector : null);
    }

    switchImage(){
      const template = document.querySelector(this.dataset.mediaTemplate);
      if (!template) return;
      JSOrganizer.switchVariantMedia(this.currentVariant, this.dataset.parentSelector, template);
    }
    
    getSelectedVarintOptions(){
      this.variantRows = this.querySelectorAll('fieldset');
      const variantDataRows = Array.from(this.variantRows);
      this.options = variantDataRows.map((rowSet) => {
        return Array.from(rowSet.querySelectorAll('input[type="radio"]')).find((radio) => radio.checked).value;
      });
    }

    selectedVariantData() {
      if(this.variantRows.length == 1){
        const currentVariants = this.data.variants.filter((variant) => variant.options.find((x) => x === this.options[0]));
        this.currentVariant = currentVariants.find((variant) => variant.available)
        if(!this.currentVariant) this.currentVariant = currentVariants[0];
        return;
      }
      this.currentVariant = this.data.variants.find((variant) => {
        return !variant.options.map((option, index) => {
          return this.options[index] === option;
        }).includes(false);
      });
    }

    updateVariantStatuses() {
      const selectedOptionOneVariants = this.data.variants.filter(variant => this.querySelector(':checked').value === variant.option1);
      const inputWrappers = [...this.variantRows];
      inputWrappers.forEach((option, index) => {
        if (index === 0) return;
        const optionInputs = [...option.querySelectorAll('input[type="radio"]')];
        const previousOptionSelected = inputWrappers[index - 1].querySelector(':checked').value;
        const availableOptionInputsValue = selectedOptionOneVariants.filter(variant => variant.available && variant[`option${ index }`] === previousOptionSelected).map(variantOption => variantOption[`option${ index + 1 }`]);
        this.setAvailability(optionInputs, availableOptionInputsValue);
      });
    }

    setAvailability(listOfOptions, listOfAvailableOptions) {
      listOfOptions.forEach(input => {
        const label = input.nextElementSibling;
        const labelText = label.querySelector('[data-variant-status-text]');
        if (listOfAvailableOptions.includes(input.getAttribute('value'))){
          input.classList.remove('disabled');
          labelText.classList.add('hidden'), labelText.classList.remove('visually-hidden');
          return;
        }
        input.classList.add('disabled');
        labelText.classList.remove('hidden'), labelText.classList.add('visually-hidden');
      });
    }
  });
}

if (!customElements.get('line-item-remove')) {
  customElements.define('line-item-remove', class LineItemRemoveButton extends HTMLElement {
    constructor() {
      super();
      this.button = this.querySelector('button');
    }

    connectedCallback(){
      if(!this.button) return;
      this.initialize();
    }

    initialize(){
      this.setListeners();
    }

    setListeners(){
      this.removal = this.onRemoval.bind(this);
      this.button.addEventListener('click', this.removal);
    }

    onRemoval(event){
      event.preventDefault();
      JSOrganizer.lineItemUpdate(this.dataset.lineId, 0, this.dataset.sections, this.dataset.parentSelector)
    }
  });
}

// Countdown_Timer
if (!customElements.get('countdown-timer')) {
  customElements.define('countdown-timer', class CountdownTimer extends HTMLElement {
    constructor() {
      super();
      const endDate = new Date(this.getAttribute('end-date'));
      if (isNaN(endDate)) {
        this.classList.add('hidden');
        if(this.dataset.parent === 'true') this.parentElement.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      } else {
        const remainingTime = endDate.getTime() - Date.now();
        if (remainingTime <= 0) {
          this.innerHTML = `<div class="block"><span class="time">0</span><span class="text">${window.additionalStrings.countdown_days_label}</span></div><div class="block"><span class="time">0</span><span class="text">${window.additionalStrings.countdown_hours_label}</span></div><div class="block"><span class="time">0</span><span class="text">${window.additionalStrings.countdown_min_label}</span></div><div class="block"><span class="time">0</span><span class="text">${window.additionalStrings.countdown_sec_label}</span></div>`;
        } else {
          this.remainingTime = remainingTime;
          this.innerHTML = this.getTimeString();
        }
      }
    }

    connectedCallback() {
      if (isNaN(this.remainingTime)) {
        this.classList.add('hidden');
        if(this.dataset.parent === 'true') this.parentElement.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      }
      this.intervalId = setInterval(() => {
        this.remainingTime -= 1000;
        this.innerHTML = this.getTimeString();
        if (this.remainingTime <= 0) {
          clearInterval(this.intervalId);
          this.dispatchEvent(new Event('timeup'));
        }
      }, 1000);
    }

    getTimeString() {
      if (isNaN(this.remainingTime) || this.remainingTime <= 0) {
        this.classList.add('hidden');
        if(this.dataset.parent === 'true') this.parentElement.classList.add('hidden');
        const message = this.nextElementSibling;
        if(!message || !message.classList.contains('countdown-timer_message')) return;
        message.classList.remove('hidden');
        return;
      }
      const days = Math.floor(this.remainingTime / (1000 * 60 * 60 * 24));
      const hours = Math.floor((this.remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((this.remainingTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((this.remainingTime % (1000 * 60)) / 1000);
      return `<div class="block"><span class="time">${days}</span><span class="text">${window.additionalStrings.countdown_days_label}</span></div><div class="block"><span class="time">${hours}</span><span class="text">${window.additionalStrings.countdown_hours_label}</span></div><div class="block"><span class="time">${minutes}</span><span class="text">${window.additionalStrings.countdown_min_label}</span></div><div class="block"><span class="time">${seconds}</span><span class="text">${window.additionalStrings.countdown_sec_label}</span></div>`;
    }
  });
}

if (!customElements.get('quantity-input')) {
  customElements.define('quantity-input', class QuantityInput extends HTMLElement {
    constructor() {
      super();
      this.initialize();
    }

    initialize(){
      this.input = this.querySelector('input');
      this.inputUpdate = this.querySelector('[name="updates[]"]');
      this.qtySubtotal = this.querySelector('[data-qty-subtotal]');
      if(!this.input) return;
      this.setListeners();
    }

    setListeners(){
      this.changeEvent = new Event('input', { bubbles: true });
      this.inputChange = this.onInputChange.bind(this);
      this.buttonClick = this.onButtonClick.bind(this);
      this.debouncedOnUpdate = debounce((event) => {
        this.onLineItemUpdate(event);
      }, 500);

      if(this.inputUpdate) this.inputUpdate.addEventListener('input', this.debouncedOnUpdate);
      this.input.addEventListener('input', this.inputChange);
      this.querySelectorAll('button').forEach(
        (button) => button.addEventListener('click', this.buttonClick)
      );
    }

    onLineItemUpdate(){
      const qty = parseInt(this.querySelector('[name="updates[]"]').value);
      JSOrganizer.lineItemUpdate(this.dataset.lineId, qty, this.dataset.sections, this.dataset.parentSelector);
    }

    onInputChange() {
      const value = parseInt(this.input.value);
      if (this.input.min) this.setMinStatus(value);
      if (this.input.max) {
        const max = parseInt(this.input.max);
        const buttonPlus = this.querySelector("button[name='plus']");
        buttonPlus.classList.toggle('disabled', value >= max);
        buttonPlus.toggleAttribute('disabled', value >= max);
      }
      this.setSubtotals(value);
      this.setRefInput(this.input.value);
    }

    onButtonClick(event) {
      event.preventDefault();
      const previousValue = this.input.value;
      
      if(event.target.name === 'plus' || event.target.parentElement.name === 'plus'){
        this.input.stepUp();
      } else{
        this.input.stepDown();
      }
      this.setRefInput(this.input.value);
      if(previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
    }

    setMinStatus(value){
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector("button[name='minus']");
      buttonMinus.classList.toggle('disabled', value <= min);
      buttonMinus.toggleAttribute('disabled', value <= min);
    }

    setRefInput(val){
      const modal = this.closest('modal-component') || this.closest(this.dataset.refInput);
      if(!modal) return;
      const quantityInputs = modal.querySelectorAll('[name="quantity"]');
      if(!quantityInputs) return;
      quantityInputs.forEach(input => {
        input.value = val;
      });
    }

    setSubtotals(qty){
      let qtySubtotal = this.querySelector('[data-qty-subtotal]');
      if(!qtySubtotal) qtySubtotal = document.querySelector(this.dataset.refSubtotals);
      if(!qtySubtotal) return;
      const total = qty * parseInt(this.dataset.variantPrice);
      qtySubtotal.innerHTML = Shopify.formatMoney(total, window.money_format);
    }
  });
}
if (!customElements.get('accordion-wrapper')) {
  customElements.define('accordion-wrapper', class AccordionWrapper extends HTMLElement {
    constructor() {
      super();
      
      this.toggle = this.querySelector('summary');
      if(this.toggle) this.toggle.addEventListener('click', this.accordion.bind(this));
    }
    
    accordion(event){
      if(this.toggle.parentElement.hasAttribute('open')) this.keepOpen(event);
      if(!this.toggle.parentElement.hasAttribute('open')) this.closeOther();
    }
    
    closeOther(){
      const allRows = document.querySelectorAll(`#${this.dataset.parent} details`);
      allRows.forEach(toggler => {
        if(toggler.querySelector('summary') === this.toggle) return;
        toggler.removeAttribute('open');
      });
    }
    
    keepOpen(event){
      const toggle = event.target.closest('details');
      toggle.removeAttribute('open');
    }
    
    hideOutside(event){
      const target = event.target;
      const boundings = this.querySelector('.open-close_slide');
      if (boundings.contains(target) || target === boundings || target.closest('.open-close_slide')) return;
      this.closeOther();
    }
  });
}