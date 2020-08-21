using System.Collections.Generic;
using System.IO;
using Microsoft.AspNetCore.Hosting;
using OfficeOpenXml;

namespace BidBoard.Utility
{
    public class FipsCode
    {
        public string? Code { get; set; }
        public string? County { get; set; }
        public string? State { get; set; }
    }
    
    public interface IFipsCodeHelper
    {
        List<FipsCode> GetFipsCodes();
    }
    
    public class FipsCodesClass : IFipsCodeHelper
    {
        private readonly List<FipsCode> _fipsCodes = new List<FipsCode>();
        
        public FipsCodesClass(IWebHostEnvironment env)
        {
            string fileName = env.WebRootPath + "\\" + "FipsCodes.xlsx";
            
            FileInfo file = new FileInfo(fileName);
            ExcelPackage.LicenseContext = LicenseContext.Commercial;
            using var wp = new ExcelPackage(file);
            var ws = wp.Workbook.Worksheets[0];
            if (ws.Dimension != null)
            {
                var totalRows = ws.Dimension.Rows;
                for (var nRow = 1; nRow < totalRows; nRow++)
                {
                    var fipsCode = new FipsCode
                    {
                        Code = ws.Cells[nRow, 1].GetValue<int>().ToString("D5"),
                        County = ws.Cells[nRow, 2].GetValue<string>(),
                        State = ws.Cells[nRow, 3].GetValue<string>()
                    };
                    
                    _fipsCodes.Add(fipsCode);
                }
            }
        }

        public List<FipsCode> GetFipsCodes()
        {
            return _fipsCodes;
        }
    }
}