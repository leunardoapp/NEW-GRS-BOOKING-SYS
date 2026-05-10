import Link from 'next/link';
import { Hotel, Shield, Clock, Headphones, Star, MapPin, ShieldCheck, Zap, TrendingUp, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SearchForm } from '@/src/components/search-form';
import { PopularCities } from '@/src/components/popular-cities';
import { getCities, getProperties } from '@/src/lib/grs-client';
import Image from 'next/image';
import { formatPriceNumber } from '@/src/lib/jalali';
import { cn } from '@/lib/utils';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

async function FeaturedHotels() {
  try {
    const properties = await getProperties({ count: 8 });

    if (!properties || properties.length === 0) return null;

    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4 text-center md:text-right">
            <div>
              <h2 className="text-3xl font-black text-foreground mb-2 flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                هتل‌های منتخب یورزرو
              </h2>
              <p className="text-muted-foreground font-medium">بهترین اقامتگاه‌ها با تضمین قیمت و کیفیت</p>
            </div>
            <Button variant="outline" className="rounded-xl font-bold border-2" asChild>
              <Link href="/search" className="flex items-center gap-2">
                مشاهده همه هتل‌ها
                <Search className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {properties.map((hotel) => (
              <Link key={hotel.id} href={`/hotels/${hotel.id}`} className="group">
                <Card className="overflow-hidden h-full border-2 border-border/40 transition-all duration-500 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] hover:-translate-y-2 rounded-[2rem]">
                  <div className="relative h-56 w-full overflow-hidden bg-muted">
                    {hotel.main_image ? (
                      <Image
                        src={hotel.main_image.url}
                        alt={hotel.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Hotel className="h-16 w-16 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-white/95 backdrop-blur-md text-primary font-black px-3 py-1 rounded-xl shadow-lg border-none">
                        {hotel.stars} ستاره
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-widest mb-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{hotel.city_name}</span>
                    </div>
                    <h3 className="font-black text-lg text-foreground mb-4 line-clamp-1 group-hover:text-primary transition-colors leading-tight">
                      {hotel.name}
                    </h3>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed">
                      <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-black text-yellow-700">۴.۸</span>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] text-muted-foreground block font-bold mb-0.5">شروع قیمت از</span>
                        <span className="text-xl font-black text-primary">
                          {hotel.min_price ? formatPriceNumber(hotel.min_price) : 'استعلام'}
                          <span className="text-xs font-medium mr-1 opacity-70">تومان</span>
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
    );
  } catch (e) {
    return null;
  }
}

function HotelsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="flex justify-between mb-12"><Skeleton className="h-10 w-64" /><Skeleton className="h-10 w-32" /></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[400px] rounded-[2rem]" />)}
      </div>
    </div>
  );
}

export default async function HomePage() {
  // Fetch dynamic data for cities
  let cities = [];
  try {
    cities = await getCities();
  } catch (error) {
    console.error('Failed to fetch cities:', error);
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
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <Hotel className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-black tracking-tighter">یورزرو</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/search" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">جستجوی هتل</Link>
            <Link href="/about" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">درباره ما</Link>
            <Link href="/contact" className="text-sm font-bold text-muted-foreground hover:text-primary transition-colors">تماس با ما</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="rounded-xl font-bold" asChild>
              <Link href="/auth/login">ورود</Link>
            </Button>
            <Button className="rounded-xl font-bold shadow-lg shadow-primary/10 px-6" asChild>
              <Link href="/auth/register">ثبت نام</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-slate-950">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-transparent to-slate-950 z-10" />
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
            <Image
                src="https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=2070"
                alt="Luxury Hotel"
                fill
                className="object-cover opacity-50 mix-blend-overlay"
                priority
            />
        </div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <Badge className="mb-8 bg-white/10 text-white border-white/20 py-2 px-6 rounded-full text-xs font-black backdrop-blur-xl tracking-[0.2em] shadow-2xl">
                HOTEL RESERVATION SYSTEM
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 leading-[1.1] tracking-tight text-balance">
              آغاز یک سفر <span className="text-primary italic">فراموش‌نشدنی</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-medium max-w-2xl mx-auto text-pretty leading-relaxed">
              با یورزرو، لوکس‌ترین هتل‌های ایران را با قیمتی استثنایی و تایید آنی رزرو کنید.
            </p>
          </div>

          <SearchForm variant="home" />

          <div className="mt-16 flex flex-wrap justify-center gap-10 md:gap-24 opacity-60">
             <div className="flex items-center gap-3 text-white group cursor-default">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 transition-colors border border-white/10"><ShieldCheck className="h-6 w-6 text-primary" /></div>
                <span className="font-black text-sm tracking-wide">تضمین امنیت</span>
             </div>
             <div className="flex items-center gap-3 text-white group cursor-default">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 transition-colors border border-white/10"><Zap className="h-6 w-6 text-primary" /></div>
                <span className="font-black text-sm tracking-wide">تایید آنی</span>
             </div>
             <div className="flex items-center gap-3 text-white group cursor-default">
                <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 transition-colors border border-white/10"><Headphones className="h-6 w-6 text-primary" /></div>
                <span className="font-black text-sm tracking-wide">پشتیبانی ۲۴/۷</span>
             </div>
          </div>
        </div>
      </section>

      {/* Popular Cities */}
      <PopularCities cities={popularCitiesData} />

      {/* Featured Hotels */}
      <Suspense fallback={<HotelsSkeleton />}>
        <FeaturedHotels />
      </Suspense>

      {/* Why Us section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-foreground mb-6">چرا یورزرو را انتخاب کنید؟</h2>
            <p className="text-muted-foreground text-lg font-medium leading-relaxed">
              ما با تکیه بر فناوری‌های نوین و حذف واسطه‌ها، پلی مستقیم میان شما و برترین هتل‌های کشور ساخته‌ایم.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { icon: ShieldCheck, title: "پرداخت امن", desc: "تراکنش‌های شما با استانداردهای جهانی بانکی محافظت می‌شود.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Zap, title: "رزرو فوری", desc: "واچر هتل بلافاصله پس از پرداخت به صورت خودکار صادر می‌گردد.", color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: Headphones, title: "همیشه همراه", desc: "تیم پشتیبانی ما در تمامی مراحل سفر در کنار شما خواهد بود.", color: "text-orange-500", bg: "bg-orange-500/10" },
              { icon: TrendingUp, title: "کمترین نرخ", desc: "ما تضمین می‌کنیم که بهترین قیمت موجود در بازار را ارائه می‌دهیم.", color: "text-purple-500", bg: "bg-purple-500/10" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 transform transition-transform hover:rotate-6", item.bg)}>
                  <item.icon className={cn("h-10 w-10", item.color)} />
                </div>
                <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-primary/60 opacity-90" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/20 rounded-full blur-[100px]" />

        <div className="container mx-auto px-4 relative z-10 text-center text-white">
          <h2 className="text-4xl md:text-6xl font-black mb-8">
            همین امروز سفر خود را آغاز کنید
          </h2>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-medium opacity-90 leading-relaxed">
            با ثبت نام در یورزرو، از تخفیف‌های ویژه اعضا و پیشنهادات اختصاصی هتل‌ها بهره‌مند شوید.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Button size="xl" variant="secondary" className="px-10 rounded-2xl shadow-2xl hover:scale-105 transition-transform font-black" asChild>
              <Link href="/auth/register">عضویت رایگان</Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              className="px-10 rounded-2xl bg-white/10 border-white/30 text-white hover:bg-white hover:text-primary backdrop-blur-md transition-all font-black"
              asChild
            >
              <Link href="/search">جستجوی هوشمند</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t border-border/40 py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="p-2 bg-primary rounded-xl">
                  <Hotel className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="text-2xl font-black tracking-tighter">یورزرو</span>
              </Link>
              <p className="text-muted-foreground font-medium leading-relaxed">
                جامع‌ترین سامانه رزرواسیون هتل‌های ایران با اتصال مستقیم به سیستم‌های مرکزی هتلداری.
              </p>
            </div>

            {[
              { title: "دسترسی سریع", links: ["جستجوی هتل", "پنل کاربری", "درباره ما"] },
              { title: "پشتیبانی", links: ["سوالات متداول", "تماس با ما", "قوانین"] },
              { title: "تماس", links: ["۰۲۱-۱۲۳۴۵۶۷۸", "info@youreserve.ir"] }
            ].map((col, i) => (
              <div key={i}>
                <h4 className="text-lg font-black mb-6">{col.title}</h4>
                <ul className="space-y-4">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <Link href="#" className="text-muted-foreground font-medium hover:text-primary transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 mt-16 pt-8 text-center text-sm font-bold text-muted-foreground">
            <p>تمامی حقوق این وب‌سایت متعلق به یورزرو می‌باشد - {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
