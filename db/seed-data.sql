-- W13 Clinic App — seed data (run after schema.sql)
-- 5 sample doctors for Bangkok Hospital clinic demo

INSERT INTO doctors (name, specialty) VALUES
  (N'Nattaya Petchroong',  N'Cardiology'),
  (N'Somchai Wattanachai', N'Pediatrics'),
  (N'Pim Suwannarat',      N'Orthopedics'),
  (N'Anan Kongsawat',      N'Internal Medicine'),
  (N'Kornkrit Prasertsuk', N'Dermatology');
