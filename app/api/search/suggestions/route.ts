import { NextRequest, NextResponse } from 'next/server';
import { getCities, getProperties } from '@/src/lib/grs-client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query || query.length < 2) {
    return NextResponse.json({ cities: [], hotels: [] });
  }

  try {
    // In a real world scenario, the GRS API might have a specific autocomplete endpoint.
    // For now, we'll fetch cities and properties and filter them.
    // Optimization: we could cache the cities list.
    const [allCities, allProperties] = await Promise.all([
      getCities(),
      getProperties({ count: 50 }) // Fetch a batch of properties
    ]);

    const filteredCities = allCities
      .filter(city =>
        city.name.toLowerCase().includes(query.toLowerCase()) ||
        city.name_en.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    const filteredHotels = allProperties
      .filter(hotel =>
        hotel.name.toLowerCase().includes(query.toLowerCase()) ||
        hotel.name_en.toLowerCase().includes(query.toLowerCase())
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
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
}
