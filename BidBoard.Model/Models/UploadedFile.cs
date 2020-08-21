namespace BidBoard.Models
{
    public class UploadedFile
    {
        public int Id { get; set; }

        public int? ParentId { get; set; }
        public string ParentModule { get; set; } = null!;
        public string OriginalFileName { get; set; } = null!;
        public string MimeType { get; set; } = null!;
        public int FileSize { get; set; }
        public string DestinationFileName { get; set; } = null!;
    }
}
