/* eslint-disable camelcase */
import utils from '@bigcommerce/stencil-utils';

function _formatMoney(_amount, _decimalCount = 2, decimal = '.', thousands = ',') {
    try {
        let decimalCount = Math.abs(_decimalCount);
        decimalCount = Number.isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = _amount < 0 ? '-' : '';
        const amount = Math.abs(Number(_amount) || 0).toFixed(decimalCount);

        const i = parseInt(amount, 10).toString();
        const j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, `$1${thousands}`) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
    } catch (e) {
        return null;
    }
}

export function currencyFormat(value, {
    currency_token = '$',
    currency_location = 'left',
    decimal_token = '.',
    decimal_places = 2,
    thousands_token = ',',
} = {}) {
    const _value = _formatMoney(value, decimal_places, decimal_token, thousands_token);
    return currency_location.toLowerCase() === 'left' ? `${currency_token}${_value}` : `${_value}${currency_token}`;
}

export function extractMoney(price, defaultMoney = {
    currency_token: '$',
    currency_location: 'left',
    decimal_token: '.',
    decimal_places: 2,
    thousands_token: ',',
}) {
    const money = { ...defaultMoney };

    if (!price && price !== 0) {
        return money;
    }

    const m = String(price).trim().match(/^([^0-9]*)([0-9.,]*)([^0-9]*)$/);
    const leftSymbol = String(m[1]).trim();
    const value = String(m[2]);
    const rightSymbol = String(m[3]).trim();
    const commaPosition = value.indexOf(',');
    const commaCount = (value.match(/,/g) || []).length;
    const dotPosition = value.indexOf('.');
    const dotCount = (value.match(/\./g) || []).length;

    if (leftSymbol) {
        money.currency_token = leftSymbol;
        money.currency_location = 'left';
    } else if (rightSymbol) {
        money.currency_token = rightSymbol;
        money.currency_location = 'right';
    }

    if (commaCount.length >= 2) {
        money.thousands_token = ',';
        money.decimal_token = '.';
        money.decimal_places = dotPosition > -1 ? value.length - dotPosition - 1 : 0;
    } else if (dotCount.length >= 2) {
        money.thousands_token = '.';
        money.decimal_token = ',';
        money.decimal_places = commaPosition > -1 ? value.length - commaPosition - 1 : 0;
    } else if (commaPosition > dotPosition && dotPosition > -1) {
        money.thousands_token = '.';
        money.decimal_token = ',';
        money.decimal_places = value.length - commaPosition - 1;
    } else if (dotPosition > commaPosition && commaPosition > -1) {
        money.thousands_token = ',';
        money.decimal_token = '.';
        money.decimal_places = value.length - dotPosition - 1;
    } else if (commaPosition > -1) {
        if ((value.length - commaPosition - 1) % 3 === 0) {
            money.thousands_token = ',';
            money.decimal_token = '.';
            money.decimal_places = 0;
        } else {
            money.thousands_token = '.';
            money.decimal_token = ',';
            money.decimal_places = value.length - commaPosition - 1;
        }
    } else if (dotPosition > -1) {
        if ((value.length - dotPosition - 1) % 3 === 0) {
            money.thousands_token = '.';
            money.decimal_token = ',';
            money.decimal_places = 0;
        } else {
            money.thousands_token = ',';
            money.decimal_token = '.';
            money.decimal_places = value.length - dotPosition - 1;
        }
    } else if (commaPosition === -1 && dotPosition === -1) {
        money.decimal_places = 0;
    }

    return money;
}

export function setCookie(cname, cvalue, sec) {
    const d = new Date();
    d.setTime(d.getTime() + sec * 1000);
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${cname}=${cvalue};${expires};path=/`;
}

export function getCookie(cname) {
    const name = `${cname}=`;
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

export function loadStyle(url) {
    if (Array.from(document.getElementsByTagName('link')).filter(el => el.href === url).length > 0) {
        return;
    }
    $('<link></link>').attr({ rel: 'stylesheet', href: url }).appendTo('head');
}

export function inert($el, inertValue = true) {
    $el.siblings().not('.modal').prop('inert', inertValue);
    const $parent = $el.parent();
    if (!$parent.is('body')) {
        inert($parent, inertValue);
    }
}

// papathemes-beautify
export function openCartPreview(cartItemId) {
    const loadingClass = 'is-loading';
    const $cart = $('[data-cart-preview]');
    const $cartDropdown = $('#cart-preview-dropdown');
    const $cartLoading = $('<div class="loadingOverlay"></div>');
    const options = {
        template: 'common/cart-preview',
    };

    $cart.addClass('is-open');
    $cartDropdown
        .addClass('is-open')
        .addClass(loadingClass)
        .html($cartLoading)
        .trigger('open.toggle', [$cart]);
    $cartLoading
        .show();

    utils.api.cart.getContent(options, (err, response) => {
        $cartDropdown
            .removeClass(loadingClass)
            .html(response);
        $cartLoading
            .hide();

        // Update cart counter
        const $body = $('body');
        const $cartQuantity = $('[data-cart-quantity]', $cartDropdown);
        const quantity = $cartQuantity.data('cartQuantity') || 0;

        $body.trigger('cart-quantity-update', [quantity]);

        // Animite
        if (cartItemId) {
            const $item = $cartDropdown.find(`[data-cart-itemid="${cartItemId}"]`).first().css('opacity', 0);
            const from = $item.position();
            const width = $item.width();
            const height = $item.height();
            const $clone = $item.clone().addClass('_flying').insertAfter($item);
            $item.parent().prepend($item);
            const to = $item.position();
            $item.css('height', '0').animate({ height: `${height}px` }, 500, () => $item.css('height', ''));
            $clone.css({
                position: 'absolute',
                top: `${from.top}px`,
                left: `${from.left}px`,
                width: `${width}px`,
                height: `${height}px`,
            }).animate({ opacity: 1 }, 200, () => {
                $clone.animate({
                    top: `${to.top}px`,
                    left: `${to.left}px`,
                }, 500, () => {
                    $clone.addClass('_shadowPulse');
                    $clone.one('animationend', () => {
                        $clone.remove();
                        $item.css('opacity', 1);
                    });
                });
            });
        }
    });
}

// window.testAnimate = (cartItemId) => {
//     const $cartDropdown = $('#cart-preview-dropdown');
//     const $item = $cartDropdown.find(`[data-cart-itemid="${cartItemId}"]`).first().css('opacity', 0);
//     const from = $item.position();
//     const width = $item.width();
//     const height = $item.height();
//     const $clone = $item.clone().addClass('_flying').insertAfter($item);
//     $item.parent().prepend($item);
//     const to = $item.position();
//     $clone.css({
//         position: 'absolute',
//         top: `${from.top}px`,
//         left: `${from.left}px`,
//         width: `${width}px`,
//         height: `${height}px`,
//     }).animate({ opacity: 1 }, 200, () => {
//         $clone.animate({
//             top: `${to.top}px`,
//             left: `${to.left}px`,
//         }, 300, () => {
//             $clone.addClass('_shadowPulse');
//             $clone.one('animationend', () => {
//                 $clone.removeClass('_shadowPulse');
//                 $item.css('opacity', 1);
//             });
//         });
//     });
// }

export function flyToCart(object, fromEl = null, toEl = '[data-cart-preview]') {
    const $object = $(object);
    const $toEl = $(toEl).first();
    const $fromEl = fromEl ? $(fromEl).first() : $object.first();

    if ($toEl.length === 0) {
        return;
    }
    const $el = $object.clone()
        .appendTo('body')
        .css({
            position: 'absolute',
            top: $fromEl.offset().top,
            left: $fromEl.offset().left,
            zIndex: 10000,
            opacity: 0,
        });
    $el.animate({
        top: $toEl.offset().top + $toEl.height() / 2,
        left: $toEl.offset().left + $toEl.width() - $el.width(),
        opacity: 0.5,
    }, 500, () => {
        $el.animate({
            top: $toEl.offset().top + $toEl.height(),
            opacity: 0.2,
        }, 200, () => {
            $el.animate({
                top: $toEl.offset().top,
                opacity: 0,
            }, 100, () => {
                $el.remove();
            });
        });
    });
}

export default {};
