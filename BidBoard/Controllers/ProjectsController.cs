using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using BidBoard.Models;
using BidBoard.Utility;
using Microsoft.AspNetCore.Mvc;

namespace BidBoard.Controllers
{
    public class ProjectsController : Controller
    {
        private readonly IOpportunitiesRepository _opportunities;
        
        public ProjectsController(IOpportunitiesRepository opportunities)
        {
            _opportunities = opportunities;
        }
        
        // GET
        public IActionResult Index()
        {
            return View();
        }

        public string CamelCaseToSpacedString(string input)
        {
            return Regex.Replace(input, "(\\B[A-Z])", " $1");
        }

        public class EnumDef
        {
            public string Text { get; set; }
            public int Value { get; set; }

            public EnumDef(string text, int value)
            {
                Text = text;
                Value = value;
            }
        }
        
        public IActionResult GetTypeFilters()
        {
            var enums = new List<EnumDef>();
            var projectTypes = Enum.GetValues(typeof(ProjectType));
            foreach (var projectTypeVal in projectTypes)
            {
                var projectType = (ProjectType) (projectTypeVal ?? ProjectType.Unknown);
                enums.Add(new EnumDef(CamelCaseToSpacedString(projectType.ToString()), (int) (projectTypeVal ?? ProjectType.Unknown)));
            }

            return Json(enums);
        }
        
        public async Task<IActionResult> GetOpportunities()
        {
            return Json(await _opportunities.GetOpportunitiesAsync(User.GetUserId()));
        }

        public async Task<IActionResult> SetLiked(int id, bool liked)
        {
            return Json(await _opportunities.SetLiked(id, liked, User.GetUserId()));
        }

        public async Task<IActionResult> SetStars(int id, int stars)
        {
            return Json(await _opportunities.SetStarsAsync(id, stars, User.GetUserId()));
        }
    }
}