'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface City {
  id: number;
  name: string;
  slug: string;
  image: string;
}

interface PopularCitiesProps {
  cities: City[];
}

export function PopularCities({ cities }: PopularCitiesProps) {
  return (
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
          {cities.map((city) => (
            <Link
              key={city.id}
              href={`/search?city_id=${city.id}`}
              className="group"
            >
              <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 h-full">
                <div className="relative h-32 w-full overflow-hidden">
                  <CityImage city={city} />
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
  );
}

function CityImage({ city }: { city: City }) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent && !parent.querySelector('.fallback-bg')) {
      const fallback = document.createElement('div');
      fallback.className = 'fallback-bg absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center';
      fallback.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-primary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>';
      parent.appendChild(fallback);
    }
  };

  return (
    <Image
      src={city.image}
      alt={city.name}
      fill
      className="object-cover transition-transform group-hover:scale-110"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
      onError={handleError}
    />
  );
}
