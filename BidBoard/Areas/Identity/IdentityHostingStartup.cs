using Microsoft.AspNetCore.Hosting;

[assembly: HostingStartup(typeof(BidBoard.Areas.Identity.IdentityHostingStartup))]
namespace BidBoard.Areas.Identity
{
    public class IdentityHostingStartup : IHostingStartup
    {
        public void Configure(IWebHostBuilder builder)
        {
            builder.ConfigureServices((context, services) => {
            });
        }
    }
}