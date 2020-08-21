using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BidBoard.Models;
using BidBoard.Utility;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BidBoard.Controllers
{
    public class DashboardController : Controller
    {
        private readonly BidBoardContext _context;
        
        public DashboardController(BidBoardContext context)
        {
            _context = context;
        }
        // GET
        public IActionResult Index()
        {
            return View();
        }

        public async Task<IActionResult> MySavedOpportunities()
        {
            var userObjectId = User.Claims.FirstOrDefault(m => m.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier");
            if (userObjectId != null)
            {
                var objectId = userObjectId.Value;
                var a = from o in _context.UserOpportunityData
                    where o.UserId == objectId && (o.Liked??false)
                    select new
                    {
                        ProjectType = o.Opportunity.ProjectType.ToString().CamelCaseToSpacedString(),
                        o.Opportunity.ProgramName,
                        o.Stars,
                        o.Opportunity.Value,
                        o.Opportunity.ResponseDate,
                        o.Opportunity.SolicitationDate,
                        o.Liked,
                        o.Comment,
                        o.Opportunity.Address1,
                        o.Opportunity.Id,
                        o.Opportunity.StateProvince,
                        o.Opportunity.ZipCode,
                        o.Opportunity.Summary
                    };
                return Json(await a.ToListAsync());
            }

            return Json(new List<object>());
        }

        public async Task<IActionResult> GetOpportunitiesByDate()
        {
            var now = DateTime.Now;
            var a = from o in _context.Opportunities
                where o.SolicitationDate != null && (o.SolicitationDate.Year == 2020) || (o.SolicitationDate.Year == 2021 && o.SolicitationDate.Month < now.Month - 1)
                group o by new { o.ResponseDate.Year, o.ResponseDate.Month }
                into p
                orderby p.Key.Year, p.Key.Month
                select new
                {
                    label = p.Key,
                    value = p.Count()
                };
            return Json(await a.ToListAsync());
        }

        public async Task<IActionResult> GetOpportunitiesCount()
        {
            return Json(new
            {
                OpportunityCount =  await _context.Opportunities.CountAsync()
            });
        }
        
        public async Task<IActionResult> GetOpportunitiesByType()
        {
            var a = from o in _context.Opportunities
                group o by o.ProjectType
                into p
                select new
                {
                    label = p.Key.ToString().CamelCaseToSpacedString(),
                    value = p.Count()
                };
            
            return Json(await a.ToListAsync());
        }
    }
}