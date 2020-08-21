namespace BidBoard.Models
{
    public class UserOpportunityData
    {
        public int Id { get; set; }
        public string UserId { get; set; } = null!;
        public BidBoardUser User { get; set; } = null!;
        public int? Stars { get; set; }
        public string? Comment { get; set; }
        public bool? Liked { get; set; }
        public int OpportunityId { get; set; }
        public Opportunity Opportunity { get; set; } = null!;
    }
}