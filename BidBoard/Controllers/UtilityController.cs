using BidBoard.Models;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace BidBoard.Controllers
{
    public class UtilityController : Controller
    {
        private readonly BidBoardContext _db;

        public UtilityController(BidBoardContext context)
        {
            _db = context;
        }

        [HttpPost]
        public async Task<JsonResult> GetFiles(string parentModule, int parentId)
        {
            var files = 
                await (from o in _db.UploadedFiles
                    where o.ParentId == parentId && o.ParentModule == parentModule
                    select o)
                .AsNoTracking()
                .ToListAsync()
                .ConfigureAwait(false);

            var data =
                from o in files
                let extension = System.IO.Path.GetExtension(o.OriginalFileName)
                select new
                {
                    name = System.IO.Path.GetFileNameWithoutExtension(o.OriginalFileName) + extension,
                    size = o.FileSize,
                    extension,
                    id = o.Id
                };

            return Json(data);
        }
    }
}