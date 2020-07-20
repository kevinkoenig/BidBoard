window.GridSupport = function (getDataBase, operationBase, selector, columns, fields, commandInfo) {
    var gridCommandsTemplate = window.kendo.template($("#grid-commands-template").html());
    var gridCommandTemplate = window.kendo.template($("#grid-command-template").html());
    var showFilterAndGroup = true;

    var standardCommands = [
        { text: "Edit", name: "edit", iconClass: "fas fa-pencil", anchorClass: "edit-command" },
        { text: "Details", name: "details", iconClass: "fas fa-info", anchorClass: "details-command" },
        { text: "Delete", name: "delete", iconClass: "fas fa-trash", anchorClass: "delete-command" }
    ];

    var grid;
    var gridStructure = {
        dataSource: {
            transport: {
                read: "/api" + getDataBase
            },
            schema: {
                model: {
                }
            }
        },
        toolbar: ["search"],
        groupable: true,
        sortable: true,
        reorderable: true,
        resizable: true,
        selectable: true,
        scrollable: {
            virtual: true
        }
    };

    var
        // called when a filter is entered by user.  saves the filter data in localStorage to enable
        // persistent filtering.
        persistFilter = function (e) {
            localStorage.setItem(window.location.href + "-grid-filter",
                window.kendo.stringify({ filter: e.sender.filter() }));
        },

        processDoubleClick = function (e) {
            var editIndex = -1;
            var detailsIndex = -1;
            // find either the edit or details command
            standardCommands.forEach((command, index) => {
                if (command) {
                    if (command.name === "edit") {
                        editIndex = index;
                    } else if (command.name === "details") {
                        detailsIndex = index;
                    }
                }
            });
            
            // if we found the command, prefer edit over details
            if (editIndex !== -1 || detailsIndex !== -1) {
                var command = standardCommands[editIndex !== -1 ? editIndex : detailsIndex !== -1 ? detailsIndex : null];
                if (command) {
                    // perform the navigation
                    var aLink = $(e.currentTarget).find("a." + command.anchorClass);
                    if (aLink.length) {
                        window.location = aLink.attr("href");
                    }
                }
            }
        },
        // grid resizing functionality.  this code is smart and changes the
        // grid structure based on the display it is running on.  Specifically removes
        // filtering if the screen is too short.
        resizeGrid = function (newHeight) {
            var gridElement = $("#" + selector);
            gridElement.height(newHeight);

            if (newHeight < 294 && showFilterAndGroup) {
                showFilterAndGroup = false;
                grid.setOptions({
                    groupable: false,
                    filterable: false
                });
            } else if (newHeight >= 294 && !showFilterAndGroup) {
                showFilterAndGroup = true;
                grid.setOptions(
                    {
                        groupable: true,
                        filterable: {
                            mode: "row",
                            operators: {
                                string: {
                                    contains: "Contains",
                                    startswith: "Starts with"
                                }
                            }
                        }
                    });
            }

            grid.resize();
        },

        // resize the grid when the window changes size.
        performResize = function (e) {
            var oe = $("#page-content");

            var subtractHeight = 0;
            var children = oe.children();
            for (var i = 0; i < children.length; i++) {
                var child = $(children.get(i));
                if (child && child.attr("id") !== selector && ! child.is("style")) {
                    subtractHeight += child.outerHeight(true);
                }
            }

            var newHeight = e.contentHeight - subtractHeight - 2;
            resizeGrid(newHeight);
        },

        // return the id of the selected row to the toolbar so it can
        // do command processing
        getGridId = function () {
            var item = grid.select();
            if (item.length) {
                var data = grid.dataItem(item);
                return data.id;
            }

            return undefined;
        };

    // fix up the filtering and display attributes for columns of type boolean
    // fixupFiltering();  comment this for now because we want to try new filtering

    // add the columns to the grid structure and then append the command column
    if (commandInfo) {
        if (commandInfo.disableDelete) { standardCommands.splice(2, 1); }
        if (commandInfo.disableEdit) { standardCommands.splice(0, 1); }

        for (var i = 0; i < commandInfo.commands.length; i++) {
            standardCommands.push(commandInfo.commands[i]);
        }
    }

    var cmdWrapper = gridCommandsTemplate({
        lineTemplate: gridCommandTemplate,
        operationBase: operationBase,
        commands: standardCommands
    });

    // add the columns to the grid and add the command column
    gridStructure.columns = columns;
    gridStructure.columns.push({ field: "", title: "", template: cmdWrapper, filterable: false, width: 143, attributes: { "class": "cmd-cell" } });

    // now add the field definitions
    gridStructure.dataSource.schema.model.fields = fields;
    
    var gridObject = $("#" + selector);
    grid = gridObject.kendoGrid(gridStructure).data("kendoGrid");
    
    // setup for filter persisting on a change to the datasource
    grid.dataSource.bind("change", persistFilter);
    
    // look in local storage to see if this page has a filter definition set.  If so then set the grid's filter.
    // (persistent filters)  lets see if people freak out.
    var filterJson = localStorage.getItem(window.location.href + "-grid-filter");
    if (filterJson) {
        var filterObject = JSON.parse(filterJson);
        if (filterObject && filterObject.filter) {
            if (filterObject.filter.filters.length) {
                $(".k-grid-search > input").val(filterObject.filter.filters[0].value);
            }
            grid.dataSource.filter(filterObject.filter);
        }
    }

    gridObject.on("dblclick", "tr.k-state-selected", processDoubleClick);

    // set the toolbar callback so we can retrieve
    // the selected row.
    window.toolbar.setCallback(getGridId);

    $(window).on("q2c.resize.window", performResize);

    return {
        grid: grid
    };
};
