// q2cPercent control in the style of kendo.  I hated their numeric control.
(function ($) {
    var ui = kendo.ui;
    var Widget = ui.Widget;
    const period = 190;
    const upArrow = 38;
    const downArrow = 40;
    const change = "change";
    const spin = "spin";
    var keys = [186,187,188,189,191,192,219,220,221,222];

    var Q2cPercent = Widget.extend({
        init: function (element, options) {
            Widget.fn.init.call(this, element, options);
            
            this._changeHandler = $.proxy(this._change, this);
            this._keyupHandler = $.proxy(this._processKeyUp, this);
            this._keydownHandler = $.proxy(this._processKeyDown, this)
            this.element.on("change", this._changeHandler);
            this.element.on("keyup", this._keyupHandler);
            this.element.on("keydown", this._keydownHandler);

            this.element.wrap('<div class="input-group input-group-sm" style="width:100%;"></div>')
                .addClass("q2c-percent")
                .parent()
                .append('<div class="input-group-append"><span style="padding-right: .6rem; padding-left: .6rem;" class="input-group-text">%</span></div>');
            
            var val = this.element.val();
            if (val && val.length) {
                this.value(val);
            }
        },
        options: {
            name: "Q2cPercent",
            decimals: 2,
            step: 0.1,
        },
        events: [
            change,
            spin
        ],
        _change: function () {
            this.value(this.element.val()/100);
            this.trigger(change);
        },
        enable: function (enabled) {
            this.element.prop("disabled", !enabled);
        },
        value: function (value) {
            if (typeof value !== "undefined") {
                this.element.val((+value * 100).toFixed(this.options.decimals));
            } else {
                return +this.element.val() / 100;
            }
        },
        _step: function (direction) {
            var factor = 10 * ((this.options.decimals - 1) * 10);
            var textVal = this.element.val();
            var numVal = (+textVal / 100) * factor;

            numVal += ((this.options.step * factor) * direction) / factor;  
            if (numVal > 100)
                numVal = 100;
            if (numVal < 0)
                numVal = 0;
            this.value(numVal / 100);
            this.trigger(change)
        },
        _ignoreKey: function (key) {
            for (var i = 0; i < keys.length; i++)
                if (keys[i] === key)
                    return true;
            return false;
        },
        _hasPeriod: (value) => value.indexOf(".") >= 0,
        _processKeyUp: function (e) {
            var bModified = false;
            var textVal = this.element.val();
            if (this._hasPeriod(textVal)) {
                var parts = textVal.split(".");
                if (parts.length === 2) {
                    if (parts[1].length > this.options.decimals) {
                        parts[1] = parts[1].substring(0, this.options.decimals);
                        bModified = true;
                    }
                }
                textVal = parts.join(".");
            }

            var numVal = +textVal;
            if (numVal > 100) {
                numVal = 100;
                bModified = true;
            } else if (numVal < 0) {
                numVal = 0;
                bModified = true;
            }

            if (bModified) {
                var ps = e.currentTarget.selectionStart;
                this.value((numVal / 100).toString());
                e.currentTarget.selectionStart = ps;
                e.currentTarget.selectionEnd = ps;
            }
        },
        _periodCount: function (val) {
            var nPeriods = 0;
            for (var i = 0; i < val.length; i++) {
                if (val[i] === ".") nPeriods++;
            }
            return nPeriods;
        },
        _processKeyDown: function (e) {
            if ((e.keyCode >= 65 && e.keyCode <=90) || this._ignoreKey(e.keyCode) || e.ctrlKey)  {
                e.preventDefault();
                return false;
            }
            
            if (e.keyCode === upArrow || e.keyCode === downArrow) {
                this._step(e.keyCode === upArrow ? 1 : -1);
                e.preventDefault();
                return false;
            }

            // figure out what the string will be if not prevented
            var curVal = this.element.val();
            var newChar = (e.keyCode >= 48 && e.keyCode <=57) || e.keyCode === period ? e.key : "";
            var newVal = curVal.substr(0, e.currentTarget.selectionStart) + newChar + curVal.substr(e.currentTarget.selectionEnd);
            
            if (e.keyCode === period && (this._periodCount(newVal) > 1 || this.options.decimals === 0)) {
                e.preventDefault();
                return false;
            }
        },
        destroy: function () {
            this.element.off("change", this._changeHandler);
            this.element.off("keyup", this._keyupHandler);
            this.element.off("keydown", this._keydownHandler);
        }
    });
    
    ui.plugin(Q2cPercent);
})(jQuery);

