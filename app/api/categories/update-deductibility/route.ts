import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// Default deductibility percentages for UK business expenses
const DEDUCTIBILITY_DEFAULTS: Record<string, number> = {
  // 100% deductible business expenses
  'Office Costs': 100,
  'Stationery': 100,
  'Software': 100,
  'Office Supplies': 100,
  'Professional': 100,
  'Accountant': 100,
  'Legal': 100,
  'Consulting': 100,
  'Advertising': 100,
  'Marketing': 100,
  'Bank Charges': 100,
  'Bank Fees': 100,
  'Staff': 100,
  'Wages': 100,
  'Salary': 100,
  'PAYE': 100,
  'Pension': 100,
  'Inventory': 100,
  'Stock': 100,
  'Goods': 100,
  'Resale': 100,
  'Premises': 100,
  'Rent': 100,
  'Office Rent': 100,
  'Rates': 100,
  
  // Partially deductible (mixed use common)
  'Utilities': 50,
  'Telecoms': 50,
  'Internet': 50,
  'Phone': 50,
  'Travel': 100,
  'Transport': 75,
  'Uber': 75,
  'Taxi': 75,
  'Train': 75,
  'TFL': 75,
  'Fuel': 50,
  'Vehicle': 50,
  'Car': 50,
  'Van': 100,
  'Petrol': 50,
  'Diesel': 50,
  'MOT': 50,
  'Car Insurance': 50,
  'Car park': 75,
  
  // Non-deductible personal expenses
  'Council Tax': 0,
  'Insurance': 0,
  'Subscriptions': 0,
  'Groceries': 0,
  'Housing': 0,
  'Healthcare': 0,
  'Entertainment': 0,
  'TV License': 0,
  'Shopping': 0,
  'Personal': 0,
  'Clothing': 0,
  'Food': 0,
  'Dining': 0,
  'Coffee': 0,
  'Takeaway': 0,
  'Amazon': 0,
  
  // Work clothing can be deductible if uniform
  'Uniform': 100,
  'Workwear': 100,
  
  // Other
  'Other Expenses': 50,
  'Miscellaneous': 50,
};

export async function POST(request: NextRequest) {
  try {
    await requireUserId();
    const categories = await prisma.category.findMany();
    const updates: { id: string; name: string; oldPercent: number; newPercent: number }[] = [];
    
    for (const cat of categories) {
      // Find matching deductibility from our defaults
      let newPercent = cat.defaultDeductibilityPercent;
      
      // Check for exact match first
      if (DEDUCTIBILITY_DEFAULTS[cat.name] !== undefined) {
        newPercent = DEDUCTIBILITY_DEFAULTS[cat.name];
      } else {
        // Check for partial match
        for (const [keyword, percent] of Object.entries(DEDUCTIBILITY_DEFAULTS)) {
          if (cat.name.toLowerCase().includes(keyword.toLowerCase()) || 
              keyword.toLowerCase().includes(cat.name.toLowerCase())) {
            newPercent = percent;
            break;
          }
        }
      }
      
      // If type is income, set to 0 (income is not an expense)
      if (cat.type === 'income') {
        newPercent = 0;
      }
      
      // Update if different
      if (newPercent !== cat.defaultDeductibilityPercent) {
        await prisma.category.update({
          where: { id: cat.id },
          data: { defaultDeductibilityPercent: newPercent },
        });
        updates.push({
          id: cat.id,
          name: cat.name,
          oldPercent: cat.defaultDeductibilityPercent,
          newPercent,
        });
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Updated ${updates.length} categories`,
      updates,
    });
  } catch (error) {
    console.error('Error updating deductibility:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function GET() {
  try {
    await requireUserId();
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        defaultDeductibilityPercent: true,
      },
      orderBy: { name: 'asc' },
    });
    
    return NextResponse.json({ categories, defaults: DEDUCTIBILITY_DEFAULTS });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
