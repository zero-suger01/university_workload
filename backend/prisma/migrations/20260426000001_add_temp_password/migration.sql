-- Add tempPassword column to User for Password Directory report.
-- Stores the plain-text initial password so admins can export a credential sheet.
ALTER TABLE "User" ADD COLUMN "tempPassword" TEXT;
