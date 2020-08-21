$(document).ready(function () {
    let widget = kendo.widgets.find(widget => widget.name === "kendoRangeSlider");
    const TICK_SELECTOR = '.k-tick';
    
    function removeFraction(value) {
        return value * 10000;
    }

    if (widget != null) {
        let MyRangeSlider = widget.widget.extend({
            options: {
                name: 'MyRangeSlider',
            },
            _setItemsLargeTick: function () {
                let that = this, options = that.options, items = that.wrapper.find(TICK_SELECTOR), i = 0, item, value;
                if (removeFraction(options.largeStep) % removeFraction(options.smallStep) === 0 || that._distance() / options.largeStep >= 3) {
                    if (!that._isHorizontal && !that._isRtl) {
                        items = $.makeArray(items).reverse();
                    }
                    for (i = 0; i < items.length; i++) {
                        item = $(items[i]);
                        value = that._values[i];
                        let valueWithoutFraction = Math.round(removeFraction(value - this.options.min));
                        if (valueWithoutFraction % removeFraction(options.smallStep) === 0 && valueWithoutFraction % removeFraction(options.largeStep) === 0) {
                            let val = +item.attr("title").replace(/,/g, '');
                            item.addClass('k-tick-large').html('<span style="font-size:7px" class=\'k-label\'>$' + val / 1000000 + 'M</span>');
                            if (i !== 0 && i !== items.length - 1) {
                                item.css('line-height', item[that._sizeFn]() + 'px');
                            }
                        }
                    }
                }

            }
        });
        kendo.ui.plugin(MyRangeSlider);
    }
});
