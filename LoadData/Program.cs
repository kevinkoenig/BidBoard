using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using BidBoard.Models;
using OfficeOpenXml;

namespace LoadData
{
    public class SearchPredicate
    {
        public List<string>? SearchStrings { get; set; }
        public ProjectType ProjectType { get; set; }
    }

    static class Program
    {
        private static List<Opportunity> _opportunities = new List<Opportunity>();
        
        private static readonly List<SearchPredicate> Predicates = new List<SearchPredicate>   
        {
            new SearchPredicate { SearchStrings = new List<string> { "Bridge" }, ProjectType = ProjectType.Bridge },
            new SearchPredicate { SearchStrings = new List<string> { "Engineering Services", "Engineering" }, ProjectType = ProjectType.EngineeringServices },
            new SearchPredicate { SearchStrings = new List<string> { "Inspection Services", "Inspection" }, ProjectType = ProjectType.InspectionServices },
            new SearchPredicate { SearchStrings = new List<string> { "Pumping", "Drainage", "Pipeline", "Stormwater", "Oxygenation", "Sewer" }, ProjectType = ProjectType.WaterAndWasteWater },
            new SearchPredicate { SearchStrings = new List<string> { "Professional Design", "Design", "Preliminary Engineering" }, ProjectType = ProjectType.DesignServices },
            new SearchPredicate { SearchStrings = new List<string> { "Construction Management", "Management Services" }, ProjectType = ProjectType.ConstructionManagement },
            new SearchPredicate { SearchStrings = new List<string> { "Roundabout", "Construction", "road", "street", "structure" }, ProjectType = ProjectType.GeneralContracting },
            new SearchPredicate { SearchStrings = new List<string> { "Feasibility Study", "Feasibility", "study" }, ProjectType = ProjectType.FeasibilityStudy },
            new SearchPredicate { SearchStrings = new List<string> { "Easement", "Right Of Way", "Land" }, ProjectType = ProjectType.RightOfWay },
            new SearchPredicate { SearchStrings = new List<string> { "Street Scape", "streetscape", "landscape" }, ProjectType = ProjectType.LandScape },
            new SearchPredicate { SearchStrings = new List<string> { "Signal Systems", "signal" }, ProjectType = ProjectType.Rail },
            new SearchPredicate { SearchStrings = new List<string> { "Power", "Substation" }, ProjectType = ProjectType.Utility },
        };
        
        private static List<ProjectType> GetProjectType(Opportunity opportunity)
        {
            // this routine will be replaced with an AI generated categorization.
            var projectTypes = new List<ProjectType>();
            foreach (var predicate in Predicates)
            {
                if (predicate.SearchStrings == null)
                    continue;
                
                foreach (var searchString in predicate.SearchStrings)
                {
                    if (opportunity.ProgramName?.ToLower().Contains(searchString.ToLower()) ?? false)
                    {
                        projectTypes.Add(predicate.ProjectType);
                        break;
                    }

                    if (opportunity.Summary?.ToLower().Contains(searchString.ToLower()) ?? false)
                    {
                        projectTypes.Add(predicate.ProjectType);
                        break;
                    }
                }
            }
            // if we did not find anything then just say unknown.  
            if (projectTypes.Count == 0)
                projectTypes.Add(ProjectType.Unknown);
            
            return projectTypes;
        }

        private static OpportunityType GetOppType(string? value)
        {
            return value switch
            {
                "Bid Notifications" => OpportunityType.BidNotification,
                "Lead Alerts" => OpportunityType.LeadAlert,
                "SAM / Procurement Notices" => OpportunityType.ProcurementNotice,
                _ => OpportunityType.Unknown
            };
        }

        private static Market GetMarket(string? value)
        {
            return value switch
            {
                "State, Local & Ed" => Market.SateAndLocal,
                "Federal" => Market.Federal,
                _ => Market.Unknown
            };
        }
        
        private static void InitOpportunityList()
        {
            string fileName =  "d:\\BidBoard\\BidBoard\\wwwroot\\ProjectDatabase.xlsx";
            FileInfo file = new FileInfo(fileName);
            ExcelPackage.LicenseContext = LicenseContext.Commercial;
            using var wp = new ExcelPackage(file);
            var ws = wp.Workbook.Worksheets[0];
            var rand = new Random();

            if (ws.Dimension != null)
            {
                var totalRows = ws.Dimension.Rows;
                for (var nRow = 2; nRow < totalRows; nRow++)
                {
                    var project = new Opportunity
                    {
                        OpportunityType = GetOppType(ws.Cells[nRow, 2].Value.ToString()),
                        ProgramName = ws.Cells[nRow, 3].Value.ToString(),
                        Organization = ws.Cells[nRow, 6].Value.ToString(),
                        Market = GetMarket(ws.Cells[nRow, 8].Value.ToString()),
                        City = ws.Cells[nRow, 11].Value.ToString(),
                        SolicitationNumber = ws.Cells[nRow, 27].Value.ToString(),
                        Summary = ws.Cells[nRow, 30].Value.ToString(),
                        Country = ws.Cells[nRow, 15].Value.ToString(),
                        StateProvince = ws.Cells[nRow, 16].Value.ToString(),
                        Address1 = ws.Cells[nRow, 17].Value.ToString(),
                        ZipCode = ws.Cells[nRow, 18].Value.ToString()
                    };
                        
                    if (DateTime.TryParse(ws.Cells[nRow, 32].Value.ToString(), out var solicitationDate))
                        project.SolicitationDate = solicitationDate;
                    if (DateTime.TryParse(ws.Cells[nRow, 35].Value.ToString(), out var responseDate))
                        project.ResponseDate = responseDate;

                    project.Value = rand.Next(0, 90000000);
                    var value = ws.Cells[nRow, 28].Value.ToString();
                    if (!string.IsNullOrWhiteSpace(value))
                    {
                        if (decimal.TryParse(value, out var decimalValue))
                            project.Value = decimalValue * 1000;
                    }
                    
                    project.ProjectType = GetProjectType(project).ElementAt(0);
                    _opportunities.Add(project);
                }
            }
        }

        private static Market GetMarket(object toString)
        {
            throw new NotImplementedException();
        }


        private const string ConnString =
            "Data Source=tcp:bidboard.database.windows.net,1433;Initial Catalog=bidboard;User Id=kevin.koenig-a@aurigo.com@bidboard;Password=SuperDuper81898";
        static void Main()
        {
            var dbcontext = new BidBoardContext(ConnString);

            InitOpportunityList();
            dbcontext.Opportunities.AddRange(_opportunities);
            dbcontext.SaveChanges();
        }
    }
}