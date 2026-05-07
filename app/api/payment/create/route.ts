import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { db } from '@/src/db';
import { payments, reservations } from '@/src/db/schema';
import { eq } from 'drizzle-orm';
import { requestPayment } from '@/src/lib/zarinpal';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmationCode, amount } = body;

    if (!confirmationCode || !amount) {
      return NextResponse.json(
        { error: 'confirmationCode and amount are required' },
        { status: 400 }
      );
    }

    // Find the reservation
    const reservation = await db.query.reservations.findFirst({
      where: eq(reservations.confirmationCode, confirmationCode),
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Check if user owns this reservation
    if (reservation.userId !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create payment request to ZarinPal
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payment/verify`;
    
    const paymentResult = await requestPayment({
      amount: Number(reservation.totalSalesPrice),
      description: `رزرو هتل ${reservation.propertyName} - کد: ${confirmationCode}`,
      email: reservation.bookerEmail,
      mobile: reservation.bookerPhone,
      callbackUrl,
    });

    // Save payment record
    const [payment] = await db
      .insert(payments)
      .values({
        authority: paymentResult.authority,
        amount: Number(reservation.totalSalesPrice),
        status: 'pending',
        reservationId: reservation.id,
        userId: parseInt(session.user.id),
        description: `رزرو هتل ${reservation.propertyName}`,
        feeType: paymentResult.feeType,
        fee: paymentResult.fee,
      })
      .returning();

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      authority: paymentResult.authority,
      paymentUrl: paymentResult.paymentUrl,
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
