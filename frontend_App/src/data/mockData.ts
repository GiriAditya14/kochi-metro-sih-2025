// Mock data for the app - no backend required

export const mockDashboardSummary = {
  fleet: { total: 25, active: 22 },
  certificates: { expired: 2, expiring_soon: 3 },
  maintenance: { open_jobs: 8, safety_critical: 2 },
  branding: { active_contracts: 12, at_risk: 3 },
  cleaning: { overdue: 4 },
  alerts: { unresolved: 5, critical: 1 },
  ai_enabled: true,
  latest_plan: {
    id: 1,
    plan_id: 'PLAN-2025-12-09-001',
    plan_date: '2025-12-09',
    status: 'proposed',
    trains_in_service: 18,
    trains_standby: 3,
    trains_ibl: 3,
    trains_out_of_service: 1,
    optimization_score: 847.5,
  },
};

export const mockTrains = [
  { id: 1, train_id: 'TS-201', configuration: '3-car', status: 'active', depot_id: 'MUTTOM', current_track: 'T1', overall_health_score: 92 },
  { id: 2, train_id: 'TS-202', configuration: '3-car', status: 'active', depot_id: 'MUTTOM', current_track: 'T2', overall_health_score: 88 },
  { id: 3, train_id: 'TS-203', configuration: '3-car', status: 'active', depot_id: 'MUTTOM', current_track: 'T3', overall_health_score: 75 },
  { id: 4, train_id: 'TS-204', configuration: '3-car', status: 'under_maintenance', depot_id: 'MUTTOM', current_track: 'IBL-1', overall_health_score: 45 },
  { id: 5, train_id: 'TS-205', configuration: '3-car', status: 'active', depot_id: 'MUTTOM', current_track: 'T4', overall_health_score: 95 },
  { id: 6, train_id: 'TS-206', configuration: '3-car', status: 'active', depot_id: 'MUTTOM', current_track: 'T5', overall_health_score: 82 },
  { id: 7, train_id: 'TS-207', configuration: '3-car', status: 'active', depot_id: 'MUTTOM', current_track: 'T6', overall_health_score: 78 },
  { id: 8, train_id: 'TS-208', configuration: '3-car', status: 'out_of_service', depot_id: 'MUTTOM', current_track: 'IBL-2', overall_health_score: 25 },
  { id: 9, train_id: 'TS-209', configuration: '3-car', status: 'active', depot_id: 'MUTTOM', current_track: 'T7', overall_health_score: 90 },
  { id: 10, train_id: 'TS-210', configuration: '3-car', status: 'active', depot_id: 'MUTTOM', current_track: 'T8', overall_health_score: 85 },
];

export const mockAssignments = [
  { id: 1, train_id: 1, train: { train_id: 'TS-201' }, assignment_type: 'SERVICE', assigned_track: 'T1', assigned_position: 1, service_rank: 1, overall_score: 92, fitness_score: 95, maintenance_score: 90, branding_score: 88, assignment_reason: 'Highest health score, all certificates valid' },
  { id: 2, train_id: 2, train: { train_id: 'TS-202' }, assignment_type: 'SERVICE', assigned_track: 'T2', assigned_position: 2, service_rank: 2, overall_score: 88, fitness_score: 90, maintenance_score: 85, branding_score: 92, assignment_reason: 'Good health, branding SLA priority' },
  { id: 3, train_id: 5, train: { train_id: 'TS-205' }, assignment_type: 'SERVICE', assigned_track: 'T4', assigned_position: 3, service_rank: 3, overall_score: 95, fitness_score: 98, maintenance_score: 92, branding_score: 85, assignment_reason: 'Excellent condition' },
  { id: 4, train_id: 9, train: { train_id: 'TS-209' }, assignment_type: 'STANDBY', assigned_track: 'T7', assigned_position: 1, overall_score: 90, fitness_score: 92, maintenance_score: 88, branding_score: 80, assignment_reason: 'Reserve for peak hours' },
  { id: 5, train_id: 10, train: { train_id: 'TS-210' }, assignment_type: 'STANDBY', assigned_track: 'T8', assigned_position: 2, overall_score: 85, fitness_score: 88, maintenance_score: 82, branding_score: 78, assignment_reason: 'Backup standby' },
  { id: 6, train_id: 3, train: { train_id: 'TS-203' }, assignment_type: 'IBL_MAINTENANCE', assigned_track: 'IBL-1', assigned_position: 1, overall_score: 75, fitness_score: 70, maintenance_score: 65, branding_score: 90, assignment_reason: 'Scheduled brake inspection' },
  { id: 7, train_id: 4, train: { train_id: 'TS-204' }, assignment_type: 'IBL_CLEANING', assigned_track: 'IBL-2', assigned_position: 2, overall_score: 45, fitness_score: 50, maintenance_score: 40, branding_score: 95, assignment_reason: 'Deep cleaning required' },
  { id: 8, train_id: 8, train: { train_id: 'TS-208' }, assignment_type: 'OUT_OF_SERVICE', assigned_track: 'OOS', assigned_position: 1, overall_score: 25, fitness_score: 20, maintenance_score: 15, branding_score: 60, assignment_reason: 'Major overhaul in progress' },
];

export const mockPlans = [
  { id: 1, plan_id: 'PLAN-2025-12-09-001', plan_date: '2025-12-09', status: 'proposed', trains_in_service: 18, trains_standby: 3, trains_ibl: 3, trains_out_of_service: 1, optimization_score: 847.5 },
  { id: 2, plan_id: 'PLAN-2025-12-08-001', plan_date: '2025-12-08', status: 'approved', trains_in_service: 19, trains_standby: 2, trains_ibl: 3, trains_out_of_service: 1, optimization_score: 862.3 },
  { id: 3, plan_id: 'PLAN-2025-12-07-001', plan_date: '2025-12-07', status: 'approved', trains_in_service: 17, trains_standby: 4, trains_ibl: 3, trains_out_of_service: 1, optimization_score: 831.8 },
];

export const mockAlerts = [
  { id: 1, title: 'Certificate Expiring', message: 'TS-203 Rolling Stock certificate expires in 24 hours', severity: 'critical', train_id: 3, is_acknowledged: false, is_resolved: false, created_at: '2025-12-09T08:00:00Z' },
  { id: 2, title: 'Safety Critical Job', message: 'TS-204 has pending brake system inspection', severity: 'warning', train_id: 4, is_acknowledged: true, acknowledged_by: 'Supervisor', is_resolved: false, created_at: '2025-12-09T07:30:00Z' },
  { id: 3, title: 'Branding SLA Risk', message: 'Muthoot Finance contract on TS-206 below weekly target', severity: 'warning', train_id: 6, is_acknowledged: false, is_resolved: false, created_at: '2025-12-09T06:00:00Z' },
  { id: 4, title: 'Cleaning Overdue', message: 'TS-207 has not been cleaned for 3 days', severity: 'info', train_id: 7, is_acknowledged: false, is_resolved: false, created_at: '2025-12-08T18:00:00Z' },
  { id: 5, title: 'Mileage Threshold', message: 'TS-202 approaching service mileage threshold', severity: 'info', train_id: 2, is_acknowledged: true, acknowledged_by: 'Operator', is_resolved: false, created_at: '2025-12-08T12:00:00Z' },
];

export const mockCertificates = [
  { id: 1, certificate_number: 'CERT-RS-001', train_id: 'TS-201', department: 'RollingStock', status: 'Valid', valid_to: '2025-12-31', hours_until_expiry: 528 },
  { id: 2, certificate_number: 'CERT-SIG-001', train_id: 'TS-201', department: 'Signalling', status: 'Valid', valid_to: '2025-12-25', hours_until_expiry: 384 },
  { id: 3, certificate_number: 'CERT-RS-002', train_id: 'TS-203', department: 'RollingStock', status: 'ExpiringSoon', valid_to: '2025-12-10', hours_until_expiry: 24 },
  { id: 4, certificate_number: 'CERT-TEL-001', train_id: 'TS-204', department: 'Telecom', status: 'Expired', valid_to: '2025-12-05', hours_until_expiry: -96 },
  { id: 5, certificate_number: 'CERT-RS-003', train_id: 'TS-205', department: 'RollingStock', status: 'Valid', valid_to: '2026-01-15', hours_until_expiry: 888 },
];

export const mockJobCards = [
  { id: 1, job_id: 'WO-2025-001', train_id: 'TS-203', title: 'Brake pad replacement', job_type: 'preventive', priority: 2, status: 'OPEN', safety_critical: true, due_date: '2025-12-10' },
  { id: 2, job_id: 'WO-2025-002', train_id: 'TS-204', title: 'HVAC filter cleaning', job_type: 'preventive', priority: 3, status: 'IN_PROGRESS', safety_critical: false, due_date: '2025-12-11' },
  { id: 3, job_id: 'WO-2025-003', train_id: 'TS-206', title: 'Door mechanism inspection', job_type: 'inspection', priority: 4, status: 'OPEN', safety_critical: false, due_date: '2025-12-15' },
  { id: 4, job_id: 'WO-2025-004', train_id: 'TS-208', title: 'Traction motor overhaul', job_type: 'overhaul', priority: 1, status: 'IN_PROGRESS', safety_critical: true, due_date: '2025-12-20' },
  { id: 5, job_id: 'WO-2025-005', train_id: 'TS-202', title: 'Pantograph inspection', job_type: 'inspection', priority: 3, status: 'DEFERRED', safety_critical: false, due_date: '2025-12-18' },
];

export const mockBranding = [
  { id: 1, train_id: 'TS-201', brand_name: 'Muthoot Finance', priority: 'gold', target_exposure_hours_weekly: 50, current_exposure_hours_week: 45, urgency_score: 35 },
  { id: 2, train_id: 'TS-202', brand_name: 'Federal Bank', priority: 'platinum', target_exposure_hours_weekly: 60, current_exposure_hours_week: 58, urgency_score: 15 },
  { id: 3, train_id: 'TS-206', brand_name: 'Kalyan Jewellers', priority: 'gold', target_exposure_hours_weekly: 50, current_exposure_hours_week: 32, urgency_score: 72 },
  { id: 4, train_id: 'TS-207', brand_name: 'Lulu Mall', priority: 'silver', target_exposure_hours_weekly: 40, current_exposure_hours_week: 38, urgency_score: 20 },
];

export const mockMileage = [
  { id: 1, train_id: 'TS-201', lifetime_km: 125000, km_since_last_service: 4500, km_to_threshold: 500, threshold_risk_score: 90, is_near_threshold: true },
  { id: 2, train_id: 'TS-202', lifetime_km: 118000, km_since_last_service: 3200, km_to_threshold: 1800, threshold_risk_score: 64, is_near_threshold: false },
  { id: 3, train_id: 'TS-205', lifetime_km: 95000, km_since_last_service: 1500, km_to_threshold: 3500, threshold_risk_score: 30, is_near_threshold: false },
  { id: 4, train_id: 'TS-209', lifetime_km: 142000, km_since_last_service: 2800, km_to_threshold: 2200, threshold_risk_score: 56, is_near_threshold: false },
];

export const mockCleaning = [
  { id: 1, train_id: 'TS-201', status: 'ok', days_since_last_cleaning: 0.5, special_clean_required: false, vip_inspection_tomorrow: false },
  { id: 2, train_id: 'TS-202', status: 'due', days_since_last_cleaning: 1.8, special_clean_required: false, vip_inspection_tomorrow: true, vip_inspection_notes: 'Minister visit' },
  { id: 3, train_id: 'TS-207', status: 'overdue', days_since_last_cleaning: 3.2, special_clean_required: true, special_clean_reason: 'Spillage reported', vip_inspection_tomorrow: false },
  { id: 4, train_id: 'TS-204', status: 'ok', days_since_last_cleaning: 0.2, special_clean_required: false, vip_inspection_tomorrow: false },
];

export const mockTrainDetail = {
  train: {
    id: 1,
    train_id: 'TS-201',
    configuration: '3-car',
    status: 'active',
    manufacturer: 'BEML',
    commissioning_date: '2017-06-15',
    current_track: 'T1',
    current_position: 1,
    overall_health_score: 92,
  },
  fitness_certificates: [
    { department: 'RollingStock', status: 'Valid', valid_to: '2025-12-31', hours_until_expiry: 528, remarks: 'All systems nominal', emergency_override: false },
    { department: 'Signalling', status: 'Valid', valid_to: '2025-12-25', hours_until_expiry: 384, remarks: 'CBTC operational', emergency_override: false },
    { department: 'Telecom', status: 'Valid', valid_to: '2025-12-20', hours_until_expiry: 264, remarks: null, emergency_override: false },
  ],
  job_cards: [
    { job_id: 'WO-2025-010', title: 'Routine inspection', job_type: 'inspection', priority: 4, status: 'CLOSED', safety_critical: false, due_date: '2025-12-05' },
    { job_id: 'WO-2025-015', title: 'PA system check', job_type: 'preventive', priority: 5, status: 'OPEN', safety_critical: false, due_date: '2025-12-15' },
  ],
  branding_contracts: [
    { brand_name: 'Muthoot Finance', priority: 'gold', target_exposure_hours_weekly: 50, current_exposure_hours_week: 45, urgency_score: 35 },
  ],
  mileage: { lifetime_km: 125000, km_since_last_service: 4500, km_to_threshold: 500, threshold_risk_score: 90, is_near_threshold: true },
  cleaning: { status: 'ok', days_since_last_cleaning: 0.5, special_clean_required: false, vip_inspection_tomorrow: false },
};

export const mockDailyBriefing = `Good morning! Here's your daily operations briefing for December 9, 2025:

**Fleet Status:**
• 22 of 25 trains are active and ready for service
• 2 trains in IBL for maintenance
• 1 train out of service for major overhaul

**Critical Alerts:**
• TS-203 Rolling Stock certificate expires in 24 hours - immediate renewal required
• TS-204 has pending safety-critical brake inspection

**Branding SLA:**
• Kalyan Jewellers contract on TS-206 is 36% below weekly target
• Consider prioritizing TS-206 for peak hour service

**Recommendations:**
1. Approve tonight's induction plan after reviewing TS-203 certificate status
2. Schedule TS-207 for cleaning before tomorrow's service
3. Monitor TS-201 mileage - approaching service threshold`;
