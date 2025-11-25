using Isiran.Domain.Common;

namespace Isiran.Domain.Projects
{
    public class KPIMetric : BaseEntity
    {
        public Guid ProjectId { get; set; }
        public DateTime MetricDate { get; set; }
        public decimal? CPI { get; set; } // Cost Performance Index
        public decimal? SPI { get; set; } // Schedule Performance Index
        public decimal? EV { get; set; } // Earned Value
        public decimal? PV { get; set; } // Planned Value
        public decimal? AC { get; set; } // Actual Cost
        public decimal? BAC { get; set; } // Budget at Completion
        public decimal? EAC { get; set; } // Estimate at Completion
        public decimal? ETC { get; set; } // Estimate to Complete
        public decimal? VAC { get; set; } // Variance at Completion

        public void CalculateCPI()
        {
            if (EV.HasValue && AC.HasValue && AC.Value > 0)
            {
                CPI = EV.Value / AC.Value;
            }
        }

        public void CalculateSPI()
        {
            if (EV.HasValue && PV.HasValue && PV.Value > 0)
            {
                SPI = EV.Value / PV.Value;
            }
        }

        public void CalculateEAC()
        {
            if (BAC.HasValue && CPI.HasValue && CPI.Value > 0)
            {
                EAC = BAC.Value / CPI.Value;
            }
        }

        public void CalculateETC()
        {
            if (EAC.HasValue && AC.HasValue)
            {
                ETC = EAC.Value - AC.Value;
            }
        }

        public void CalculateVAC()
        {
            if (BAC.HasValue && EAC.HasValue)
            {
                VAC = BAC.Value - EAC.Value;
            }
        }

        public void CalculateAll()
        {
            CalculateCPI();
            CalculateSPI();
            CalculateEAC();
            CalculateETC();
            CalculateVAC();
        }
    }
}

