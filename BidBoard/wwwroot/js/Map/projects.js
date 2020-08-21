var NameSpace = NameSpace || {};

NameSpace.Projects = function () {
    const MAX_DISPLAY = 200;
    let projectDetailWindow = new window.ProjectDetailWindow();
    // noinspection JSUnusedGlobalSymbols
    let viewModel = window.kendo.observable({
        nVisible: 0,
        nFiltered: 0,
        minValue: null,
        maxValue: null,
        minStars: null,
        liked: null,
        state: null,
        zipCodes: [],
        projectTypes: [],
        selectedProject: null,
        
        projects: new window.kendo.data.DataSource({
            type: "webapi",
            pageSize: MAX_DISPLAY,
            serverPaging: true,
            serverFiltering: true,
            transport: {
                read: {
                    url: "/api/Opportunities",
                    dataType: "json",
                    type: "post"
                }
            },
            change: function (e) {
                viewModel.set("nFiltered", e.sender.total());
                viewModel.set("nVisible", Math.min(e.sender.view().length, MAX_DISPLAY));
            },
            schema: {
                data: "data",
                errors: "errors",
                total: "total",
                model: {
                    id: "id",
                    fields: {
                        value: {type: "number"},
                        projectType: {type: "number"},
                        solicitationDate: {type: "date"},
                        responseDate: {type: "date"},
                        programName: {type: "string"}
                    }
                }
            }
        }),
        
        filter: {
            logic: "and",
            filters: [
            ]
        },

        getFilterInfo: () => {
            return {
                visible: viewModel.nVisible,
                filtered: viewModel.nFiltered,
                minValue: viewModel.minValue,
                maxValue: viewModel.maxValue,
                minStars: viewModel.minStars,
                zipCodes: viewModel.zipCodes,
                liked: viewModel.liked,
                projectTypes: viewModel.projectTypes
            }
        },
        
        
        isProjectNotLiked: (e) => !e.get("liked"), 

        processProjectSaveClick: function (e) {
            e.stopPropagation();
            e.data.set("liked", ! e.data.get("liked"));
            $.post("/projects/setLiked", {id: e.data.id, liked: e.data.get("liked")})
                .then(() => window.toastr.success("Opportunity saved"));
        }, 
        
        
        
        getAiBarWidth: (e) => (e.systemScore * 80) + "%",

        onClick: function (e) {
            projectDetailWindow.setProject(e.data);
            projectDetailWindow.open();
        },
        
        onDblClick: function (e) {
        },
        
        onStarClick: function (e) {
            e.stopPropagation();
            let stars = $(e.currentTarget).children().index(e.target) + 1;
            e.data.set("stars", stars);
            $.post("/projects/setStars", {id: e.data.id, stars: stars})
                .then(() => window.toastr.success("stars saved"));
        },
        
        getStarsHtml: function (e) {
            let html = "";
            let stars = e.get("stars");
            for (let i = 0; i < stars; i++) {
                html += '<i name="star" class="fas fa-star ml-1"></i>';
            }
            for (let i = stars; i < 5; i++) {
                html += '<i name="star" class="far fa-star ml-1"></i>';
            }
            return html;
        },
        
        // filtering logic
        processFilter: async function () {
            let minValue = viewModel.get("minValue");
            let maxValue = viewModel.get("maxValue");
            let minStars = viewModel.get("minStars");
            let projectTypes = viewModel.get("projectTypes");
            let zipCodes = viewModel.get("zipCodes");
            let liked = viewModel.get("liked");
            let state = viewModel.get("state");
            
            let filter = {logic: "and", filters: []};

            if (minValue != null) filter.filters.push({field: "value", operator: "ge", value: minValue});
            if (maxValue != null) filter.filters.push({field: "value", operator: "le", value: maxValue});
            if (minStars != null) filter.filters.push({field: "stars", operator: "ge", value: minStars});
            if (liked != null) filter.filters.push({field: "liked", operator: "eq", value: liked});
            if (state != null) filter.filters.push({field: "stateProvince", operator: "eq", value: state});

            if (zipCodes.length) {
                let zFilter = {
                    logic: "or",
                    filters: []
                }
                zipCodes.forEach(zipCode => {
                    zFilter.filters.push({field: "zipCode", operator: "eq", value: zipCode});
                });
                filter.filters.push(zFilter)
            } 
            
            if (projectTypes.length) {
                let ptFilter = {
                    logic: "or",
                    filters: []
                }
                projectTypes.forEach((item) => {
                    ptFilter.filters.push({ field: "projectType", operator: "eq", value: item });
                });
                filter.filters.push(ptFilter)
            }
            
            let projectsDs = viewModel.get("projects");
            projectsDs.filter(filter);
        },
        setStarFilter: async function (minStars) {
            viewModel.set("minStars", minStars);
            await viewModel.processFilter();
        },
        setSizeFilter: async function (minValue, maxValue) {
            viewModel.set("minValue", minValue);
            viewModel.set("maxValue", maxValue);
            await viewModel.processFilter();
        },
        setProjectTypeFilter: async function (projectTypes) {
            viewModel.set("projectTypes", projectTypes);
            await viewModel.processFilter();
        },
        setZipCodesFilter: async function (zipCodes) {
            viewModel.set("zipCodes", zipCodes);
            await viewModel.processFilter();
        },
        setStateFilter: async function (state) {
            viewModel.set("state", state);
            await viewModel.processFilter();
        },
        setLikedFilter: async function (liked) {
            viewModel.set("liked", liked);
            await viewModel.processFilter();
        },
        clearAllFilters: async function () {
            viewModel.set("minStars", null);
            viewModel.set("minValue", null);
            viewModel.set("maxValue", null);
            viewModel.set("liked", null);
            viewModel.set("state", null);
            viewModel.set("projectTypes", []);
            viewModel.set("zipCodes", []);
            await viewModel.processFilter();
        }
    });
    
    let resize = function (contentHeight) {
        let headerHeight = $("#projects-header").outerHeight(true);
        let pagerHeight = $("#pager").outerHeight(true);
        
        $("#projects-scroll").height(contentHeight - (headerHeight + pagerHeight));
    };

    window.kendo.bind($("#project-list"), viewModel);
    
    $("#pager").kendoPager({
        dataSource: viewModel.get("projects"),
        responsive: true,
    });
    
    return {
        setSizeFilter: viewModel.setSizeFilter,
        setStarFilter: viewModel.setStarFilter,
        setProjectTypeFilter: viewModel.setProjectTypeFilter,
        setZipCodesFilter: viewModel.setZipCodesFilter,
        setLikedFilter: viewModel.setLikedFilter,
        setStateFilter: viewModel.setStateFilter,
        clearAllFilters: viewModel.clearAllFilters,
        getFilterInfo: viewModel.getFilterInfo,
        resize: resize
    }
};
