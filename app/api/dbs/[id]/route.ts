import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dbs/[id] — get single application
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const application = await (prisma as any).dbsApplication.findFirst({
      where: { id: params.id, userId },
    });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ application });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load application' }, { status: 500 });
  }
}

// PUT /api/dbs/[id] — update application (draft only, or admin status updates)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    const existing = await (prisma as any).dbsApplication.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only allow editing draft applications (or status updates)
    if (existing.status !== 'draft' && !body.status) {
      return NextResponse.json({ error: 'Can only edit draft applications' }, { status: 400 });
    }

    const updateData: any = {};

    // Personal details (only for drafts)
    if (existing.status === 'draft') {
      const editableFields = [
        'checkType', 'workforce', 'title', 'firstName', 'middleNames', 'lastName',
        'previousNames', 'dateOfBirth', 'placeOfBirth', 'gender', 'nationality',
        'countryOfBirth', 'email', 'phone', 'niNumber',
        'addressLine1', 'addressLine2', 'city', 'county', 'postcode', 'country', 'addressFrom',
        'previousAddresses', 'organisationName', 'roleTitle', 'roleStartDate', 'notes',
      ];
      for (const field of editableFields) {
        if (body[field] !== undefined) {
          if (['dateOfBirth', 'addressFrom', 'roleStartDate'].includes(field) && body[field]) {
            updateData[field] = new Date(body[field]);
          } else {
            updateData[field] = body[field];
          }
        }
      }
    }

    // Status transitions
    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        draft: ['submitted', 'cancelled'],
        submitted: ['processing', 'awaiting_id', 'cancelled'],
        processing: ['awaiting_id', 'completed', 'rejected'],
        awaiting_id: ['processing', 'completed', 'rejected'],
        completed: [],
        rejected: ['draft'], // Allow resubmission
        cancelled: ['draft'], // Allow resubmission
      };

      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json({
          error: `Cannot transition from '${existing.status}' to '${body.status}'`,
        }, { status: 400 });
      }

      updateData.status = body.status;
      if (body.status === 'submitted') updateData.submittedAt = new Date();
      if (body.status === 'completed') {
        updateData.completedAt = new Date();
        if (body.certificateNumber) updateData.certificateNumber = body.certificateNumber;
        if (body.issueDate) updateData.issueDate = new Date(body.issueDate);
      }
    }

    // Provider fields (for webhook/admin updates)
    if (body.providerRef) updateData.providerRef = body.providerRef;
    if (body.providerStatus) updateData.providerStatus = body.providerStatus;
    if (body.providerData) updateData.providerData = body.providerData;
    if (body.adminNotes !== undefined) updateData.adminNotes = body.adminNotes;
    if (body.paid !== undefined) updateData.paid = body.paid;

    const updated = await (prisma as any).dbsApplication.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ application: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update application' }, { status: 500 });
  }
}

// DELETE /api/dbs/[id] — delete draft application
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const existing = await (prisma as any).dbsApplication.findFirst({
      where: { id: params.id, userId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (existing.status !== 'draft' && existing.status !== 'cancelled') {
      return NextResponse.json({ error: 'Can only delete draft or cancelled applications' }, { status: 400 });
    }
    await (prisma as any).dbsApplication.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete application' }, { status: 500 });
  }
}
