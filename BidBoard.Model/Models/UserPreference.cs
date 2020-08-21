namespace BidBoard.Models
{
    public class UserPreference
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? JsonValue { get; set; }
        public string UserId { get; set; } = null!;
        public BidBoardUser User { get; set; } = null!;
    }
}