using Microsoft.AspNetCore.Mvc;

namespace BidBoard.Controllers
{
    public class ReactProjectsController : Controller
    {
        // GET
        public IActionResult Index()
        {
            return View();
        }
    }
}