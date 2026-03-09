import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/dbs — list user's DBS applications
export async function GET() {
  try {
    const userId = await requireUserId();
    const applications = await (prisma as any).dbsApplication.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load applications' }, { status: 500 });
  }
}

// POST /api/dbs — create a new DBS application
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    const {
      checkType, workforce,
      title, firstName, middleNames, lastName, previousNames,
      dateOfBirth, placeOfBirth, gender, nationality, countryOfBirth,
      email, phone, niNumber,
      addressLine1, addressLine2, city, county, postcode, country, addressFrom,
      previousAddresses,
      organisationName, roleTitle, roleStartDate,
      notes,
    } = body;

    // Validate required fields
    if (!checkType || !firstName || !lastName || !dateOfBirth || !email || !addressLine1 || !city || !postcode) {
      return NextResponse.json({ error: 'Missing required fields: checkType, firstName, lastName, dateOfBirth, email, addressLine1, city, postcode' }, { status: 400 });
    }

    // Validate check type
    const validTypes = ['basic', 'standard', 'enhanced', 'enhanced_barred'];
    if (!validTypes.includes(checkType)) {
      return NextResponse.json({ error: 'Invalid check type' }, { status: 400 });
    }

    // Enhanced checks require workforce type
    if ((checkType === 'enhanced' || checkType === 'enhanced_barred') && !workforce) {
      return NextResponse.json({ error: 'Enhanced checks require workforce type (child, adult, other)' }, { status: 400 });
    }

    // Pricing (can be adjusted when provider is connected)
    const pricing: Record<string, number> = {
      basic: 18.00,
      standard: 26.00,
      enhanced: 44.00,
      enhanced_barred: 54.00,
    };
    const cost = pricing[checkType] || 0;
    const markup = 1.3; // 30% markup
    const chargedAmount = Math.round(cost * markup * 100) / 100;

    const application = await (prisma as any).dbsApplication.create({
      data: {
        userId,
        checkType,
        workforce: workforce || null,
        title: title || null,
        firstName,
        middleNames: middleNames || null,
        lastName,
        previousNames: previousNames || null,
        dateOfBirth: new Date(dateOfBirth),
        placeOfBirth: placeOfBirth || null,
        gender: gender || null,
        nationality: nationality || null,
        countryOfBirth: countryOfBirth || null,
        email,
        phone: phone || null,
        niNumber: niNumber || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        county: county || null,
        postcode,
        country: country || 'United Kingdom',
        addressFrom: addressFrom ? new Date(addressFrom) : null,
        previousAddresses: previousAddresses || null,
        organisationName: organisationName || null,
        roleTitle: roleTitle || null,
        roleStartDate: roleStartDate ? new Date(roleStartDate) : null,
        status: 'draft',
        cost,
        chargedAmount,
        notes: notes || null,
      },
    });

    return NextResponse.json({ application });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create application' }, { status: 500 });
  }
}
