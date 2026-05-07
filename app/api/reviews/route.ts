import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/lib/auth';
import { db } from '@/src/db';
import { hotelReviews, reservations } from '@/src/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET - Fetch reviews for a property
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const propertyId = searchParams.get('property_id');
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    const reviews = await db.query.hotelReviews.findMany({
      where: and(
        eq(hotelReviews.propertyId, parseInt(propertyId)),
        eq(hotelReviews.isApproved, true)
      ),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [desc(hotelReviews.createdAt)],
    });

    // Check which users have stayed at this property
    const userIds = reviews.map(r => r.userId);
    const stayedReservations = await db.query.reservations.findMany({
      where: and(
        eq(reservations.propertyId, parseInt(propertyId)),
        eq(reservations.status, 'booked'),
      ),
    });

    const stayedUserIds = new Set(stayedReservations.map(r => r.userId));

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      stayedAtProperty: review.stayedAtProperty || stayedUserIds.has(review.userId),
      stayDate: review.stayDate,
      createdAt: review.createdAt,
      user: {
        firstName: review.user.firstName,
        lastName: review.user.lastName,
      },
    }));

    return NextResponse.json({
      code: 200,
      value: {
        reviews: formattedReviews,
        total: formattedReviews.length,
      },
    });
  } catch (error) {
    console.error('[Reviews API] Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST - Create a new review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { propertyId, reservationId, rating, title, comment, stayDate } = body;

    if (!propertyId || !rating || !comment) {
      return NextResponse.json(
        { error: 'Property ID, rating, and comment are required' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Check if user has stayed at this property (for badge)
    let stayedAtProperty = false;
    if (reservationId) {
      const reservation = await db.query.reservations.findFirst({
        where: and(
          eq(reservations.id, parseInt(reservationId)),
          eq(reservations.userId, parseInt(session.user.id))
        ),
      });
      
      if (reservation && reservation.status === 'booked') {
        stayedAtProperty = true;
      }
    }

    // Create the review
    const [newReview] = await db
      .insert(hotelReviews)
      .values({
        userId: parseInt(session.user.id),
        propertyId: parseInt(propertyId),
        reservationId: reservationId ? parseInt(reservationId) : null,
        rating,
        title: title || null,
        comment,
        stayedAtProperty,
        stayDate: stayDate || null,
        isApproved: true, // Auto-approve for now, can be changed later
        isVerified: stayedAtProperty,
      })
      .returning();

    return NextResponse.json({
      code: 201,
      value: { review: newReview },
    });
  } catch (error) {
    console.error('[Reviews API] Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
