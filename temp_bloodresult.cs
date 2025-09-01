using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace JCRing.Api.Entities
{
    [Table("BloodResults")]
    public class BloodResult
    {
        [Key]
        public int Id { get; set; }

        public int AthleteId { get; set; }
        public int TestTypeId { get; set; }
        public DateTime TestDate { get; set; }
        public string LabName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Lab information
        public string? TestMethod { get; set; }
        public string? ReferenceRanges { get; set; }
        public bool? IsAbnormal { get; set; }
        public string? FlaggedValues { get; set; }

        // Hormones
        [Column(TypeName = "decimal(10,2)")]
        public decimal? CortisolNmolL { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? VitaminD { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? Testosterone { get; set; }

        // Muscle & Metabolic
        [Column(TypeName = "decimal(10,2)")]
        public decimal? Ck { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? FastingGlucose { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Hba1c { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Hba1cIfcc { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? EstimatedAverageGlucose { get; set; }

        // Kidney Function
        [Column(TypeName = "decimal(10,2)")]
        public decimal? Urea { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? Creatinine { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? Egfr { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? UricAcid { get; set; }

        // Liver Function
        [Column(TypeName = "decimal(10,2)")]
        public decimal? SGutamylTransferase { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? SAlanineTransaminase { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? SAspartateTransaminase { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? LactateDehydrogenase { get; set; }

        // Minerals & Proteins
        [Column(TypeName = "decimal(5,2)")]
        public decimal? CalciumAdjusted { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? CalciumMeasured { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Magnesium { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? AlbuminBcg { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? CReactiveProtein { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? TotalProtein { get; set; }

        // Inflammation
        [Column(TypeName = "decimal(5,2)")]
        public decimal? Esr { get; set; }

        // Complete Blood Count (CBC)
        [Column(TypeName = "decimal(10,2)")]
        public decimal? ErythrocyteCount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Hemoglobin { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Hematocrit { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Mcv { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Mch { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Mchc { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Rdw { get; set; }

        // White Blood Cells
        [Column(TypeName = "decimal(10,2)")]
        public decimal? LeucocyteCount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? NeutrophilsPct { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? NeutrophilAbsoluteCount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? LymphocytesPct { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? LymphocytesAbsoluteCount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? MonocytesPct { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? MonocytesAbsoluteCount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? EosinophilsPct { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? EosinophilsAbsoluteCount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? BasophilsPct { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal? BasophilsAbsoluteCount { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Nlr { get; set; }

        // Platelets
        [Column(TypeName = "decimal(10,2)")]
        public decimal? Platelets { get; set; }

        // Navigation properties
        public Athlete? Athlete { get; set; }
        [ForeignKey("TestTypeId")]
        public BloodTestType? BloodTestType { get; set; }
    }
}