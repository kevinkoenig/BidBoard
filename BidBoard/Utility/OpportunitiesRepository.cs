using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BidBoard.Models;
using Kendo.Mvc.Extensions;
using Kendo.Mvc.UI;
using Microsoft.EntityFrameworkCore;
// ReSharper disable UnusedAutoPropertyAccessor.Global

namespace BidBoard.Utility
{
    public class OpportunityInfo : Opportunity
    {
        public int Stars { get; set; }
        public string? Comment { get; set; }
        public bool Liked { get; set; }
    }
       
    public interface IOpportunitiesRepository
    {
        Task<List<OpportunityInfo>> GetOpportunitiesAsync(string userId);
        Task<DataSourceResult> GetOpportunitiesResultAsync(DataSourceRequest request, string userId);
        Task<bool> SetStarsAsync(int id, int stars, string userId);
        Task<bool> SetCommentsAsync(int id, string comment, string userId);
        Task<bool> SetLiked(int id, bool liked, string userId);
    }

    public class SearchPredicate
    {
        public List<string>? SearchStrings { get; set; }
        public ProjectType ProjectType { get; set; }
    }
    

    
    public class OpportunitiesRepository : IOpportunitiesRepository
    {
        private readonly BidBoardContext _context;
        

        public OpportunitiesRepository(BidBoardContext context)
        {
            _context = context;
        }

        private IQueryable<OpportunityInfo> GetQuery(string userId)
        {
            return from o in _context.Opportunities
                join p in _context.UserOpportunityData on
                    o.Id equals p.OpportunityId
                    into q
                from r in q.DefaultIfEmpty()
                where r == null || r.UserId == userId
                select new OpportunityInfo
                {
                    Id = o.Id,
                    Address1 = o.Address1,
                    Address2 = o.Address2,
                    City = o.City,
                    Country = o.Country,
                    Market = o.Market,
                    Organization = o.Organization,
                    Status = o.Status,
                    Summary = o.Summary,
                    Value = o.Value,
                    OpportunityType = o.OpportunityType,
                    OrgType = o.OrgType,
                    ProgramName = o.ProgramName,
                    ProjectType = o.ProjectType,
                    ResponseDate = o.ResponseDate,
                    SolicitationDate = o.SolicitationDate,
                    SolicitationNumber = o.SolicitationNumber,
                    SolicitationYear = o.SolicitationYear,
                    StateProvince = o.StateProvince,
                    ZipCode = o.ZipCode,
                    Stars = r == null ? 0 : r.Stars ?? 0,
                    Comment = r == null ? string.Empty : r.Comment,
                    Liked = r != null && (r.Liked ?? false)
                };
        }
        
        public async Task<List<OpportunityInfo>> GetOpportunitiesAsync(string userId) => 
            await GetQuery(userId).ToListAsync();

        public async Task<DataSourceResult> GetOpportunitiesResultAsync(DataSourceRequest request, string userId) =>
            await GetQuery(userId).ToDataSourceResultAsync(request); 

        public async Task<UserOpportunityData?> GetOrAddUserOpportunityData(int id, string userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;
            var opportunity = await _context.Opportunities.FindAsync(id);
            if (opportunity == null) return null;
            
            var userDetail = await _context.UserOpportunityData.FirstOrDefaultAsync(
                m => m.OpportunityId == id && m.UserId == userId);
            if (userDetail == null)
            {
                userDetail = new UserOpportunityData
                {
                    UserId = userId,
                    OpportunityId = id
                };
                await _context.UserOpportunityData.AddAsync(userDetail);
            }

            return userDetail;
        }
        
        public async Task<bool> SetStarsAsync(int id, int stars, string userId)
        {
            var userDetail = await GetOrAddUserOpportunityData(id, userId);
            if (userDetail == null) return false;
            userDetail.Stars = stars;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetCommentsAsync(int id, string comment, string userId)
        {
            var userDetail = await GetOrAddUserOpportunityData(id, userId);
            if (userDetail == null) return false;
            userDetail.Comment = comment;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetLiked(int id, bool liked, string userId)
        {
            var userDetail = await GetOrAddUserOpportunityData(id, userId);
            if (userDetail == null) return false;
            userDetail.Liked = liked;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}