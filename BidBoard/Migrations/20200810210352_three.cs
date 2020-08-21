using Microsoft.EntityFrameworkCore.Migrations;

namespace BidBoard.Migrations
{
    public partial class three : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                "UploadedFiles",
                table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ParentId = table.Column<int>(nullable: true),
                    ParentModule = table.Column<string>(nullable: false),
                    OriginalFileName = table.Column<string>(nullable: false),
                    MimeType = table.Column<string>(nullable: false),
                    FileSize = table.Column<int>(nullable: false),
                    DestinationFileName = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UploadedFiles", x => x.Id);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                "UploadedFiles");
        }
    }
}
