-- =============================================================================
-- [04b] Bridge เพิ่ม — off-road gasoline + on-road CNG unit (kg)
-- รันหลัง 04
-- =============================================================================

USE control_z_v2;

SET @src_tgo := (SELECT source_id FROM ef_sources WHERE source_code = 'TGO_AR5');
SET @g_co2  := (SELECT gas_id FROM gas_types WHERE gas_code = 'CO2');
SET @g_ch4f := (SELECT gas_id FROM gas_types WHERE gas_code = 'CH4_FOSSIL');
SET @g_n2o  := (SELECT gas_id FROM gas_types WHERE gas_code = 'N2O');

INSERT IGNORE INTO ef_categories (parent_id, category_code, name_th, name_en, scope_id, unit_activity, sort_order)
SELECT p.category_id, 'MOBILE_OFFROAD_GAS2ST', 'เบนซิน 2-stroke นอกถนน', 'Off-road Gas 2-stroke', 1, 'litre', 305
FROM ef_categories p WHERE p.category_code = 'SCOPE1_MOBILE';

DELETE ef FROM emission_factors ef
JOIN ef_categories ec ON ec.category_id = ef.category_id
WHERE ec.category_code = 'MOBILE_OFFROAD_GAS2ST';

INSERT INTO emission_factors (
  source_id, category_id, gas_id, activity_name_th, co2_type, ef_value, ef_unit,
  ef_unit_numerator, ef_unit_denominator, region, is_default, effective_from
)
SELECT @src_tgo, c.category_id, g.gas_id, c.name_th, g.co2_type, g.ef_val, g.ef_unit, g.num, 'litre', 'Thailand', 1, '2026-01-01'
FROM ef_categories c
JOIN (
  SELECT @g_co2 AS gas_id, 'fossil' AS co2_type, 2.18160000 AS ef_val, 'kgCO2/litre' AS ef_unit, 'kgCO2' AS num UNION ALL
  SELECT @g_ch4f, NULL, 0.00441000, 'kgCH4/litre', 'kgCH4' UNION ALL
  SELECT @g_n2o, NULL, 0.00001260, 'kgN2O/litre', 'kgN2O'
) g ON c.category_code = 'MOBILE_OFFROAD_GAS2ST';

INSERT INTO ef_ui_options
  (scope_scid, ui_context, option_key, label_th, ef_category_code, activity_subtype, ef_purpose, unit_denominator, calc_mode, sort_order)
VALUES
  (1, 'off_road', 'gasoline_4_stroke', 'เบนซิน 4 จังหวะ off-road', 'MOBILE_OFFROAD_GAS4ST', NULL, NULL, 'L', 'combustion_multigas', 44),
  (1, 'off_road', 'gasoline_2_stroke', 'เบนซิน 2 จังหวะ off-road', 'MOBILE_OFFROAD_GAS2ST', NULL, NULL, 'L', 'combustion_multigas', 45)
ON DUPLICATE KEY UPDATE
  ef_category_code = VALUES(ef_category_code),
  label_th = VALUES(label_th);

-- CNG on-road: Frontend ใช้ m3 แต่ EF เป็น kg — alias ชั่วคราว (1 m3 ≈ 0.72 kg ก๊าซธรรมชาติ compressed ประมาณ)
INSERT IGNORE INTO unit_aliases (ui_unit, ef_unit_denominator, multiplier) VALUES
  ('m3', 'kg', 0.72000000);
