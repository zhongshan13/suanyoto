document.addEventListener("DOMContentLoaded", function () {
    class HDTCode extends HTMLElement {
        connectedCallback() {
            this.CopyCode();
        }
        CopyCode(){
            const codeOnly = this.querySelector('.ante-code-only');
            this.addEventListener('click', () => {
                if (codeOnly) {
                    const codeText = codeOnly.textContent.trim();  
                    navigator.clipboard.writeText(codeText).then(() => {
                        alert('Code copied to clipboard: ' + codeText);
                    }).catch(err => {
                        console.error('Failed to copy code: ', err);
                    });
                }
            });                    
        }
    }

    if (!window.customElements.get('hdt-code')) {
        window.customElements.define('hdt-code', HDTCode);
    }
});