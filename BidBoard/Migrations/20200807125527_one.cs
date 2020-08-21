using Microsoft.EntityFrameworkCore.Migrations;

namespace BidBoard.Migrations
{
    public partial class one : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                "OpportunityId",
                "UserOpportunityData",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                "IX_UserOpportunityData_OpportunityId",
                "UserOpportunityData",
                "OpportunityId");

            migrationBuilder.AddForeignKey(
                "FK_UserOpportunityData_Opportunities_OpportunityId",
                "UserOpportunityData",
                "OpportunityId",
                "Opportunities",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                "FK_UserOpportunityData_Opportunities_OpportunityId",
                "UserOpportunityData");

            migrationBuilder.DropIndex(
                "IX_UserOpportunityData_OpportunityId",
                "UserOpportunityData");

            migrationBuilder.DropColumn(
                "OpportunityId",
                "UserOpportunityData");
        }
    }
}
