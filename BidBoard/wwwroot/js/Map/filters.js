var NameSpace = NameSpace || {};

NameSpace.Filters = function () {
    // noinspection JSUnusedGlobalSymbols
    let 
        viewModel = kendo.observable({
            minValue: null,
            maxValue: null,
            starFilterValue: null,
            liked: null,
            projectTypes: [],
            selectedProjectTypes: [],
            
            getFormattedFilter: function () {
                if (NameSpace.projects) {
                    let filterInfo = NameSpace.projects.getFilterInfo();
                    if (filterInfo) {
                        return `<div style="font-size:9px;">${filterInfo.filtered} opportunities</div>` 
                    }
                }
                
                return "";
            },
            
            onSliderChange: function (e) {
                let min = e.value[0] === 0 ? null: e.value[0];
                let max = e.value[1] === 90000000 ? null : e.value[1];
                viewModel.set("minValue", min);
                viewModel.set("maxValue", max);
                
                NameSpace.projects.setSizeFilter(min, max);
            },

            processLikedFilterChange: function () {
                let liked = viewModel.get("liked");
                NameSpace.projects.setLikedFilter(liked);
            },
            
            processProjectTypeFilterChange: function () {
                let selectedProjectTypes = viewModel.get("selectedProjectTypes");
                NameSpace.projects.setProjectTypeFilter(selectedProjectTypes);
            },

            setStarFilterValue: function (e) {
                let stars = $(e.currentTarget).children().index(e.target) + 1;
                viewModel.set("starFilterValue", stars);
                NameSpace.projects.setStarFilter(stars);
            },
            
            getStarsHtml: function () {
                let html = "";
                let stars = viewModel.get("starFilterValue");
                if (stars == null)
                    stars = 0;
                
                for (let i = 0; i < stars; i++) {
                    html += '<i name="star" class="fas fa-star ml-1"></i>';
                }
                for (let i = stars; i < 5; i++) {
                    html += '<i name="star" class="far fa-star ml-1"></i>';
                }
                return html;
            },

            onSliderSlide: function (e) {
                // viewModel.set("minValue", e.value[0] === 0 ? null: e.value[0]);
                // viewModel.set("maxValue", e.value[1] === 90000000 ? null : e.value[1]);
            },
            clearAllFilters: function (e) {
                // dont do standard filter button processing
                e.stopPropagation();
                e.preventDefault();
                viewModel.set("starFilterValue", null);
                viewModel.set("selectedProjectTypes", []);
                viewModel.set("minValue", null);
                viewModel.set("maxValue", null);
                viewModel.set("liked", null);
                let rangeSlider = $("#size-range-slider").data("kendoMyRangeSlider");
                if (rangeSlider) {
                    rangeSlider.values(0, 90000000);
                }
                if (NameSpace.projects) {
                    NameSpace.projects.clearAllFilters();
                }
                if (NameSpace.mapObject) {
                    NameSpace.mapObject.removeAllMarkers();
                }

                $("#map-search").val("");
            }
        });
    
    kendo.bind($("#filter-buttons"), viewModel);
    viewModel.bind("change", function (e) {
        switch (e.field) {
            case "minValue":
            case "maxValue":
                NameSpace.projects.setSizeFilter(viewModel.get("minValue"), viewModel.get("maxValue"));
                break;
        }
    });
    
    $.get("/Projects/GetTypeFilters", (data) => viewModel.set("projectTypes", data));

    $(".filter-buttons-container").on("click", ".filter-button", function (e) {
        let $target = $(e.currentTarget);
        if ($target.length) {
            let $popover = $target.parent().find("div.qq-popover");
            let isVisible = $popover.hasClass("popover-visible");

            $(".filter-buttons-container").find(".qq-popover").removeClass("popover-visible");

            $(".filter-button-open").removeClass("filter-button-open");
            
            if (isVisible) { 
                $popover.removeClass("popover-visible");
            } else { 
                $popover.addClass("popover-visible");
                $target.addClass("filter-button-open");
            }
        }
    });

    // close popover on next mouse click.  I stole this from internet and dont really understand it.  NOT GOOD!!!
    $("html").on("mouseup", function (e) {
        let $target = $(e.target);
        if ($target.hasClass("filter-button"))
            return;
        
        if (!$target.hasClass("popover-visible")) {
            if ($target.parents(".qq-popover-content").length === 0) {
                $(".popover-visible").removeClass("popover-visible");
                $(".filter-button-open").removeClass("filter-button-open");
            }
        }
    });
    
    return {
        getProjectTypeFilters: () => viewModel.get("projectTypes"),
        getFormattedFilter: viewModel.getFormattedFilter
    }
};