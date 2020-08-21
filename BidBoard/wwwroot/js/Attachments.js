/* eslint no-unused-vars: ["off"] */
// ReSharper disable VariableUsedInInnerScopeBeforeDeclared

var AttachmentControl = function (name) {
    var _parentModule,
        _parentId,
        _fileUploadSelector,
        _fileControl,
        _successCallback,
        _name,
        _template,

        ajaxData = {
            parentModule: 0,
            parentId: 0
        },

        _getWindow = function () {
            return $("#" + _name + "_AttachmentWindow").data("kendoWindow");
        },

        _open = function (title, parentId) {
            var window = $("#" + _name + "_AttachmentWindow").data("kendoWindow");
            window.center();
            window.open();
            window.setOptions({
                title: title
            });

            setParentId(parentId);
            refresh();
        },

        getFileList = function (callback) {
            // call back to the server to retrieve the already attached files
            $.post("/Utility/GetFiles", ajaxData)
                .then(function (fileData) {
                    callback(fileData);
                })
                .fail(function () {
                    window.toastr.error("failed to retrieve attachments");
                });
        },

        setSuccessCallback = function (f) {
            _successCallback = f;
        },

        setParentModule = function (parentModule) {
            _parentModule = parentModule;
        },

        setParentId = function (parentId) {
            _parentId = parentId;
        },

        refresh = function () {
            // set up data for callback
            ajaxData.parentModule = _parentModule;
            ajaxData.parentId = _parentId;

            // if the upload control is already created then destroy it so we can rebuild it
            // after we retrieve the existing files.  This allows us to reuse the control
            // with multiple parent items in a popup window
            if (_fileControl) {
                _fileControl.destroy();
                $("#" + name + "_fileDiv").html(window.kendo.format('<input style="display:none;" type="file" name="files" id="{0}" />', name + "_fileInput"));
            }

            getFileList(function (fileData) {
                // show the control and create a new upload control
                $(_fileUploadSelector).show();
                $(_fileUploadSelector).kendoUpload({
                    async: {
                        saveUrl: "/Upload/Upload",
                        removeUrl: "/Upload/Remove",
                        autoUpload: true
                    },
                    upload: _onUpload,
                    remove: _onRemove,
                    success: _onSuccess,
                    files: fileData,
                    template: window.kendo.template($("#" + name + "_fileTemplate").html())
                });

                _fileControl = $(_fileUploadSelector).data("kendoUpload");

                $(".k-upload").on("click", ".file-name-heading", function (e) {
                    var li = $(e.currentTarget).closest("li");
                    var d = $(li).data("files");

                    // retrieve the file to the desktop
                    if (d[0].id) {
                        window.location = "/Upload/GetDocumentById?fileId=" + d[0].id;
                    }
                });
            });
        },

        _onUpload = function (e) {
            e.data = ajaxData;
        },

        _onRemove = function (e) {
            e.data = {
                id: e.files[0].id
            };
        },

        _onSuccess = function (data) {
            for (var i = 0; i < data.response.length; i++) {
                if (i < data.files.length) {
                    data.files[i].id = data.response[i];
                }
            }
            if (_successCallback) {
                _successCallback(data);
            }
        };

    // init code
    _name = name;
    _fileUploadSelector = "#" + _name + "_fileInput";
    _fileControl = $(_fileUploadSelector).data("kendoUpload");
    _template = window.kendo.template($("#" + _name + "_attachmentHtml").html());

    // generate html using template,
    // add the html for the attachment control
    // and create the window
    var html = _template({
        name: _name
    });

    $("body").append(html);
    $("#" + _name + "_AttachmentWindow")
        .kendoWindow({
            modal: true,
            iframe: false,
            draggable: true,
            pinned: false,
            title: "Attachments",
            resizable: false,
            content: null,
            width: 800,
            height: 400,
            actions: ["Close"]
        });

    return {
        setParentModule: setParentModule,
        setParentId: setParentId,
        refresh: refresh,
        setSuccessCallback: setSuccessCallback,
        getFileList: getFileList,
        getWindow: _getWindow,
        open: _open
    };
};
