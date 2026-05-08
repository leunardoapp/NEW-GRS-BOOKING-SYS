'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star, User, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatJalaliDisplay } from '@/src/lib/jalali';
import { useRouter } from 'next/navigation';

interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  stayedAtProperty: boolean;
  stayDate: string | null;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

interface HotelReviewsProps {
  propertyId: number;
  propertyName: string;
}

export function HotelReviews({ propertyId, propertyName }: HotelReviewsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?property_id=${propertyId}`);
      const data = await response.json();
      if (data.value) {
        setReviews(data.value.reviews || []);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user) {
      router.push('/auth/login');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          rating,
          title,
          comment,
        }),
      });

      if (response.ok) {
        // Reset form and reload reviews
        setRating(5);
        setTitle('');
        setComment('');
        await fetchReviews();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '۰';

  return (
    <div className="space-y-6 mt-8">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">نظرات مهمانان</h2>
              <p className="text-muted-foreground">
                {reviews.length} نظر ثبت شده برای {propertyName}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{averageRating}</div>
              <div className="flex items-center gap-1 justify-center mt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.round(parseFloat(averageRating))
                        ? 'fill-primary text-primary'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {session?.user ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ثبت نظر جدید</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>امتیاز</Label>
                <div className="flex gap-2 mt-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i + 1)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          i < rating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label htmlFor="title">عنوان نظر (اختیاری)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً: اقامت عالی بود"
                />
              </div>
              
              <div>
                <Label htmlFor="comment">متن نظر *</Label>
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="تجربه خود را از اقامت در این هتل بنویسید..."
                  rows={4}
                  required
                />
              </div>
              
              <Button type="submit" disabled={submitting}>
                {submitting ? 'در حال ثبت...' : 'ثبت نظر'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              برای ثبت نظر باید وارد حساب کاربری خود شوید
            </p>
            <Button onClick={() => router.push('/auth/login')}>
              ورود به حساب
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">در حال بارگذاری نظرات...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">هنوز نظری ثبت نشده است</p>
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        {review.user.firstName} {review.user.lastName}
                      </div>
                      {review.stayedAtProperty && (
                        <Badge variant="secondary" className="mt-1">
                          <CheckCircle className="h-3 w-3 ml-1" />
                          اقامت کرده
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? 'fill-primary text-primary'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                {review.title && (
                  <div className="font-medium mb-2">{review.title}</div>
                )}
                
                <p className="text-muted-foreground whitespace-pre-line mb-3">
                  {review.comment}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {review.stayDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      اقامت: {formatJalaliDisplay(new Date(review.stayDate))}
                    </div>
                  )}
                  <div>
                    ثبت شده در: {formatJalaliDisplay(new Date(review.createdAt))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
