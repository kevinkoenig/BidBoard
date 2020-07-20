using AurigoQuote2Cash.Utility;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace BidBoard.Controllers
{
    [Route("api/[controller]")]
    public class AdController : Controller
    {
        private readonly IActiveDirectoryClient _client;

        public AdController(IActiveDirectoryClient client)
        {
            _client = client;
        }

        [HttpGet("GetUserImage")]
        [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None, Duration = 0)]
        public async Task<FileResult> GetUserImage()
        {
            var photoData = await _client.GetUserPictureAsync(User);
            if (photoData != null)
                return File(photoData, "image/jpeg");

            return File("/images/NoAccountPicture.jpg", "image/jpeg");
        }
    }
}
