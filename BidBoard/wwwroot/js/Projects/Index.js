$(document).ready(function () {
    const FilterName = "ProjectIndexFilterObject";
    const selectedClass = "bg-info-200";
    
    let viewModel = window.kendo.observable({
        projects: [],
        onSwitchChanged: () => {},
        filterText: "",
        
        onClick: function (e) {
            let clicked = $(e.target).parents("div.card");
            if (clicked.length) {
                clicked = $(clicked[0]);
                let hasClass = clicked.hasClass(selectedClass);
                $("#projects").find("div.card").removeClass(selectedClass);
                if (!hasClass) {
                    clicked.addClass(selectedClass);
                }
            }
        },
        
        onStarClick: function (e) {
            let item = e.data;
            let stars = $(e.currentTarget).children().index(e.target) + 1;
            item.set("stars", stars);
            item.trigger("change");
        },
        
        onDblClick: function (e) {
            
        },
        
        processOpportunities: (data) => {
            let projects = data.slice(0, 500);
            projects.forEach((project) => {
                project.responseDate = new Date(project.responseDate);
                project.solicitationDate = new Date(project.solicitationDate);
                project.stars = Math.floor(Math.random() * 6);
                project.systemScore = Math.random();
            })
            viewModel.set("projects", projects);
        }
    });
    
    let performResize = function (e) {
        let headerHeight = $("#header-row").outerHeight(true);
        $("#projects").height(e.contentHeight - headerHeight);
    },
    getFilterObject = function () {
        let filterObject = {
            currentFilter: "",
        };
        let filterJson = localStorage.getItem(FilterName);
        if (filterJson) {
            filterObject = JSON.parse(filterJson);
        }

        viewModel.set("filterText", filterObject.currentFilter);
        return filterObject;
    };


    $(window).on("beforeunload", function () {
        let filterObject = {
            currentFilter: viewModel.get("filterText")
        };
        
        localStorage.setItem(FilterName, window.kendo.stringify(filterObject));
    });
    
    let $projects = $("#projects-wrapper");
    window.kendo.bind($projects, viewModel);
    
    getFilterObject();
    window.initApp.listFilter($projects, $("#filter-projects"));
    $("#filter-projects").trigger("change");
    
    $(window).on("q2c.resize.window", performResize);
    
    $.get("/Projects/GetOpportunities")
        .done(viewModel.processOpportunities);
});