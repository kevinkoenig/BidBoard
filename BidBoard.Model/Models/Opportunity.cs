using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BidBoard.Models
{
    public enum OpportunityType
    {
        BidNotification,
        LeadAlert,
        ProcurementNotice,
        Unknown
    }

    public enum ProjectType
    {
        Bridge = 1,
        Resurface = 2,
        RoadWiden = 3,
        Facility = 4,
        Utility = 5,
        Culvert = 6,
        Wall = 7,
        ConstructionAtRisk = 8,
        ConsultantServices = 9,
        InspectionServices = 10,
        GeneralContracting = 11,
        EngineeringServices = 12,
        WaterAndWasteWater = 13,
        DesignServices = 14,
        ConstructionManagement = 15,
        FeasibilityStudy = 16,
        RightOfWay = 17,
        LandScape = 18,
        Rail = 19,
        Unknown
    }

    public enum Market
    {
        SateAndLocal,
        Federal,
        Unknown
    }

    public enum Status
    {
        Awarded,
        Deleted,
        Expired,
        PreRfp,
        Other,
        PostRfp,
        Source
    }

    public class Opportunity
    {
        [Key] public int Id { get; set; }
        public OpportunityType OpportunityType { get; set; }
        public string? ProgramName { get; set; }
        public string? Organization { get; set; }
        public int SolicitationYear { get; set; }
        public Market Market { get; set; }
        public string? StateProvince { get; set; }
        public string? ZipCode { get; set; }
        public string? Address1 { get; set; }
        public string? Address2 { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? OrgType { get; set; }
        public Status? Status { get; set; }
        public string? SolicitationNumber { get; set; }
        [Column(TypeName = "decimal(18,2)")] public decimal Value { get; set; }
        public string? Summary { get; set; }
        public DateTime SolicitationDate { get; set; }
        public DateTime ResponseDate { get; set; }
        public ProjectType ProjectType { get; set; }
    }
}