export const dashboardData = {
  summary: {
    totalTrains: 25,
    revenueReady: 20,
    standby: 3,
    maintenance: 2,
  },
  inductionList: [
    { trainNumber: "T001", action: "Revenue Ready", score: 95.5 },
    { trainNumber: "T002", action: "Standby", score: 80.2 },
    { trainNumber: "T003", action: "Maintenance", score: 65.8 },
    { trainNumber: "T004", action: "Revenue Ready", score: 92.1 },
    { trainNumber: "T005", action: "Standby", score: 78.3 },
  ],
  conflicts: {
    critical: 2,
    high: 5,
    medium: 8,
    low: 3,
  },
  trains: [
    { id: "T001", status: "revenue", lastUpdate: "2 hours ago" },
    { id: "T002", status: "standby", lastUpdate: "5 hours ago" },
    { id: "T003", status: "maintenance", lastUpdate: "1 hour ago" },
    { id: "T004", status: "revenue", lastUpdate: "30 mins ago" },
    { id: "T005", status: "standby", lastUpdate: "3 hours ago" },
  ],
};

export const whatIfOutputData = {
  newInductionList: [
    { trainNumber: "T002", action: "Revenue Ready", score: 88.5, change: "+8.3" },
    { trainNumber: "T004", action: "Revenue Ready", score: 94.2, change: "+2.1" },
    { trainNumber: "T005", action: "Revenue Ready", score: 85.1, change: "+6.8" },
  ],
  impactAnalysis: {
    revenueIncrease: "+15%",
    costSavings: "+8%",
    maintenanceReduction: "-12%",
    operationalEfficiency: "+22%",
  },
  recommendations: [
    "Move Train T002 to revenue immediately for 15% increase",
    "Schedule maintenance for T001 within 48 hours",
    "Update branding priority for T004 next week",
    "Monitor standby trains for unexpected issues",
  ],
};
