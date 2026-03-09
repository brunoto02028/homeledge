/**
 * Centralized Audit Logger for Clarity & Co
 *
 * Logs sensitive financial operations to the Event table for compliance.
 * All audit entries include: userId, action type, entity info, timestamp, and metadata.
 *
 * Usage:
 *   import { auditLog } from '@/lib/audit-log';
 *   await auditLog(userId, 'statement.uploaded', 'bank_statement', statementId, { fileName, transactionCount });
 */

import { prisma } from '@/lib/db';

export type AuditEventType =
  // Auth events
  | 'auth.login'
  | 'auth.login_failed'
  | 'auth.logout'
  | 'auth.password_changed'
  | 'auth.password_reset'
  | 'auth.account_created'
  | 'auth.account_deleted'
  | 'auth.email_verified'
  // Financial events
  | 'statement.uploaded'
  | 'statement.deleted'
  | 'statement.categorized'
  | 'transaction.categorized'
  | 'transaction.approved'
  | 'transaction.bulk_approved'
  // Invoice events
  | 'invoice.created'
  | 'invoice.processed'
  | 'invoice.deleted'
  | 'invoice.submitted'
  // Bill events
  | 'bill.created'
  | 'bill.updated'
  | 'bill.deleted'
  | 'bill.scanned'
  // Entity events
  | 'entity.created'
  | 'entity.updated'
  | 'entity.deleted'
  | 'entity.ch_connected'
  | 'entity.hmrc_connected'
  | 'entity.filing_submitted'
  // Document events
  | 'document.scanned'
  | 'document.classified'
  | 'document.deleted'
  // Vault events
  | 'vault.entry_created'
  | 'vault.entry_accessed'
  | 'vault.entry_deleted'
  // Data events
  | 'data.exported'
  | 'data.shared_link_created'
  | 'data.shared_link_accessed'
  // Admin events
  | 'admin.user_created'
  | 'admin.user_updated'
  | 'admin.user_suspended'
  | 'admin.permissions_changed'
  | 'admin.plan_changed'
  // Open Banking
  | 'banking.connected'
  | 'banking.synced'
  | 'banking.disconnected'
  // Insurance
  | 'insurance.policy_created'
  | 'insurance.claim_submitted'
  // Generic
  | string;

export type AuditEntityType =
  | 'user'
  | 'bank_statement'
  | 'bank_transaction'
  | 'invoice'
  | 'bill'
  | 'entity'
  | 'document'
  | 'vault_entry'
  | 'shared_link'
  | 'action'
  | 'account'
  | 'insurance_policy'
  | 'insurance_claim'
  | 'correspondence'
  | 'bank_connection'
  | 'government_filing'
  | string;

interface AuditLogOptions {
  /** IP address of the request */
  ip?: string;
  /** User agent string */
  userAgent?: string;
  /** Additional metadata (amounts, file names, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Record an audit event in the Event table.
 *
 * @param userId - The user performing the action (null for system events)
 * @param eventType - The type of event (e.g. 'statement.uploaded')
 * @param entityType - The type of entity affected (e.g. 'bank_statement')
 * @param entityId - The ID of the affected entity
 * @param options - Additional options (ip, userAgent, metadata)
 */
export async function auditLog(
  userId: string | null,
  eventType: AuditEventType,
  entityType: AuditEntityType,
  entityId: string,
  options: AuditLogOptions = {}
): Promise<void> {
  try {
    const payload: Record<string, unknown> = {
      ...options.metadata,
    };

    if (options.ip) payload._ip = options.ip;
    if (options.userAgent) payload._userAgent = options.userAgent;
    payload._timestamp = new Date().toISOString();

    await prisma.event.create({
      data: {
        userId,
        eventType,
        entityType,
        entityId,
        payload: payload as any,
      },
    });
  } catch (error) {
    // Audit logging should never break the main flow
    console.error(`[Audit] Failed to log event: ${eventType}`, error);
  }
}

/**
 * Batch record multiple audit events at once.
 */
export async function auditLogBatch(
  events: Array<{
    userId: string | null;
    eventType: AuditEventType;
    entityType: AuditEntityType;
    entityId: string;
    options?: AuditLogOptions;
  }>
): Promise<void> {
  try {
    await prisma.event.createMany({
      data: events.map(e => ({
        userId: e.userId,
        eventType: e.eventType,
        entityType: e.entityType,
        entityId: e.entityId,
        payload: {
          ...e.options?.metadata,
          _ip: e.options?.ip,
          _timestamp: new Date().toISOString(),
        },
      })),
    });
  } catch (error) {
    console.error('[Audit] Failed to log batch events', error);
  }
}
