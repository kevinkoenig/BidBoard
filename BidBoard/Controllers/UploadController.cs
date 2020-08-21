using BidBoard.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Azure.Storage;
using Microsoft.Azure.Storage.Blob;
using Microsoft.Extensions.Configuration;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

namespace BidBoard.Controllers
{
    public class UploadController : Controller
    {
        readonly BidBoardContext _db;
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _hostingEnvironment;
        private readonly ILogger<UploadController> _logger;

        public UploadController(BidBoardContext context,
                                IConfiguration config,
                                IWebHostEnvironment hostingEnvironment,
                                ILogger<UploadController> logger)
        {
            _db = context;
            _config = config;
            _hostingEnvironment = hostingEnvironment;
            _logger = logger;
        }

        public async Task<ActionResult> GetDocumentById(int fileId)
        {
            var uf = await _db.UploadedFiles.SingleOrDefaultAsync(m => m.Id == fileId);
            if (uf != null)
            {
                var realFile = _hostingEnvironment.ContentRootPath + "\\" +  _config.GetValue<string>("UploadedFilesVirtualPath") + "\\" + uf.DestinationFileName;
                if (System.IO.File.Exists(realFile))
                {
                    var f = System.IO.File.OpenRead(realFile);
                    var fsr = new FileStreamResult(f, uf.MimeType);
                    string ofn = Path.GetFileName(uf.OriginalFileName);
                    fsr.FileDownloadName = ofn;
                    return fsr;
                }
            }

            return Content("Could not find file");
        }

        public async Task<ActionResult> GetDocument(string filename)
        {
            var realFile = _hostingEnvironment.ContentRootPath + "\\" + filename;
            if (System.IO.File.Exists(realFile))
            {
                var fn = Path.GetFileName(realFile);
                var uf = await _db.UploadedFiles.SingleOrDefaultAsync(m => m.DestinationFileName == fn);
                if (uf != null)
                {
                    var f = System.IO.File.OpenRead(realFile);
                    var fsr = new FileStreamResult(f, uf.MimeType);

                    string ofn = Path.GetFileName(uf.OriginalFileName);
                    fsr.FileDownloadName = ofn;
                    return (fsr);
                }
            }

            return Content("Could not find file");
        }

        [HttpPost]
        public async Task<string> Remove(int id)
        {
            var uf = await _db.UploadedFiles.FindAsync(id);
            if (uf != null)
            {
                var virtualPath =_config.GetValue<string>("UploadedFilesVirtualPath");
                var destinationFileName = _hostingEnvironment.ContentRootPath + virtualPath + "\\";
                destinationFileName += uf.DestinationFileName;

                try
                {
                    System.IO.File.Delete(destinationFileName);
                    _db.UploadedFiles.Remove(uf);
                    await _db.SaveChangesAsync().ConfigureAwait(false);
                    return "";
                }
                // ReSharper disable once EmptyGeneralCatchClause
                // Justification.  it is ok to have this fail and we will return a string to client instead of trapping
                catch (Exception ex) when (ex is DbUpdateConcurrencyException || ex is DbUpdateException)
                {
                    _logger.Log(LogLevel.Error, "Error deleting file");
                }
            }
            return "Error";
        }

        [HttpPost]
        [DisableRequestSizeLimit]
        public async Task<JsonResult> Upload(IEnumerable<IFormFile> files, int parentId, string parentModule)
        {
            if (files == null)
                throw new ArgumentNullException(nameof(files));

            var ids = new List<int?>();

            var virtualPath = _config.GetValue<string>("UploadedFilesVirtualPath");
            var destinationFileRoot = _hostingEnvironment.ContentRootPath + "\\" + virtualPath + "\\";

            foreach (var file in files)
            {
                int? id = await UploadFile(file, destinationFileRoot, parentId, parentModule).ConfigureAwait(false);
                ids.Add(id);
            }

            return Json(ids);
        }


        public async Task SaveAsAsync(IFormFile file, string destinationFile)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));

            await using var fs = new FileStream(destinationFile, FileMode.CreateNew);
            await file.CopyToAsync(fs);
        }

        public async Task SaveAsAsync(string file, string destinationFile)
        {
            if (file == null)
                throw new ArgumentNullException(nameof(file));
            if (destinationFile == null)
                throw new ArgumentNullException(nameof(destinationFile));

            await using var destFs = new FileStream(destinationFile, FileMode.CreateNew);
            await using var sourceFs = new FileStream(file, FileMode.Open);

            try
            {
                await sourceFs.CopyToAsync(destFs);
            }
            catch (Exception ex) when (ex is ArgumentNullException || ex is ArgumentOutOfRangeException || ex is ObjectDisposedException || ex is NotSupportedException)
            {
                _logger.Log(LogLevel.Information, "Ignoring SaveAs File Exception");
            }

        }

        private async Task SaveToAzureAsync(IFormFile file, string filename)
        {
            var blobConnection = _config.GetValue<string>("blobstorage");
            var acct = CloudStorageAccount.Parse(blobConnection);
            var client = acct.CreateCloudBlobClient();
            var container = client.GetContainerReference("uploadedfiles");
            var permissions = new BlobContainerPermissions {PublicAccess = BlobContainerPublicAccessType.Blob};
            await container.SetPermissionsAsync(permissions);

            var blob = container.GetBlockBlobReference(filename);
            await blob.UploadFromStreamAsync(file.OpenReadStream());
        }
        public async Task<int?> UploadFile(IFormFile file, string destinationFileRoot, int parentId, string parentModule)
        {
            var g = Guid.NewGuid();
            string filename = g.ToString();
            var destinationFileName = destinationFileRoot + filename;

            try
            {
                await SaveAsAsync(file, destinationFileName);
                await SaveToAzureAsync(file, g.ToString());

                var uf = new UploadedFile
                {
                    DestinationFileName = filename,
                    FileSize = (int)file.Length,
                    MimeType = file.ContentType,
                    OriginalFileName = file.FileName,
                    ParentId = parentId,
                    ParentModule = parentModule
                };

                await _db.UploadedFiles.AddAsync(uf);
                await _db.SaveChangesAsync().ConfigureAwait(false);

                return uf.Id;
            }
            catch (Exception ex) when (ex is DbUpdateConcurrencyException || ex is DbUpdateException)
            {
                _logger.Log(LogLevel.Information, "Ignoring Upload File Exception");
            }

            return null;
        }

        public async Task<int> UploadFile(string file, string destinationFileRoot, int parentId, string parentModule, bool singleInstance = false)
        {
            var g = Guid.NewGuid();
            var destinationFileName = destinationFileRoot + g;
            int id = -1;

            try
            {
                await SaveAsAsync(file, destinationFileName);

                var fileInfo = new FileInfo(file);
                var ufs = _db.UploadedFiles.Where(m => m.ParentId == parentId && m.ParentModule == parentModule);

                if (! await ufs.AnyAsync() || ! singleInstance)
                {
                    var newUf = new UploadedFile
                    {
                        DestinationFileName = g.ToString(),
                        FileSize = (int)fileInfo.Length,
                        MimeType = MimeTypes.GetMimeType(file),
                        OriginalFileName = file,
                        ParentId = parentId,
                        ParentModule = parentModule
                    };

                    await _db.UploadedFiles.AddAsync(newUf);
                    id = newUf.Id;
                }
                else
                {
                    var uf = await ufs.FirstAsync().ConfigureAwait(false);
                    uf.DestinationFileName = g.ToString();
                    uf.FileSize = (int)fileInfo.Length;
                    uf.MimeType = MimeTypes.GetMimeType(file);
                    uf.OriginalFileName = file;
                    id = uf.Id;
                }

                await _db.SaveChangesAsync().ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is DbUpdateConcurrencyException || ex is DbUpdateException)
            {
                _logger.Log(LogLevel.Information, "Ignoring Upload file exception");
            }

            return id;
        }
    }
}
