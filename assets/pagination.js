if (!customElements.get('grid-load-more')) {
  customElements.define('grid-load-more', class GridLoadMore extends HTMLElement {
    constructor() {
      super();
      this.button = this.querySelector('button');
      this.loader = this.querySelector('[data-loader]');
    }

    connectedCallback(){
      if(!this.button) return;
      this.initialize();
    }

    initialize(){
      if(this.dataset.infinite === 'true') this.requested = false;
      this.setListeners();
    }

    setListeners(){
      this.loadMore = this.onLoadMore.bind(this);
      this.button.addEventListener('click', this.loadMore);
      if(this.dataset.infinite === 'true') window.addEventListener('scroll', this.loadInfinite.bind(this));
    }

    loadInfinite(){
      const handleObserver = (entries, observer) => {
        observer.unobserve(this);
        entries.forEach(entry => {
          if(entry.isIntersecting){
            if(this.requested) return;
            this.button.dispatchEvent(new Event('click'));
            this.requested = true;
          } else{
            this.requested = false;
          }
        });
      }
      new IntersectionObserver(handleObserver, {rootMargin: '0px 0px -60px 0px'}).observe(this);
    }

    onLoadMore(event){
      event.preventDefault();
      this.button.classList.add('disabled');
      this.loader.classList.remove('hidden');
      this.showButton = true;
      fetch(this.dataset.url)
        .then(response => response.text())
        .then(text => {
          let tempDiv = document.createElement('div');
          tempDiv.innerHTML = text;
          let columns = tempDiv.querySelectorAll('[data-render-columns]');
          let paginationWrapper = document.querySelector('[data-paging-loader-parent]');
          let newPagination = tempDiv.querySelector('[data-paging-loader-parent]');
          let parentNode = paginationWrapper.parentNode;
          columns.forEach(column => {
            parentNode.insertBefore(column, paginationWrapper);
            const atcBtn = column.querySelector('atc-submit-form');
            if(atcBtn) atcBtn.initialize();
            const variantChanger = column.querySelector('single-variant');
            if(variantChanger) variantChanger.initialize();
          });
          if(newPagination){
            paginationWrapper.innerHTML = newPagination.innerHTML;
          } else{
            this.showButton = false;
          }
        })
        .catch(e => {
          console.error(e);
        })
        .finally(() => {
          if(!this.showButton) return this.hideButton();
          this.button.classList.remove('disabled');
          this.loader.classList.add('hidden');
        }
      );
    }

    hideButton(){
      const parent = this.parentElement;
      parent.style.display = 'none';
    }
  });
}