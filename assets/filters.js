class PriceRange extends HTMLElement {
  constructor() {
    super();

    this.infos = this.querySelectorAll('[data-infos-container]');
    this.inputs = this.querySelectorAll('input[type="range"]');
  }

  connectedCallback(){
    if(!this.infos && !this.inputs) return;
    this.initialize();
  }

  initialize(){
    this.setListeners();
  }

  setListeners(){
    this.watch = this.onSlideWatch.bind(this);
    this.inputs.forEach(input => {
      input.addEventListener('input', this.watch);
    });
  }

  onSlideWatch(){
    const minInput = this.querySelector('.min');
    const maxInput = this.querySelector('.max');
    const minText = this.querySelector('[data-text-min]');
    const maxText = this.querySelector('[data-text-max]');
    var minVal = minInput.value;
    var maxVal = maxInput.value;
    if(minInput && minVal > maxVal-0) minInput.value = maxVal - 0;
    this.setPriceText(minText, minInput.value);
    if(maxInput && maxVal-0 < minVal) maxInput.value = 0 + minVal;
    this.setPriceText(maxText, maxInput.value);
  }

  setPriceText(element, value){
    const price = parseFloat(value) * 100;
    element.innerText = Shopify.formatMoney(price, window.money_format);
  }

  checkForParams(formData){
    let params= formData;
    const minInput = this.querySelector('.min');
    const maxInput = this.querySelector('.max');
    const minFlag = parseFloat(minInput.value) > parseFloat(minInput.min) ? true : false;
    const maxFlag = parseFloat(maxInput.value) < parseFloat(maxInput.max) ? true : false;
    if(minFlag || maxFlag) return params;
    params.delete('filter.v.price.gte');
    params.delete('filter.v.price.lte');
    return params;
  }

  reset(){
    const minInput = this.querySelector('.min');
    const maxInput = this.querySelector('.max');
    minInput.value = minInput.min;
    maxInput.value = maxInput.max;
  }
}
customElements.define('price-range', PriceRange);

if (!customElements.get('filters-form')) {
  customElements.define('filters-form', class FiltersForm extends HTMLElement {
    constructor() {
      super();

      this.cachedResults = [];
      this.debouncedOnSubmit = debounce((event) => {
        this.onSubmitHandler(event);
      }, 500);
      const filterForm = this.querySelector('form');
      filterForm.addEventListener('input', this.debouncedOnSubmit.bind(this));
      window.addEventListener('popstate', this.onHistoryChange.bind(this));
    }
  
    connectedCallback(){
      const form = this.querySelector('form');
      const params = this.createSearchParams(form);
      this.initParams = params ? params : '';
      this.checkEmptyFacets();
    }
  
    onHistoryChange(event){
      if(event.state && this.cachedResults.length === 0){
        const searchParams = event.state ? event.state.searchParams : this.initParams;
        const url = `${window.location.pathname}?section_id=${this.dataset.section}&${searchParams}`;
        this.renderFetch(url, false, searchParams);
        return;
      }
      
      if(this.cachedResults && this.cachedResults.length > 0){
        const searchParams = event.state ? event.state.searchParams : this.initParams;
        const term = {params: searchParams};
        if (this.cachedResults.some(key => key.params === term.params)) {
          this.renderFromCache(this.cachedResults, term, false);
        
        } else{
          const url = `${window.location.pathname}?section_id=${this.dataset.section}&${searchParams}`;
          this.renderFetch(url, false, searchParams);
        }
      }
    }
    
    onSubmitHandler(event){
      event.preventDefault();
      JSOrganizer.togglerLoader(true);
      const searchParams = this.createSearchParams(this.querySelector('form'));
      const url = `${window.location.pathname}?section_id=${this.dataset.section}&${searchParams}`;
      const term = {params: searchParams};
      if (this.cachedResults.length > 0 && this.cachedResults.some(key => key.params === term.params)) {
        this.renderFromCache(this.cachedResults, term, true);
        return;
      }
      this.renderFetch(url, true, searchParams);
    }
  
    renderFetch(url, updateURLHash = false, searchParams){
      fetch(url)
        .then(response => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          JSOrganizer.renderSelectorChanges(html, null, '[data-render-results-text]');
          JSOrganizer.renderSelectorChanges(html, null, '[data-render-sort]');
          JSOrganizer.renderSelectorChanges(html, null, '[data-render-products-count]');
          JSOrganizer.renderSelectorChanges(html, null, '[data-render-active-facets]');
          JSOrganizer.renderSelectorChanges(html, null, '[data-render-grid-products]');
          JSOrganizer.renderSelectorChanges(html, null, '[data-filters-count]');
          JSOrganizer.renderSelectorChanges(html, null, '[data-render-facets-form]');
          const cacheObj = {params: searchParams, content: responseText};
          this.cachedResults.push(cacheObj);
        })
        .catch((error) => {
          JSOrganizer.togglerLoader(false);
          console.log(error);
          throw error;
        })
        .finally(() => {
          JSOrganizer.togglerLoader(false);
          this.scrollToTop();
          if(updateURLHash) this.updateURLHash(searchParams);
          this.checkEmptyFacets();
        }
      );
    }
    
    renderFromCache(cache, filter, updateURLHash = false){
      const cacheDataArr = cache;
      const cachedResults = cacheDataArr.find(results => results.params === filter.params);
      const html = new DOMParser().parseFromString(cachedResults.content, 'text/html');
      JSOrganizer.renderSelectorChanges(html, null, '[data-render-results-text]');
      JSOrganizer.renderSelectorChanges(html, null, '[data-render-sort]');
      JSOrganizer.renderSelectorChanges(html, null, '[data-render-products-count]');
      JSOrganizer.renderSelectorChanges(html, null, '[data-render-active-facets]');
      JSOrganizer.renderSelectorChanges(html, null, '[data-render-grid-products]');
      JSOrganizer.renderSelectorChanges(html, null, '[data-filters-count]');
      JSOrganizer.renderSelectorChanges(html, null, '[data-render-facets-form]');
      JSOrganizer.togglerLoader(false);
      this.scrollToTop();
      if(updateURLHash) this.updateURLHash(filter.params);
      this.checkEmptyFacets();
    }

    checkEmptyFacets(){
      const component = this.closest('dropdown-component');
      if(!component) return;
      const widgets = component.querySelectorAll('.facet_widget-row');
      if(widgets.length > 0) return document.body.classList.remove('facet--hide-filters');;
      document.body.classList.add('facet--hide-filters');
    }
  
    createSearchParams(form) {
      let formData = new FormData(form);
      const priceRange = document.querySelector('price-range');
      if(priceRange) formData = priceRange.checkForParams(formData);
      return new URLSearchParams(formData).toString();
    }
  
    updateURLHash(searchParams) {
      if(!searchParams) searchParams = this.initParams;
      history.pushState({ searchParams }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
    }

    scrollToTop(){
      const grid = document.querySelector('[data-render-grid-products]');
      const offsetHeight = parseFloat(getComputedStyle(document.body).getPropertyValue('--page-header-height')) || 0;
      const scrollOffset = (grid.getBoundingClientRect().top + window.scrollY - 35) - offsetHeight;
      window.scrollTo({
        top: scrollOffset,
        behavior: 'smooth'
      });
      const component = this.closest('dropdown-component');
      if(component) component.close();
    }
  });
}

if (!customElements.get('facet-remove-button')) {
  customElements.define('facet-remove-button', class FacetRemoveButton extends HTMLElement {
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
      this.removeFacet = this.onRemoveFacet.bind(this);
      this.button.addEventListener('click', this.removeFacet);
    }

    onRemoveFacet(event){
      event.preventDefault();
      const filtersForm = document.querySelector(this.dataset.formSelector);
      if(this.dataset.isPrice === 'true'){
        const priceRange = document.querySelector('price-range');
        if(priceRange) priceRange.reset();
      } else{
        if(this.dataset.clearAll === 'true'){
          const inputs = filtersForm.querySelectorAll('input[type="checkbox"]');
          inputs.forEach(input => {
            input.checked = false;
            input.removeAttribute('checked');
          });
          filtersForm.reset();
          const priceRange = document.querySelector('price-range');
          if(priceRange) priceRange.reset();
        } else{
          const input = document.getElementById(this.dataset.for);
          input.checked = false;
          input.removeAttribute('checked');
        }
      }
      filtersForm.dispatchEvent(new Event('input'));
    }
  });
}