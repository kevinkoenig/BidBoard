using Microsoft.AspNetCore.Mvc;

namespace BidBoard.Controllers
{
    public class MapController : Controller
    {
        // GET
        public IActionResult Index()
        {
            return View();
        }
    }
}