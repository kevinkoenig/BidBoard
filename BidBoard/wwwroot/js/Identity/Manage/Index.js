$(document).ready(function() {
    let uploadCrop = null;
    
    function readFile(input) {
        if (input.files && input.files.length && input.files[0]) {
            let reader = new FileReader();

            reader.onload = function (e) {
                // $('.upload-demo').addClass('ready');
                uploadCrop.bind({url: e.target.result}); 
            }

            reader.readAsDataURL(input.files[0]);
        }
        else {
            window.toastr.error("Sorry - you're browser doesn't support the FileReader API");
        }
    }

    let opts = {
        enableExif: true,
        viewport: {
            width: 150,
            height: 150,
            type: 'circle'
        }
    }
    uploadCrop = new window.Croppie(document.getElementById('upload-demo'), opts);
    $("#upload").on("change", function (e) { 
        readFile(this);
        $("#save-image").removeClass("disabled");
    });
    
    $("#save-image").on("click", function () {
        uploadCrop.result({
            type: 'base64',
            size: 'viewport',
            format: "png", 
        }).then(function (resp) {
            $("#orig-image").attr("src", resp);
            $('#Input_UserImageData').val(resp);
        });
        
        $("#file-upload").css("display", "none");
        $("#current-image").css("display", "inline-block");
    });
    
    $("#cancel-upload").on("click", function () {
        $("#file-upload").css("display", "none");
        $("#current-image").css("display", "inline-block");
    });
    
    $("#change-image").on("click", function (e) {
        $("#file-upload").css("display", "inline-block");
        $("#current-image").css("display", "none");
    });
});    
