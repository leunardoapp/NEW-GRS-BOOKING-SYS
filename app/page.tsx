import Link from 'next/link';
import { Hotel, Shield, Clock, Headphones, Star, MapPin, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchForm } from '@/src/components/search-form';
import Image from 'next/image';

// Popular cities for quick access
const POPULAR_CITIES = [
  { id: 1, name: 'تهران', slug: 'tehran', image: '/cities/tehran.webp' },
  { id: 2, name: 'اصفهان', slug: 'isfahan', image: '/cities/isfahan.webp' },
  { id: 3, name: 'شیراز', slug: 'shiraz', image: '/cities/shiraz.webp' },
  { id: 4, name: 'مشهد', slug: 'mashhad', image: '/cities/mashhad.webp' },
  { id: 5, name: 'تبریز', slug: 'tabriz', image: '/cities/tabriz.webp' },
  { id: 6, name: 'یزد', slug: 'yazd', image: '/cities/yazd.webp' },
];

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

export default function HomePage() {
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
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                شهرهای محبوب
              </h2>
              <p className="text-muted-foreground mt-1">
                محبوب‌ترین مقاصد گردشگری ایران
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/search" className="flex items-center gap-1">
                مشاهده همه
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_CITIES.map((city) => (
              <Link
                key={city.id}
                href={`/search?city_id=${city.id}`}
                className="group"
              >
                <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 h-full">
                  <div className="relative h-32 w-full overflow-hidden">
                    <Image
                      src={city.image}
                      alt={city.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      onError={(e) => {
                        // Fallback to gradient if image not found
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-bg')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback-bg absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center';
                          fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  </div>
                  <CardContent className="p-3 text-center">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {city.name}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              چرا یورزرو؟
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              ما با ارائه بهترین خدمات، تجربه‌ای متفاوت از رزرو هتل را برای شما فراهم می‌کنیم
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-8 pb-6">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            همین الان سفر خود را برنامه‌ریزی کنید
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            با ثبت نام در یورزرو، از تخفیف‌های ویژه و پیشنهادات اختصاصی بهره‌مند شوید
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">ثبت نام رایگان</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <Link href="/search">جستجوی هتل</Link>
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
