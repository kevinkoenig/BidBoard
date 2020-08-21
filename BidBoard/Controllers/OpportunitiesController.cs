using System.Threading.Tasks;
using BidBoard.Utility;
using Kendo.Mvc.UI;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BidBoard.Controllers
{
    [ApiController]
    [Route("/api/[controller]")]
    [AllowAnonymous]
    public class OpportunitiesController : Controller
    {
        private readonly IOpportunitiesRepository _opportunities;
        
        public OpportunitiesController(IOpportunitiesRepository opportunities)
        {
            _opportunities = opportunities;
        }
        
        public async Task<DataSourceResult> Get([DataSourceRequest]DataSourceRequest request)
        {
            return await _opportunities.GetOpportunitiesResultAsync(request, User.GetUserId());
        }
    }
}