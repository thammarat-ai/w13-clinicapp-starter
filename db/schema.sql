-- W13 Clinic App — Azure SQL schema
-- Run this against your Azure SQL Database `clinicdb`
-- Compatible with Azure SQL (uses IDENTITY, NVARCHAR, DATETIME2)

IF OBJECT_ID('appointments', 'U') IS NOT NULL DROP TABLE appointments;
IF OBJECT_ID('doctors',     'U') IS NOT NULL DROP TABLE doctors;

CREATE TABLE doctors (
  id        INT             IDENTITY(1,1) PRIMARY KEY,
  name      NVARCHAR(100)   NOT NULL,
  specialty NVARCHAR(100)   NOT NULL,
  created   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE appointments (
  id           INT            IDENTITY(1,1) PRIMARY KEY,
  doctor_id    INT            NOT NULL,
  patient_name NVARCHAR(200)  NOT NULL,
  slot         DATETIME2      NOT NULL,
  created      DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_appointments_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE CASCADE
);

CREATE INDEX ix_appointments_slot ON appointments (slot);
