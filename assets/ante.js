document.addEventListener("DOMContentLoaded", function () {
    class HDTCode extends HTMLElement {
        connectedCallback() {
            this.CopyCode();
        }
        CopyCode() {
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

    class VIDEO extends HTMLElement {
        connectedCallback() {
            this.VideoPlay();
        }
        VideoPlay() {
            const video = this.querySelector("video");
            const btn = this.querySelector(".ante-btn");

            if (video && btn) {
                video.addEventListener("play", () => {
                    btn.style.display = "none";
                });

                video.addEventListener("pause", () => {
                    btn.style.display = "flex";
                });

                video.addEventListener("ended", () => {
                    btn.style.display = "flex";
                });
            }
        }
    }

    if (!window.customElements.get('ante-video')) {
        window.customElements.define('ante-video', VIDEO);
    }
    const videoArray = document.querySelectorAll('.hdt-slider__slide_video')
    function videoStus() {
        videoArray.forEach(el => {
            if (el.querySelector("video")) {
                el.querySelector("video").pause();
            } else if (el.querySelector("iframe") && el.querySelector("iframe").contentWindow) {
                el.querySelector("iframe").contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
                    '*'
                );
            }
        })
    }
    const observer = new MutationObserver(() => {
        videoStus();
    });

    videoArray.forEach(slide => {
        observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
    });

});