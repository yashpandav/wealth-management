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

    // Check if lead with this email already exists
    const existingLead = await prisma.userLead.findFirst({
      where: { email: data.email },
    });

    if (existingLead) {
      // Update existing lead instead of creating duplicate
      const updatedLead = await prisma.userLead.update({
        where: { id: existingLead.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          leadSource: data.leadSource,
          rmReference: data.rmReference || null,
          status: 'NEW', // Reset to NEW on resubmission
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Lead information updated successfully',
          data: { id: updatedLead.id },
        },
        { status: 200 }
      );
    }

    // Create new lead
    const lead = await prisma.userLead.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        leadSource: data.leadSource,
        rmReference: data.rmReference || null,
        status: 'NEW',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Lead submitted successfully',
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
