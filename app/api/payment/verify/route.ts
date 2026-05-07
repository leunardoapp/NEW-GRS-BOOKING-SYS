import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { db } from '@/src/db';
import { payments, reservations } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { verifyPayment } from '@/src/lib/zarinpal';
import { bookReservation } from '@/src/lib/grs-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const authority = searchParams.get('Authority');
    const status = searchParams.get('Status');

    if (!authority) {
      return NextResponse.redirect(new URL('/booking/error?message=missing_authority', request.url));
    }

    // Find the payment
    const payment = await db.query.payments.findFirst({
      where: eq(payments.authority, authority),
    });

    if (!payment) {
      return NextResponse.redirect(new URL('/booking/error?message=payment_not_found', request.url));
    }

    // Get the reservation
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.id, payment.reservationId!),
    });

    if (!reservation) {
      return NextResponse.redirect(new URL('/booking/error?message=reservation_not_found', request.url));
    }

    if (status !== 'OK') {
      // Payment was cancelled
      await db
        .update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id));

      return NextResponse.redirect(
        new URL(`/booking/error?message=payment_cancelled&code=${reservation.confirmationCode}`, request.url)
      );
    }

    // Verify payment with ZarinPal
    const verifyResult = await verifyPayment({
      authority,
      amount: Number(payment.amount),
    });

    if (verifyResult.code !== 100 && verifyResult.code !== 101) {
      await db
        .update(payments)
        .set({ status: 'failed' })
        .where(eq(payments.id, payment.id));

      return NextResponse.redirect(
        new URL(`/booking/error?message=payment_verification_failed&code=${reservation.confirmationCode}`, request.url)
      );
    }

    // Update payment as verified
    await db
      .update(payments)
      .set({
        status: 'verified',
        refId: String(verifyResult.refId),
        cardHash: verifyResult.cardHash,
        cardNumber: verifyResult.cardPan,
        gatewayResponse: {
          code: verifyResult.code,
          refId: verifyResult.refId,
          cardHash: verifyResult.cardHash,
          cardPan: verifyResult.cardPan,
          fee: verifyResult.fee,
          feeType: verifyResult.feeType,
        },
        verifiedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    // Confirm the reservation in GRS
    try {
      await bookReservation(reservation.confirmationCode);
      
      await db
        .update(reservations)
        .set({ status: 'booked' })
        .where(eq(reservations.id, reservation.id));
    } catch (bookingError) {
      console.error('GRS booking confirmation failed:', bookingError);
      // Payment was successful but GRS booking failed - needs manual intervention
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/booking/success?code=${reservation.confirmationCode}`, request.url)
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.redirect(new URL('/booking/error?message=internal_error', request.url));
  }
}
