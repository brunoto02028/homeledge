import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET - Get taxpayer profile (there should only be one)
export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    let profile = await prisma.taxpayerProfile.findFirst({ where: { userId: { in: userIds } } });

    if (!profile) {
      // Create default profile if none exists
      profile = await prisma.taxpayerProfile.create({
        data: {
          userId,
          accountingBasis: 'Cash Basis',
          country: 'United Kingdom',
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching taxpayer profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// PUT - Update taxpayer profile
export async function PUT(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const data = await request.json();

    let profile = await prisma.taxpayerProfile.findFirst({ where: { userId: { in: userIds } } });

    if (!profile) {
      profile = await prisma.taxpayerProfile.create({
        data: {
          ...data,
          userId,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          accountingPeriodStart: data.accountingPeriodStart ? new Date(data.accountingPeriodStart) : null,
          accountingPeriodEnd: data.accountingPeriodEnd ? new Date(data.accountingPeriodEnd) : null,
        },
      });
    } else {
      profile = await prisma.taxpayerProfile.update({
        where: { id: profile.id },
        data: {
          // Personal Details
          fullName: data.fullName !== undefined ? data.fullName : profile.fullName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : profile.dateOfBirth,
          nationalInsuranceNumber: data.nationalInsuranceNumber !== undefined ? data.nationalInsuranceNumber : profile.nationalInsuranceNumber,
          utr: data.utr !== undefined ? data.utr : profile.utr,
          // Address
          addressLine1: data.addressLine1 !== undefined ? data.addressLine1 : profile.addressLine1,
          addressLine2: data.addressLine2 !== undefined ? data.addressLine2 : profile.addressLine2,
          city: data.city !== undefined ? data.city : profile.city,
          postcode: data.postcode !== undefined ? data.postcode : profile.postcode,
          country: data.country !== undefined ? data.country : profile.country,
          residencyStatus: data.residencyStatus !== undefined ? data.residencyStatus : profile.residencyStatus,
          // Company Details
          companyName: data.companyName !== undefined ? data.companyName : profile.companyName,
          tradingName: data.tradingName !== undefined ? data.tradingName : profile.tradingName,
          companyRegistrationNumber: data.companyRegistrationNumber !== undefined ? data.companyRegistrationNumber : profile.companyRegistrationNumber,
          companyUtr: data.companyUtr !== undefined ? data.companyUtr : profile.companyUtr,
          vatRegistrationNumber: data.vatRegistrationNumber !== undefined ? data.vatRegistrationNumber : profile.vatRegistrationNumber,
          registeredAddress: data.registeredAddress !== undefined ? data.registeredAddress : profile.registeredAddress,
          tradingAddress: data.tradingAddress !== undefined ? data.tradingAddress : profile.tradingAddress,
          accountingPeriodStart: data.accountingPeriodStart ? new Date(data.accountingPeriodStart) : profile.accountingPeriodStart,
          accountingPeriodEnd: data.accountingPeriodEnd ? new Date(data.accountingPeriodEnd) : profile.accountingPeriodEnd,
          // Agent Details
          agentName: data.agentName !== undefined ? data.agentName : profile.agentName,
          agentReferenceNumber: data.agentReferenceNumber !== undefined ? data.agentReferenceNumber : profile.agentReferenceNumber,
          agentUtr: data.agentUtr !== undefined ? data.agentUtr : profile.agentUtr,
          agentEmail: data.agentEmail !== undefined ? data.agentEmail : profile.agentEmail,
          agentPhone: data.agentPhone !== undefined ? data.agentPhone : profile.agentPhone,
          hasAgentAuthority: data.hasAgentAuthority !== undefined ? data.hasAgentAuthority : profile.hasAgentAuthority,
          // Settings
          accountingBasis: data.accountingBasis !== undefined ? data.accountingBasis : profile.accountingBasis,
          isVatRegistered: data.isVatRegistered !== undefined ? data.isVatRegistered : profile.isVatRegistered,
          vatScheme: data.vatScheme !== undefined ? data.vatScheme : profile.vatScheme,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error updating taxpayer profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
