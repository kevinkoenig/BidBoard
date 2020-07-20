using Microsoft.AspNetCore.Mvc;

namespace BidBoard.Controllers
{
    public class Projects : Controller
    {
        // GET
        public IActionResult Index()
        {
            return View();
        }
    }
}