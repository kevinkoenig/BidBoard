using Microsoft.AspNetCore.Identity;

namespace BidBoard.Models
{
    // Add profile data for application users by adding properties to the BidBoardUser class
    public class BidBoardUser : IdentityUser
    {
        [PersonalData] 
        public string? UserImageUrl { get; set; }
    }
}
