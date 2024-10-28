if (!customElements.get('predictive-button')) {
  customElements.define('predictive-button', class PredictiveSuggestions extends HTMLElement {
    constructor() {
      super();

      if(this.dataset.predictive === 'false') return;
      this.searchTerm = '';
      this.cachedResults = [];
      this.abortController = new AbortController();
      
      this.button = this.querySelector('button');
      this.form = this.button.closest('form');
      this.input = this.form.querySelector('input[name="q"]');
    }

    connectedCallback(){
      if(!this.button || !this.form) return;
      this.initialize();
    }

    initialize(){
      this.setListners();
    }

    setListners(){
      this.debouncedOnSubmit = debounce((event) => {
        this.onFetchQuery(event);
      }, 500);
      this.form.addEventListener('input', this.debouncedOnSubmit.bind(this));
    }

    onFetchQuery(event){
      JSOrganizer.togglerLoader(true, this.dataset.parent);
      toggleResults(false, this.dataset.predictContainer);
      const inputValueTerm = this.input.value.replace(/\s/g, "");
      if(inputValueTerm.length > 0){
        this.searchTerm = this.input.value.trim();
        const term = {searchTerm: this.searchTerm};
        if (!this.cachedResults || !this.cachedResults.some(key => key.searchTerm === term.searchTerm)) {
          this.fetchSearchResults(this.searchTerm);
          return;
        }
        this.showCachedResults(term, this.cachedResults);
        return;
      }
      JSOrganizer.togglerLoader(false, this.dataset.parent);
    }

    fetchSearchResults(terms){
      fetch(
        `${routes.predictive_search_url}?q=${encodeURIComponent(
          terms
        )}&section_id=predictive-organizer&resources[type]=${this.dataset.query}`,
        { signal: this.abortController.signal }
      )
        .then((response) => {
          if (!response.ok) {
            var error = new Error(response.status);
            console.log(error);
            JSOrganizer.togglerLoader(false, this.dataset.parent);
            throw error;
          }
          return response.text();
        })
        .then((text) => {
          const html = new DOMParser().parseFromString(text, 'text/html');
          const parentElement = document.querySelector(this.dataset.parent);
          const searchObj = {
            searchTerm: this.searchTerm,
            contentHtml: html
          }
          this.cachedResults.push(searchObj);
          JSOrganizer.renderSelectorChanges(html, parentElement, '[data-render-predict-results]');
          JSOrganizer.togglerLoader(false, this.dataset.parent);
          toggleResults(true, this.dataset.predictContainer);
          JSOrganizer.togglerLoader(false, this.dataset.parent);
        })
        .catch((error) => {
          if (error?.code === 20) {
            console.log(error);
            JSOrganizer.togglerLoader(false, this.dataset.parent);
            throw error;
          }
        }
      )
    }

    showCachedResults(data, cache){
      const cacheDataArr = cache;
      const cachedResults = cacheDataArr.find(results => results.searchTerm === data.searchTerm);
      const parentElement = document.querySelector(this.dataset.parent);
      JSOrganizer.renderSelectorChanges(cachedResults.contentHtml, parentElement, '[data-render-predict-results]');
      toggleResults(true, this.dataset.predictContainer);
      JSOrganizer.togglerLoader(false, this.dataset.parent);
    }
  });
}

function toggleResults(flag, selector){
  const resultsContainer = document.querySelector(selector);
  if(flag){
    resultsContainer.classList.remove('hidden');
  } else{
    resultsContainer.classList.add('hidden');
  }
  resultsContainer.innerHtml = '';
}