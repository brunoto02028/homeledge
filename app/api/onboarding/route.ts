import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Check onboarding status
export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        employmentStatus: true,
        businessName: true,
        businessType: true,
        onboardingCompleted: true,
        locale: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch onboarding profile separately (uses new model)
    let onboardingProfile = null;
    try {
      onboardingProfile = await (prisma as any).onboardingProfile.findUnique({ where: { userId } });
    } catch { /* table may not exist yet */ }

    return NextResponse.json({ ...user, onboardingProfile });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PUT - Save onboarding data
export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const {
      fullName,
      phone,
      dateOfBirth,
      employmentStatus,
      businessName,
      businessType,
      onboardingCompleted,
      locale,
    } = body;

    const updateData: Record<string, unknown> = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (phone !== undefined) updateData.phone = phone;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (employmentStatus !== undefined) updateData.employmentStatus = employmentStatus;
    if (businessName !== undefined) updateData.businessName = businessName;
    if (businessType !== undefined) updateData.businessType = businessType;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;
    if (locale !== undefined) updateData.locale = locale;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        dateOfBirth: true,
        employmentStatus: true,
        businessName: true,
        businessType: true,
        onboardingCompleted: true,
        locale: true,
      },
    });

    // Save OnboardingProfile if wizard data provided
    const { entityType, selectedFeatures, experienceLevel } = body;
    if (entityType && selectedFeatures) {
      try {
        await (prisma as any).onboardingProfile.upsert({
          where: { userId },
          create: {
            userId,
            entityType,
            businessName: businessName || updated.businessName || null,
            selectedFeatures: selectedFeatures || [],
            experienceLevel: experienceLevel || 'beginner',
          },
          update: {
            entityType,
            businessName: businessName || updated.businessName || null,
            selectedFeatures: selectedFeatures || [],
            experienceLevel: experienceLevel || 'beginner',
            completedAt: new Date(),
          },
        });
      } catch (profileErr) {
        console.error('[Onboarding] Profile save failed (non-fatal):', profileErr);
      }
    }

    // Auto-create Entity when onboarding completes
    if (onboardingCompleted === true) {
      try {
        const existingEntities = await (prisma as any).entity.count({ where: { userId } });
        if (existingEntities === 0) {
          const resolvedEntityType = entityType || 'individual';
          const resolvedName = businessName || updated.businessName || fullName || updated.fullName || 'Personal';

          // Create entity based on wizard selection
          await (prisma as any).entity.create({
            data: {
              userId,
              name: resolvedEntityType === 'individual' ? (fullName || updated.fullName || 'Personal') : resolvedName,
              type: resolvedEntityType,
              isDefault: true,
            },
          });

          // If limited company, also create a personal entity
          if (['limited_company', 'cic_charity'].includes(resolvedEntityType)) {
            await (prisma as any).entity.create({
              data: {
                userId,
                name: fullName || updated.fullName || 'Personal',
                type: 'individual',
                isDefault: false,
              },
            });
          }
        }
      } catch (entityErr) {
        console.error('[Onboarding] Entity auto-creation failed (non-fatal):', entityErr);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Onboarding] Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
