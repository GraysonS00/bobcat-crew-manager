// Run this script once with: node createPdfTemplate.js
// It will create a fillable PDF template from the original form

import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function createFillableTemplate() {
  // Load the existing PDF
  const existingPdfBytes = fs.readFileSync('./Leak Report Form.pdf');
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const form = pdfDoc.getForm();
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  console.log(`PDF size: ${width} x ${height}`);

  // Helper to create text field
  const addTextField = (name, x, y, w, h) => {
    const field = form.createTextField(name);
    field.addToPage(page, { x, y: height - y - h, width: w, height: h });
    field.setFontSize(10);
  };

  // Helper to create checkbox
  const addCheckbox = (name, x, y, size = 10) => {
    const field = form.createCheckBox(name);
    field.addToPage(page, { x, y: height - y - size, width: size, height: size });
  };

  // ============================================
  // HEADER SECTION (top of form)
  // ============================================

  // Left side - Date, Foreman, Supervisor
  addTextField('date', 50, 30, 80, 14);
  addTextField('foreman', 70, 52, 90, 14);
  addTextField('supervisor', 75, 74, 85, 14);

  // Right side - Project #, Leak #
  addTextField('project_number', 500, 30, 90, 14);
  addTextField('leak_number', 485, 52, 105, 14);

  // Address (spans width)
  addTextField('address', 85, 96, 500, 14);

  // ============================================
  // JOB TYPE SECTION
  // ============================================

  // Job type checkboxes (left side)
  addCheckbox('job_type_regular_leak', 120, 125, 12);
  addCheckbox('job_type_grade_1', 120, 147, 12);
  addCheckbox('job_type_laying_sod', 120, 169, 12);

  // Grade 1 details
  addCheckbox('crew_called_off_to_grade_1', 295, 125, 10);
  addTextField('time_called_off_to_grade_1', 438, 135, 55, 12);
  addCheckbox('leak_turned_into_grade_1', 295, 153, 10);
  addTextField('time_leak_turned_grade_1', 438, 163, 55, 12);

  // Superintendent section (top right) - Classification
  addCheckbox('rate_type_all_hourly', 540, 125, 10);
  addCheckbox('rate_type_unit_rates', 540, 143, 10);
  addCheckbox('rate_type_both', 540, 161, 10);

  // ============================================
  // REGULAR LEAK SECTION
  // ============================================

  // Leak Located
  addCheckbox('leak_located_yes', 130, 212, 10);
  addCheckbox('leak_located_no', 163, 212, 10);

  // Leak located before arrival
  addCheckbox('leak_located_before_arrival_yes', 195, 234, 10);
  addCheckbox('leak_located_before_arrival_no', 228, 234, 10);

  // Over 25 min to locate
  addCheckbox('over_25_min_yes', 340, 256, 10);
  addCheckbox('over_25_min_no', 373, 256, 10);

  // Type of Leak - Main/Service
  addCheckbox('leak_type_main', 98, 290, 10);
  addCheckbox('leak_type_service', 143, 290, 10);

  // Pipe Type - Steel/Poly
  addCheckbox('pipe_type_steel', 243, 290, 10);
  addCheckbox('pipe_type_poly', 288, 290, 10);

  // Type of Replacement
  addCheckbox('short_side', 85, 330, 10);
  addTextField('short_side_qty', 147, 325, 30, 12);
  addCheckbox('long_side', 190, 330, 10);
  addTextField('long_side_qty', 260, 325, 30, 12);
  addCheckbox('insert_replacement', 85, 352, 10);
  addTextField('insert_qty', 130, 347, 30, 12);
  addCheckbox('retirement', 175, 352, 10);
  addTextField('retirement_qty', 240, 347, 30, 12);

  // Yes/No questions (left column)
  addCheckbox('section_out_main_yes', 295, 378, 10);
  addCheckbox('section_out_main_no', 328, 378, 10);

  addCheckbox('excessive_haul_off_yes', 248, 400, 10);
  addCheckbox('excessive_haul_off_no', 281, 400, 10);

  addCheckbox('excessive_restoration_yes', 248, 422, 10);
  addCheckbox('excessive_restoration_no', 281, 422, 10);

  addCheckbox('downtown_paving_yes', 310, 444, 10);
  addCheckbox('downtown_paving_no', 343, 444, 10);

  addCheckbox('traffic_control_yes', 270, 466, 10);
  addCheckbox('traffic_control_no', 303, 466, 10);

  addCheckbox('rock_in_bellhole_yes', 255, 488, 10);
  addCheckbox('rock_in_bellhole_no', 288, 488, 10);

  addCheckbox('street_plates_yes', 243, 510, 10);
  addCheckbox('street_plates_no', 276, 510, 10);

  addCheckbox('vac_truck_yes', 218, 532, 10);
  addCheckbox('vac_truck_no', 251, 532, 10);

  // ============================================
  // DOWNTIME SECTION (right side)
  // ============================================

  addTextField('downtime_1_start', 405, 217, 45, 12);
  addTextField('downtime_1_end', 510, 217, 45, 12);
  addTextField('downtime_2_start', 405, 237, 45, 12);
  addTextField('downtime_2_end', 510, 237, 45, 12);
  addTextField('downtime_3_start', 405, 257, 45, 12);
  addTextField('downtime_3_end', 510, 257, 45, 12);

  // ============================================
  // ADDERS SECTION (right side)
  // ============================================

  addCheckbox('no_blow_kit', 433, 295, 10);
  addTextField('no_blow_kit_qty', 530, 290, 35, 12);

  addCheckbox('short_stop_2_4', 433, 317, 10);
  addTextField('short_stop_2_4_qty', 530, 312, 35, 12);

  addCheckbox('short_stop_6_plus', 433, 339, 10);
  addTextField('short_stop_6_plus_qty', 530, 334, 35, 12);

  // ============================================
  // WELDER SECTION
  // ============================================

  addCheckbox('welder_used_yes', 448, 375, 10);
  addCheckbox('welder_used_no', 481, 375, 10);
  addCheckbox('welder_bobcat', 537, 395, 10);
  addCheckbox('welder_subbed', 537, 413, 10);

  // ============================================
  // BORE SECTION
  // ============================================

  addCheckbox('bore_used_yes', 428, 443, 10);
  addCheckbox('bore_used_no', 461, 443, 10);
  addCheckbox('bore_bobcat', 557, 462, 10);
  addCheckbox('bore_subbed', 557, 482, 10);
  addCheckbox('soil_type_dirt', 398, 505, 10);
  addCheckbox('soil_type_rock', 443, 505, 10);
  addTextField('bore_size_inches', 490, 522, 40, 12);
  addTextField('bore_footage', 505, 544, 40, 12);

  // ============================================
  // CREW TIMES
  // ============================================

  addTextField('crew_start_time', 68, 582, 70, 16);
  addTextField('crew_end_time', 220, 582, 70, 16);

  // ============================================
  // LEAK REPAIR COMPLETED
  // ============================================

  addCheckbox('leak_repair_completed_yes', 175, 628, 10);
  addCheckbox('leak_repair_completed_no', 208, 628, 10);

  // ============================================
  // FCC NAME & NOTES
  // ============================================

  addTextField('fcc_name', 30, 680, 140, 14);
  addTextField('notes', 200, 650, 385, 70);

  // Save the fillable template
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('./LeakReportTemplate.pdf', pdfBytes);

  console.log('Fillable template created: LeakReportTemplate.pdf');
  console.log('Form fields added:', form.getFields().map(f => f.getName()).join(', '));
}

createFillableTemplate().catch(console.error);
