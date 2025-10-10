document.addEventListener("DOMContentLoaded", function () {
    // 记录折叠状态
    let accordionState = {};

    function saveAccordionState() {
        document.querySelectorAll('.js-accordion-item').forEach((item, index) => {
            accordionState[index] = item.classList.contains('active');
        });
    }

    function loading() {
        document.querySelectorAll('.js-accordion-item').forEach((item, index) => {
            const content = item.querySelector('.accordion-content');
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0';
            }
        });

    }

    function restoreAccordionState() {
        document.querySelectorAll('.js-accordion-item').forEach((item, index) => {
            const content = item.querySelector('.accordion-content');
            if (accordionState[index]) {
                item.classList.add('active');
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                item.classList.remove('active');
                content.style.maxHeight = '0';
            }
        });
    }


    function showDiscountError(type) {
        const rootError = document.querySelector('.js-cart-discount-error');
        const codeError = document.querySelector('.js-cart-discount-error-code');

        if (!rootError) return;

        rootError.classList.remove('hidden');

        if (type === 'discount_code') {
            codeError?.classList.remove('hidden');
        }
    }

    // --- 提交折扣码 ---
    async function onDiscountSubmit(event) {
        const form = event.target.closest(".js-cart-discount-form");
        if (!form) return;
        event.preventDefault();

        const formData = new FormData(form);
        const discountCodeValue = formData.get("discount")?.trim();
        if (!discountCodeValue) return;

        const e = document.querySelectorAll(".js-cart-discount-form")
        e.forEach((t => {
            t.setAttribute("disabled", "disabled"), t.setAttribute("aria-busy", "true")
        })), document.dispatchEvent(new CustomEvent("theme:loading:doing", {
            bubbles: !0
        }));

        let i = [];
        document.dispatchEvent(new CustomEvent("cart:push:section.id", {
            bubbles: !0,
            detail: {
                sections: i
            }
        }));

        formData.set("sections", i.join(","));
        try {
            // 使用 Sections API 获取包含 sections 的数据
            const response = await fetch('/cart/update.js', {
                method: "POST",
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                },
                body: formData
            });

            const data = await response.text();

            // 解析响应
            let cart;
            try {
                // 尝试解析为 JSON
                const jsonData = JSON.parse(data);
                cart = jsonData;
            } catch (e) {
                // 如果不是 JSON，回退到使用 cart.js 获取数据
                cart = await fetch('/cart.js').then(res => res.json());
            }

            saveAccordionState();

            // 折扣码无效检查
            const isInvalid = cart.discount_codes.some(d => d.code === discountCodeValue && !d.applicable);
            if (isInvalid) {
                saveAccordionState();

                if (document.dispatchEvent(new CustomEvent("theme:loading:done", {
                    bubbles: !0
                })), response.ok) {
                    // 触发购物车更新事件，传递完整的 cart 数据
                    document.dispatchEvent(
                        new CustomEvent("cart:change", {
                            bubbles: true,
                            detail: {
                                baseEvent: "discount:apply",
                                cart: cart,  // 完整 cart 对象
                                items: cart.items,  // 保证 CartDrawer 能找到 items
                            }
                        }))
                }
                showDiscountError('discount_code')
                restoreAccordionState()
                return;
            }



            if (document.dispatchEvent(new CustomEvent("theme:loading:done", {
                bubbles: !0
            })), response.ok) {
                // 触发购物车更新事件，传递完整的 cart 数据
                document.dispatchEvent(
                    new CustomEvent("cart:change", {
                        bubbles: true,
                        detail: {
                            baseEvent: "discount:apply",
                            cart: cart,  // 完整 cart 对象
                            items: cart.items,  // 保证 CartDrawer 能找到 items
                        }
                    }))
                restoreAccordionState()
            }

        } catch (err) {
            console.error("折扣码提交失败:", err);
        }
    }

    // --- 初始化事件 ---
    if (window.__discount_submit_handler_registered) return;
    window.__discount_submit_handler_registered = true;

    function handleDiscountSubmit(event) {
        // submit 事件冒泡到 document 时，event.target 是提交的 form
        const form = event.target.closest('.js-cart-discount-form');
        if (!form) return; // 不是我们关心的表单，放行

        // 取表单内的输入元素（优先使用表单内的 .discount-input）
        const inputEl = form.querySelector('.discount-input');
        const code = inputEl?.value?.trim() ?? '';

        if (!code) {
            // 空或只有空格 -> 阻止默认提交（不会刷新）
            event.preventDefault();
            // 可选：显示错误/聚焦
            inputEl?.focus();
            // optional: show user hint
            // showYourEmptyHint(); 
            console.log('阻止提交：折扣码为空或仅空格');
            return;
        }

        // 有有效内容 -> 阻止默认行为，交由你的异步处理函数处理
        event.preventDefault();
        // 调用已有逻辑（确保 onDiscountSubmit 在全局或可访问）
        try {
            onDiscountSubmit(event); // 你的完整处理函数
        } catch (err) {
            console.error('调用 onDiscountSubmit 失败', err);
        }
    }

    document.addEventListener('submit', handleDiscountSubmit);


    function updateDiscountPills() {
        fetch('/cart.js')
            .then(res => res.json())
            .then(cart => {
                const pillsContainer = document.querySelector('.js-cart-discount-pills');
                if (!pillsContainer) return;

                // 当前显示的折扣码
                const currentCodes = [...pillsContainer.querySelectorAll('.discount-pill')].map(el => el.textContent);
                // 最新折扣码（排序后）
                const newCodes = cart.discount_codes.filter(d => d.applicable).map(d => d.code).sort();

                // 比较当前和最新折扣码是否相同
                const sortedCurrent = [...currentCodes].sort();
                const isSame = sortedCurrent.length === newCodes.length &&
                    sortedCurrent.every((c, i) => c === newCodes[i]);

                if (isSame) return; // 没变化就不更新

                // 清空并渲染新的折扣码
                pillsContainer.replaceChildren(...newCodes.map(code => {
                    const el = document.createElement('span');
                    el.className = 'discount-pill';
                    el.textContent = code;

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'discount-pill-remove';
                    removeBtn.textContent = '×';
                    removeBtn.addEventListener('click', async () => {
                        try {
                            // 获取当前折扣码列表
                            const formData = new FormData();
                            formData.append("discount", "")
                            const e = document.querySelectorAll(".js-cart-discount-form")
                            e.forEach((t => {
                                t.setAttribute("disabled", "disabled"), t.setAttribute("aria-busy", "true")
                            })), document.dispatchEvent(new CustomEvent("theme:loading:doing", {
                                bubbles: !0
                            }));

                            let i = [];
                            document.dispatchEvent(new CustomEvent("cart:push:section.id", {
                                bubbles: !0,
                                detail: {
                                    sections: i
                                }
                            }));

                            formData.set("sections", i.join(","));

                            // 更新购物车折扣码
                            const response = await fetch('/cart/update.js', {
                                method: 'POST',
                                headers: {
                                    "X-Requested-With": "XMLHttpRequest"
                                },
                                body: formData
                            });
                            const data = await response.text();
                            console.log('Sections API response:', data);

                            // 解析响应
                            let newcart;
                            try {
                                // 尝试解析为 JSON
                                const jsonData = JSON.parse(data);
                                newcart = jsonData;
                            } catch (e) {
                                // 如果不是 JSON，回退到使用 cart.js 获取数据
                                newcart = await fetch('/cart.js').then(res => res.json());
                            }
                            // 刷新折扣码列表
                            if (document.dispatchEvent(new CustomEvent("theme:loading:done", {
                                bubbles: !0
                            })), response.ok) {
                                // 触发购物车更新事件，传递完整的 cart 数据
                                document.dispatchEvent(
                                    new CustomEvent("cart:change", {
                                        bubbles: true,
                                        detail: {
                                            baseEvent: "discount:apply",
                                            cart: newcart,  // 完整 cart 对象
                                            items: newcart.items,  // 保证 CartDrawer 能找到 items
                                        }
                                    }))
                                restoreAccordionState()
                            }
                        } catch (err) {
                            console.error('删除折扣码失败', err);
                        }
                    });

                    el.appendChild(removeBtn);
                    return el;
                }));

                // 可选动画：延迟加 class
                requestAnimationFrame(() => {
                    pillsContainer.querySelectorAll('.discount-pill').forEach(el => el.classList.add('loaded'));
                });

                restoreAccordionState();
                loading();
            })
            .catch(err => console.error('更新折扣码失败:', err));
    }

    // 初始化调用一次
    updateDiscountPills();

    // 每次购物车刷新后自动执行
    document.addEventListener('cart:drawer:render', function () {
        updateDiscountPills()
    });


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
});