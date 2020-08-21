using System.Collections.Generic;
using BidBoard.Utility;
using Microsoft.AspNetCore.Mvc;

namespace BidBoard.Controllers
{
    [ApiController]
    [Route("/api/[controller]")]
    public class FipsCodes : Controller
    {
        private readonly IFipsCodeHelper _fips;
        public FipsCodes(IFipsCodeHelper fips)
        {
            _fips = fips;
        }
        
        public List<FipsCode> Get()
        {
            return _fips.GetFipsCodes();
        }
    }
}