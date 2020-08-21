// add a : pseudo operator that does case insensitive property matching
jQuery.expr[":"].icontains = jQuery.expr.createPseudo(function (arg) {
    return function (elem) {
        return jQuery(elem).text().toUpperCase().indexOf(arg.toUpperCase()) >= 0;
    };
});

// kendo ui custom binders
kendo.data.binders.colspan = kendo.data.Binder.extend({
    refresh: function () {
        var value = this.bindings["colspan"].get();
        if (value) {
            $(this.element).attr("colspan", value);
        }
    }
});

kendo.data.binders.title = kendo.data.Binder.extend({
    refresh: function () {
        var value = this.bindings["title"].get();
        if (value) {
            $(this.element).attr("title", value);
        }
    }
});

kendo.data.binders.widget.max = kendo.data.Binder.extend({
    init: function (widget, bindings, options) {
        // Call the base constructor.
        kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options);
    },
    refresh: function () {
        var that = this,
            value = that.bindings["max"].get(); // Get the value from the View-Model.

        $(that.element).data("kendoNumericTextBox").max(value); // Update the widget.
    }
});


// Implement custom binder for the 'visible' configuration option
kendo.data.binders.widget.dialogOpen = kendo.data.Binder.extend({
    init: function (widget, bindings, options) {
        kendo.data.Binder.fn.init.call(this, widget.element[0], bindings, options);
    },
    refresh: function () {
        var that = this;
        var value = that.bindings["dialogOpen"].get();
        var dialog = $(that.element).data("kendoWindow");
        
        if (value) {
            dialog.center().open();
        } else {
            dialog.close();
        }
    }
});

var CircularQueue = function (n) {
    // variables
    this.ctrPush = 0;
    this.ctrPop = 0;
    this.buf = new Array(n);
    this.arrSize = n;

    this.setData = function (data) {
        this.ctrPush = data.ctrPush;
        this.ctrPop = data.ctrPop;
        this.buf = data.buf;
        this.arrSize = data.arrSize;
    };

    this.enqueue = function (v) {
        this.buf[this.ctrPush % this.arrSize] = v;
        this.ctrPush++;
    };

    this.dequeue = function () {
        if (this.ctrPush === this.ctrPop)
            return "/";

        this.ctrPush--;
        var tmp = this.buf[this.ctrPush % this.arrSize];
        this.buf[this.ctrPush % this.arrSize] = null;
        return tmp;
    };

    this.peek = function () {
        if (this.ctrPush === this.ctrPop)
            return "/";
        return this.buf[(this.ctrPush - 1) % this.arrSize];
    };
};

var Toolbar = function () {
    var
        _callback,

        // update the selection route parameter with the id that is returned from the
        // callback
        processUrl = function (aLink, id) {
            var url = aLink.attr("href");
            var parts = window.url.parse(url);
            if (parts && parts.get) {
                parts.get.selection = id;
                aLink.attr("href", window.url.build(parts));
            }
        },
        // add a callback handler to provide the id for a toolbar button that requires
        // an id prior to sending to the server
        setCallback = function (callback) {
            _callback = callback;
        };

    // set up the click handler on all of the buttons on the toolbar.
    // right now it only processes bootstrap dropdown-items, in the future
    // we may do more.
    var toolbar = $(".btn-toolbar");
    if (toolbar.length) {
        toolbar.on("click", "a.dropdown-item", function (e) {
            if (_callback) {
                var id = _callback();
                if (id) {
                    window.toolbar.processUrl($(e.currentTarget), id);
                } else {
                    var needsSelection = $(e.currentTarget).data("selection");
                    if (needsSelection === "True") {
                        window.toastr.error("Please select an item");
                        e.preventDefault();
                    }
                }
            }
        });
    }

    return {
        processUrl: processUrl,
        setCallback: setCallback
    };
};



$(document).ready(function () {
    var
        backPressed = function () {
            // remove the last entry from the navigation stack.
            window.navStack.dequeue();
            // persist that the last operation was back so the referrer doesn't get added to the navstack on the next page load
            // this stops back to back circular references.
            sessionStorage.setItem("last-operation", "back");
            // persist the navigation stack for the next request
            sessionStorage.setItem("navigation-stack", JSON.stringify(navStack));
        },

        processNavStack = function () {
            // create the navStack, retrieve the serialized navStack from session storage, and initialize the data.
            window.navStack = new CircularQueue(myapp_config.navStackSize);
            var navStackJson = sessionStorage.getItem("navigation-stack");
            if (navStackJson) {
                window.navStack.setData(JSON.parse(navStackJson));
            }

            // save the stack for the next request.  Don't store login, and if the last operation was a back button press
            // then Don't store it in the navigation stack (stop circular backs)
            if (!document.referrer.includes("login") && sessionStorage.getItem("last-operation") !== "back") {
                window.navStack.enqueue(document.referrer);
                sessionStorage.setItem("navigation-stack", JSON.stringify(navStack));
            }

            // set a global variable to null.  If a back button is pressed it is set to back to help the if statement
            // above
            sessionStorage.setItem("last-operation", "null");

            // this is a hack so i don't have to update every page in the system that has a back button.  What it does is search for
            // a-links that have the text "Back" in them and pre-processes the back button link prior to redirecting the window.

            // handle details pages that have a back button.  It also handles delete pages.
            $("#page-content")
                .find("a:contains('Back')")
                .attr("href", window.navStack.peek())
                .on("click", backPressed);

            // toolbar buttons with the text Back.
            $(".q2c-button:contains('Back') > a")
                .attr("href", window.navStack.peek())
                .on("click", backPressed);
        };

    // noinspection JSUnusedGlobalSymbols
    var configSectionViewModel = window.kendo.observable({
        useLegacyQuoteScreen: $("#use-legacy-quote-screen").val() === "True",
        selectedUser: "",
        onImpersonateUserChanged: function (e) {
            $.ajax({
                type: "post",
                url: "/Utility/ImpersonateUser/" + configSectionViewModel.get("selectedUser")
            })
                .done(() => window.toastr.success("impersonating user"))
                .fail(() => window.toastr.error("could not impersonate user"));  
        },
        onLegacyChanged: function (e) {
            $.ajax({
                type: "post",
                url: "/Utility/SaveUserSettings",
                data: {
                    settings: [
                        { key: "useLegacyQuoteScreen", value: e.checked }
                    ]
                }
            })
                .done(function () {
                    window.toastr.success("settings saved successfully");
                })
                .fail(function () {
                    window.toastr.error("settings not saved");
                });
        }
    });

    window.kendo.bind($(".settings-panel"), configSectionViewModel);

    // fix issues with k-switch and resizing content.
    $(".k-switch > input.dont-resize")
        .parent()
        .attr("style", "font-size: .7rem !important; margin-top: 0;");

    // add loading images to system on ajax
    var loading = $("<div id=\"loading-image\" style=\"position:absolute;top:50%;left:50%;z-index:5000\"><img width=\"48\" alt=\"loading\" src=\"/images/ajax-loader.gif\"/></div>");
    $(document).bind("ajaxSend",
        function () {
            $("html").append(loading);
        });
    $(document).bind("ajaxComplete",
        function () {
            $("#loading-image").remove();
        });

    window.toolbar = new Toolbar();

    processNavStack();

    // if the view has an error from the server then display it
    var message = $("#Message");
    if (message.length) {
        var messageVal = message.val();
        if (messageVal !== "") {
            var error = $("#Error").val() === "True";
            if (error) {
                window.toastr.error(messageVal);
            } else {
                window.toastr.success(messageVal);
            }
        }
    }

    // force an async resize
    setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 1);
});

