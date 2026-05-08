/**
 * ============================================================================
 * TEST PAYMENT GATEWAY - SUCCESS MODE
 * ============================================================================
 * 
 * PURPOSE:
 * This is a temporary test payment gateway that simulates a successful payment.
 * It should ONLY be used for testing purposes during development.
 * 
 * HOW TO USE:
 * 1. In your payment form, set the gateway URL to: /api/payment/test-success
 * 2. The payment will always succeed immediately
 * 3. User will be redirected to: /booking/success?code={confirmationCode}
 * 
 * HOW TO REMOVE (when ready for production):
 * 1. Delete this file: /workspace/app/api/payment/test-success/route.ts
 * 2. Delete the folder: /workspace/app/api/payment/test-success/
 * 3. Remove any references to this endpoint in your payment forms
 * 4. Update payment configuration to use real payment gateway (e.g., ZarinPal)
 * 
 * SECURITY WARNING:
 * - DO NOT use this in production
 * - DO NOT commit this file to production branches
 * - Add this path to .gitignore if keeping for local testing only
 * ============================================================================
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { db } from '@/src/db';
import { payments, reservations } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const confirmationCode = searchParams.get('code');
    const amount = searchParams.get('amount');

    if (!confirmationCode) {
      return NextResponse.redirect(
        new URL('/booking/error?message=missing_confirmation_code', request.url)
      );
    }

    // Verify user is logged in
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.redirect(
        new URL('/auth/login', request.url)
      );
    }

    // Find the reservation
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.confirmationCode, confirmationCode),
    });

    if (!reservation) {
      return NextResponse.redirect(
        new URL('/booking/error?message=reservation_not_found', request.url)
      );
    }

    // Create a test payment record with success status
    const [payment] = await db
      .insert(payments)
      .values({
        authority: `test_success_${Date.now()}`,
        amount: Number(amount || reservation.totalSalesPrice),
        status: 'verified',
        reservationId: reservation.id,
        userId: parseInt(session.user.id),
        description: `رزرو هتل ${reservation.propertyName} - پرداخت تستی موفق`,
        feeType: 'fixed',
        fee: 0,
        refId: 'TEST_SUCCESS_' + Date.now(),
        verifiedAt: new Date(),
        gatewayResponse: {
          code: 100,
          message: 'پرداخت با موفقیت انجام شد (تستی)',
          refId: 'TEST_' + Date.now(),
          isTest: true,
        },
      })
      .returning();

    // Update reservation status to booked
    await db
      .update(reservations)
      .set({ status: 'booked' })
      .where(eq(reservations.id, reservation.id));

    console.log('[TEST PAYMENT] Successful payment simulated:', {
      confirmationCode,
      paymentId: payment.id,
      amount: payment.amount,
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/booking/success?code=${confirmationCode}&test_mode=true`, request.url)
    );
  } catch (error) {
    console.error('[TEST PAYMENT] Error:', error);
    return NextResponse.redirect(
      new URL('/booking/error?message=test_payment_error', request.url)
    );
  }
}

export async function POST(request: NextRequest) {
  // For POST requests, redirect to GET with parameters
  const body = await request.json();
  const { confirmationCode, amount } = body;
  
  const url = new URL(request.url);
  url.pathname = '/api/payment/test-success';
  url.searchParams.set('code', confirmationCode);
  url.searchParams.set('amount', String(amount));
  
  return NextResponse.redirect(url);
}
