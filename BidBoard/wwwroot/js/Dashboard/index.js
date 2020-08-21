$(document).ready(function () {
    let projectDetailsWindow = new window.ProjectDetailWindow();
    $("#tile-layout").kendoTileLayout({
        containers: [{
            colSpan: 3,
            rowSpan: 2,
            header: {
                text: "Opportunities By Type"
            },
            bodyTemplate: kendo.template($("#opportunities-by-type-template").html())
        }, {
            colSpan: 2,
            rowSpan: 2,
            header: {
                text: "My Saved Opportunities"
            },
            bodyTemplate: kendo.template($("#my-saved-opportunities-template").html())
        }, {
            colSpan: 1,
            rowSpan: 1,
            header: {
                text: "Opportunities Won"
            },
            bodyTemplate: kendo.template($("#conversion-rate").html())
        }, {
            colSpan: 1,
            rowSpan: 1,
            header: {
                text: "Active Opportunities"
            },
            bodyTemplate: kendo.template($("#current").html())
        }, {
            colSpan: 1,
            rowSpan: 1,
            header: {
                text: "Productivity Improvement"
            },
            bodyTemplate: kendo.template($("#bounce-rate").html())
        }, {
            colSpan: 2,
            rowSpan: 2,
            header: {
                text: "Monthly Opportunities"
            },
            bodyTemplate: kendo.template($("#upcoming-template").html())
        }],
        columns: 5,
        columnsWidth: 300,
        rowsHeight: 200,
        reorderable: true,
        resizable: true,
        resize: function (e) {
            let rowSpan = e.container.css("grid-column-end");
            let chart = e.container.find(".k-chart").data("kendoChart");
            // hide chart labels when the space is limited
            if (rowSpan === "span 1" && chart) {
                chart.options.categoryAxis.labels.visible = false;
                chart.redraw();
            }
            // show chart labels when the space is enough
            if (rowSpan !== "span 1" && chart) {
                chart.options.categoryAxis.labels.visible = true;
                chart.redraw();
            }
            kendo.resize(e.container, true);
        }
    });
    
    
    $.get("/Dashboard/MySavedOpportunities")
        .done(function (data) {
            let gridDs = new kendo.data.DataSource({
                data: data,
                schema: {
                    model: {
                        id: "id",
                        fields: {
                            value: { type: "number" },
                            solicitationDate: {type: "date"},
                            responseDate: {type: "date"},
                        }
                    }
                }
            });

            $("#my-saved-opportunities").kendoGrid({
                dataSource: gridDs,
                columns: [
                    { field: "id", hidden: true},
                    { field: "programName", title: "Name", width: 100}, 
                    { field: "projectType", title: "Type", width: 80 },
                    { field: "stars", title: "Stars", width: 40 },
                    { field: "value", title: "Value", width: 50, format: "{0:C0}"}
                ],
            });
            $("#my-saved-opportunities").on("dblclick", "tr", function (e) {
                let project = gridDs.getByUid($(e.currentTarget).data("uid"));
                projectDetailsWindow.setProject(project);
                projectDetailsWindow.open();
            });
            
        })
        .fail(() => window.toastr.error("could not retrieve my saved opportunities"));
    
    $.get("/Dashboard/GetOpportunitiesCount")
        .done(function (data) {
            $("#current-count").text(kendo.toString(data.opportunityCount, "n0"));
        })
        .fail(() => window.toastr.error("could not retrieve opportunity count"));
    
    $.get("/Dashboard/GetOpportunitiesByDate")
        .done(function (data) {
            data.forEach(item => item.label = item.label.month + "/" + (item.label.year - 2000));
            let options = {
                dataSource: {
                    data: data
                },
                title: {
                    visible: false
                },
                legend: {
                    visible: false,
                },
                series: [{
                    type: "column",
                    field: "value",
                    categoryField: "label",
                    name: "Count",
                }]
            };
            $("#upcoming-chart").kendoChart(options);
        })
        .fail(() => window.toastr.error('could not retrieve opportunities by date'));
    
    $.get("/Dashboard/GetOpportunitiesByType")
        .done(function (data) {
            let options = {
                dataSource: {
                    data: data.sort((a,b) => b.value-a.value )
                },
                title: {
                    visible: false
                },
                legend: {
                    visible: false,
                },
                series: [{
                    type: "bar",
                    field: "value",
                    categoryField: "label",
                    name: "Count",
                }]
            };
            $("#opportunities-by-type-chart").kendoChart(options);
        })
        .fail(() => window.toastr.error("Error getting opportunities by type"));
});