/**
 * Public Leads API
 * POST: Submit user lead form (public, no authentication required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createLeadSchema, type CreateLeadInput } from '@/lib/validation/lead.validation';

/**
 * POST /api/leads
 * Submit a new user lead form (public endpoint)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validationResult = createLeadSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid form data',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data: CreateLeadInput = validationResult.data;

    // Create the user lead
    const lead = await prisma.userLead.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        age: data.age,
        monthlyIncome: data.monthlyIncome,
        monthlyExpenses: data.monthlyExpenses,
        familyExpenses: data.familyExpenses,
        financialGoals: data.financialGoals,
        currentSavings: data.currentSavings ?? null,
        investmentExperience: data.investmentExperience ?? null,
        riskTolerance: data.riskTolerance ?? null,
        investmentHorizon: data.investmentHorizon ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Form submitted successfully',
        data: { id: lead.id },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error submitting lead form:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to submit form. Please try again.' },
      { status: 500 }
    );
  }
}
