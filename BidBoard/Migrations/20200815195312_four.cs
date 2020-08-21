using Microsoft.EntityFrameworkCore.Migrations;

namespace BidBoard.Migrations
{
    public partial class four : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                "ZipCode",
                "Opportunities",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                "StateProvince",
                "Opportunities",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                "IX_Opportunities_ProjectType",
                "Opportunities",
                "ProjectType");

            migrationBuilder.CreateIndex(
                "IX_Opportunities_StateProvince",
                "Opportunities",
                "StateProvince");

            migrationBuilder.CreateIndex(
                "IX_Opportunities_ZipCode",
                "Opportunities",
                "ZipCode");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                "IX_Opportunities_ProjectType",
                "Opportunities");

            migrationBuilder.DropIndex(
                "IX_Opportunities_StateProvince",
                "Opportunities");

            migrationBuilder.DropIndex(
                "IX_Opportunities_ZipCode",
                "Opportunities");

            migrationBuilder.AlterColumn<string>(
                "ZipCode",
                "Opportunities",
                "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                "StateProvince",
                "Opportunities",
                "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldNullable: true);
        }
    }
}
