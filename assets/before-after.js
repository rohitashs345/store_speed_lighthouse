if (!customElements.get('before-after')) {
  customElements.define('before-after', class BeforeAfter extends HTMLElement {
    constructor() {
      super();

      this.pointer = this.querySelector('input');
    }

    connectedCallback(){
      if(!this.pointer) return;
      this.initialize();
    }

    initialize(){
      this.setListners();
    }

    setListners(){
      this.comparison = this.onComparison.bind(this);
      this.pointer.addEventListener('input', this.comparison);
    }

    onComparison(event){
      this.style.setProperty('--after-placement', `${event.target.value}%`);
    }
  });
}