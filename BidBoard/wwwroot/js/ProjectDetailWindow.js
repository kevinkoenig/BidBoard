window.ProjectDetailWindow = function () {
    let viewModel = kendo.observable({
        selectedProject: null,
        detailWindowVisible: false,
        isNotLiked: () => !viewModel.get("selectedProject.liked"),
        processSaveClick: function (e) {
            let selectedOpportunity = viewModel.get("selectedProject");
            if (selectedOpportunity) {
                selectedOpportunity.set("liked", ! selectedOpportunity.get("liked"));
                $.post("/projects/setLiked", {id: selectedOpportunity.id, liked: selectedOpportunity.get("liked")})
                    .then(() => window.toastr.success("Opportunity saved"));
            }
        },
        getProjectAddress: () => viewModel.get("selectedProject.address1") + ", " + viewModel.get("selectedProject.stateProvince") + ", " + viewModel.get("selectedProject.zipCode"),
        setProject: function (project) {
            viewModel.set("selectedProject", project);
        },
        open: function () {
            viewModel.set("detailWindowVisible", true);
        },
        closeDetailWindow: function () {
            viewModel.set("detailWindowVisible", false);
        }
    });
    
    kendo.bind($("#project-details-window-wrapper"), viewModel);
    
    return {
        setProject: viewModel.setProject,
        open: viewModel.open
    }
};