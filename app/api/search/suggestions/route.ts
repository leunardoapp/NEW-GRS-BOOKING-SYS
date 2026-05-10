import { NextRequest, NextResponse } from 'next/server';
import { getCities, getProperties } from '@/src/lib/grs-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  // Return empty if query is too short, but handle cases where user clicks search bar (could show defaults)
  if (!query || query.length < 2) {
    return NextResponse.json({ cities: [], hotels: [] });
  }

  try {
    // Fetch cities and properties
    // For cities, we fetch all (they are usually cached or small in number)
    // For hotels, we search by name via API filters if possible, or fetch more to filter
    const [cities, properties] = await Promise.all([
      getCities(),
      getProperties({
        'filters[0][name]': 'name',
        'filters[0][operand]': 'Contains',
        'filters[0][value]': query,
        'per_page': 20
      }).catch(() => getProperties({ count: 100 })) // Fallback if filters fail
    ]);

    // Filter cities matching query
    const filteredCities = cities
      .filter(city =>
        city.name.includes(query) ||
        (city.name_en && city.name_en.toLowerCase().includes(query.toLowerCase())) ||
        (city.slug && city.slug.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 5);

    // Filter properties matching query (API might have already filtered, but we re-verify)
    const filteredHotels = properties
      .filter(hotel =>
        hotel.name.includes(query) ||
        (hotel.name_en && hotel.name_en.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, 10)
      .map(hotel => ({
        id: hotel.id,
        name: hotel.name,
        cityName: hotel.city_name,
        image: hotel.main_image?.url
      }));

    return NextResponse.json({
      cities: filteredCities,
      hotels: filteredHotels
    });
  } catch (error) {
    console.error('[Suggestions API] Error:', error);
    return NextResponse.json({ cities: [], hotels: [] }); // Graceful fallback
  }
}
