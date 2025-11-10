-- Migration: Align it_conf_ccm columns with UI fields
-- Run this SQL after reviewing and backing up your table!

ALTER TABLE it_conf_ccm
  ADD COLUMN card_code VARCHAR(20) NOT NULL,
  ADD COLUMN card_name VARCHAR(100) NOT NULL,
  ADD COLUMN card_type VARCHAR(20) NOT NULL,
  ADD COLUMN bank_issuer VARCHAR(100) NOT NULL,
  ADD COLUMN status TINYINT(1) DEFAULT 1,
  ADD COLUMN transaction_fee DECIMAL(8,2) DEFAULT 0,
  ADD COLUMN transaction_charges DECIMAL(8,2) DEFAULT 0,
  ADD COLUMN effective_from DATE DEFAULT NULL,
  ADD COLUMN effective_to DATE DEFAULT NULL;

-- Optionally, drop or rename old columns if you no longer need them.
-- ALTER TABLE it_conf_ccm DROP COLUMN ...
