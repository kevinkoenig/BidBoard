using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using BidBoard.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.Azure.Storage;
using Microsoft.Azure.Storage.Blob;
using Microsoft.Extensions.Configuration;

namespace BidBoard.Areas.Identity.Pages.Account.Manage
{
    public class IndexModel : PageModel
    {
        private readonly UserManager<BidBoardUser> _userManager;
        private readonly SignInManager<BidBoardUser> _signInManager;
        private readonly IConfiguration _config;
        

        public IndexModel(UserManager<BidBoardUser> userManager, SignInManager<BidBoardUser> signInManager, IConfiguration config)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _config = config;
        }

        public string Username { get; set; } = null!;
        public string UserImageUrl { get; set; } = null!;

        [TempData] public string StatusMessage { get; set; } = null!;

        [BindProperty] public InputModel Input { get; set; } = null!;

        public class InputModel
        {
            [Phone]
            [Display(Name = "Phone number")]
            public string? PhoneNumber { get; set; }

            public string? UserImageData { get; set; }
            
            [Display(Name = "Picture")]
            public string? UserImageUrl { get; set; }
        }

        private async Task LoadAsync(BidBoardUser user)
        {
            var userName = await _userManager.GetUserNameAsync(user);
            var phoneNumber = await _userManager.GetPhoneNumberAsync(user);

            Username = userName;
            UserImageUrl = user.UserImageUrl ?? string.Empty;

            Input = new InputModel
            {
                PhoneNumber = phoneNumber,
                UserImageUrl = user.UserImageUrl
            };
        }

        public async Task<IActionResult> OnGetAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Unable to load user with ID '{_userManager.GetUserId(User)}'.");
            }

            await LoadAsync(user);
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return NotFound($"Unable to load user with ID '{_userManager.GetUserId(User)}'.");
            }

            if (!ModelState.IsValid)
            {
                await LoadAsync(user);
                return Page();
            }

            var phoneNumber = await _userManager.GetPhoneNumberAsync(user);
            if (Input.PhoneNumber != phoneNumber)
            {
                var setPhoneResult = await _userManager.SetPhoneNumberAsync(user, Input.PhoneNumber);
                if (!setPhoneResult.Succeeded)
                {
                    StatusMessage = "Unexpected error when trying to set phone number.";
                    return RedirectToPage();
                }
            }

            if (!string.IsNullOrWhiteSpace(Input.UserImageData))
            {
                var blobConnection = _config.GetValue<string>("blobstorage");
                var acct = CloudStorageAccount.Parse(blobConnection);
                var client = acct.CreateCloudBlobClient();
                var container = client.GetContainerReference("userimages");
                var permissions = new BlobContainerPermissions {PublicAccess = BlobContainerPublicAccessType.Blob};
                await container.SetPermissionsAsync(permissions);

                var filename = Guid.NewGuid().ToString();
                var blob = container.GetBlockBlobReference(filename);
                var data = Input.UserImageData.Substring(22);
                var bytes = Convert.FromBase64String(data); 
                await blob.UploadFromByteArrayAsync(bytes, 0, bytes.Length);
                user.UserImageUrl = "https://bidboard.blob.core.windows.net/userimages/" + filename;
            }

            await _userManager.UpdateAsync(user);
            await _signInManager.RefreshSignInAsync(user);
            StatusMessage = "Your profile has been updated";
            return RedirectToPage();
        }
    }
}
