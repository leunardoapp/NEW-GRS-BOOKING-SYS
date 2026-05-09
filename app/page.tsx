import Link from 'next/link';
import { Hotel, Shield, Clock, Headphones, Star, MapPin, ShieldCheck, Zap, TrendingUp, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SearchForm } from '@/src/components/search-form';
import { PopularCities } from '@/src/components/popular-cities';
import { getCities, getProperties } from '@/src/lib/grs-client';
import Image from 'next/image';
import { formatPriceNumber } from '@/src/lib/jalali';

const FEATURES = [
  {
    icon: Shield,
    title: 'تضمین بهترین قیمت',
    description: 'ما بهترین قیمت‌ها را برای شما تضمین می‌کنیم',
  },
  {
    icon: Clock,
    title: 'رزرو آنی',
    description: 'رزرو آنلاین و فوری بدون نیاز به تماس تلفنی',
  },
  {
    icon: Headphones,
    title: 'پشتیبانی ۲۴/۷',
    description: 'تیم پشتیبانی ما همیشه در دسترس شماست',
  },
  {
    icon: Star,
    title: 'هتل‌های منتخب',
    description: 'فقط بهترین هتل‌ها با بالاترین امتیاز',
  },
];

export default async function HomePage() {
  // Fetch dynamic data with error handling
  let cities = [];
  let properties = [];
  try {
    cities = await getCities();
    properties = await getProperties({ count: 8 });
  } catch (error) {
    console.error('Failed to fetch dynamic data:', error);
  }

  const popularCitiesData = cities.length > 0
    ? cities.slice(0, 6).map(city => ({
        id: city.id,
        name: city.name,
        slug: city.slug,
        image: `/cities/${city.slug}.webp`
      }))
    : [
        { id: 1, name: 'تهران', slug: 'tehran', image: '/cities/tehran.webp' },
        { id: 2, name: 'اصفهان', slug: 'isfahan', image: '/cities/isfahan.webp' },
        { id: 3, name: 'شیراز', slug: 'shiraz', image: '/cities/shiraz.webp' },
        { id: 4, name: 'مشهد', slug: 'mashhad', image: '/cities/mashhad.webp' },
        { id: 5, name: 'تبریز', slug: 'tabriz', image: '/cities/tabriz.webp' },
        { id: 6, name: 'یزد', slug: 'yazd', image: '/cities/yazd.webp' },
      ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Hotel className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">یورزرو</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/search"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              جستجوی هتل
            </Link>
            <Link
              href="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              درباره ما
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              تماس با ما
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">ورود</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/register">ثبت نام</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-primary/5 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              رزرو آنلاین هتل در سراسر ایران
            </h1>
            <p className="text-lg text-muted-foreground text-pretty">
              بهترین قیمت‌ها، امکانات رفاهی عالی و پشتیبانی ۲۴ ساعته.
              سفر خود را با یورزرو شروع کنید.
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-5xl mx-auto">
            <SearchForm variant="hero" />
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <PopularCities cities={popularCitiesData} />

      {/* Featured Hotels */}
      {properties.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground">هتل‌های منتخب</h2>
                <p className="text-muted-foreground mt-1">بهترین هتل‌ها با بالاترین تخفیف</p>
              </div>
              <Button variant="ghost" asChild>
                <Link href="/search" className="flex items-center gap-1">
                  مشاهده همه هتل‌ها
                  <Search className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {properties.map((hotel) => (
                <Link key={hotel.id} href={`/hotels/${hotel.id}`} className="group">
                  <Card className="overflow-hidden h-full border border-border/50 transition-all hover:shadow-xl hover:-translate-y-1">
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      {hotel.main_image ? (
                        <Image
                          src={hotel.main_image.url}
                          alt={hotel.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Hotel className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-white/90 backdrop-blur-sm text-primary hover:bg-white">
                          {hotel.stars} ستاره
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{hotel.city_name}</span>
                      </div>
                      <h3 className="font-bold text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors">
                        {hotel.name}
                      </h3>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="text-sm font-medium">۴.۸</span>
                        </div>
                        <div className="text-left">
                          <span className="text-xs text-muted-foreground block">از</span>
                          <span className="text-lg font-bold text-primary">
                            {hotel.min_price ? formatPriceNumber(hotel.min_price) : 'استعلام'}
                            <span className="text-[10px] font-normal mr-1">تومان</span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Us section with modern grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">چرا یورزرو؟</h2>
            <p className="text-muted-foreground text-pretty">
              ما با تمرکز بر تجربه کاربری مدرن و اتصال مستقیم به سیستم‌های هتلداری، بهترین تجربه رزرو را برای شما رقم می‌زنیم.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="pt-0 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 transform rotate-3 hover:rotate-0 transition-transform">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">امنیت پرداخت</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  تمامی تراکنش‌ها در بستر امن و با تضمین بازگشت وجه در صورت کنسلی طبق قوانین انجام می‌شود.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="pt-0 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 transform -rotate-3 hover:rotate-0 transition-transform">
                  <Zap className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">رزرو آنی</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  تایید رزرو شما در کمتر از یک دقیقه و صدور واچر آنی بدون نیاز به تایید دستی.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="pt-0 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 transform rotate-6 hover:rotate-0 transition-transform">
                  <Headphones className="h-8 w-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">پشتیبانی ۲۴ ساعته</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  تیم پشتیبانی ما در تمام روزهای هفته، حتی ایام تعطیل، پاسخگوی سوالات شماست.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="pt-0 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 transform -rotate-6 hover:rotate-0 transition-transform">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold mb-3">بهترین نرخ بازار</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ما همواره تلاش می‌کنیم با حذف واسطه‌ها، کمترین قیمت ممکن را برای هتل‌ها ارائه دهیم.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-primary-foreground mb-6">
            سفر رویایی شما از اینجا شروع می‌شود
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-10 max-w-2xl mx-auto font-medium">
            همین حالا عضو خانواده بزرگ یورزرو شوید و از تخفیف‌های ویژه اولین سفر خود بهره‌مند شوید.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="xl" variant="secondary" className="px-8 shadow-xl hover:scale-105 transition-transform" asChild>
              <Link href="/auth/register">ساخت حساب کاربری رایگان</Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="px-8 bg-white/10 border-white/20 text-primary-foreground hover:bg-white hover:text-primary backdrop-blur-sm transition-all"
              asChild
            >
              <Link href="/search">جستجوی هتل‌ها</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary rounded-lg">
                  <Hotel className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">یورزرو</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                سامانه رزرو آنلاین هتل در سراسر ایران
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">دسترسی سریع</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/search" className="text-muted-foreground hover:text-foreground">
                    جستجوی هتل
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                    پنل کاربری
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-foreground">
                    درباره ما
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">پشتیبانی</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                    سوالات متداول
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                    تماس با ما
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                    قوانین و مقررات
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">تماس</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li dir="ltr" className="text-left">۰۲۱-۱۲۳۴۵۶۷۸</li>
                <li dir="ltr" className="text-left">info@youreserve.ir</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>تمامی حقوق محفوظ است - یورزرو {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
