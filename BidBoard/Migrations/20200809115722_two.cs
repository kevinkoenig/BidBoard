using Microsoft.EntityFrameworkCore.Migrations;

namespace BidBoard.Migrations
{
    public partial class two : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                "UserImageUrl",
                "AspNetUsers",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                "UserImageUrl",
                "AspNetUsers");
        }
    }
}
