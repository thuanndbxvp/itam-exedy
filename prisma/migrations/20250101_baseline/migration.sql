-- =============================================================================
-- BASELINE MIGRATION
-- This migration records the current state of an existing database.
-- No actual schema changes are made - this only creates the migration history entry.
-- =============================================================================

-- This is a baseline migration created because the database already had tables
-- when Prisma Migrate was first introduced.

-- The following models already exist in the database:
-- - ActionLog, ApiToken, Asset, AssetMaintenance, AssetModel, AssetHandover
-- - Category, Company, CompanyUser, Department, Depreciation
-- - EmailTemplate, EulaAcceptance, HelpdeskAssignmentRule, HelpdeskNotification
-- - License, LicenseSeat, Location, Manufacturer, NotificationChannel
-- - PasswordResetToken, Permission, RoleDefinition, RolePermission
-- - SavedFilter, Setting, StatusLabel, Supplier, Team, TeamMember
-- - Ticket, TicketAttachment, TicketComment, User, UserPermission, UserPreference
