using BidBoard.Models;
using System.Collections.Generic;

namespace BidBoard.ViewModels
{
    public class AttachmentViewModel
    {
        public string? Name { get; set; }  // the selector to get to the file control
        public string? ParentModule { get; set; }
        public int ParentId { get; set; }
        public IEnumerable<UploadedFile>? AttachedFiles { get; set; }
    }
}
