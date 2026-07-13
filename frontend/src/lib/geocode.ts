export async function geocodeAddress(
  street: string | undefined,
  house: string | undefined,
  city: string | undefined,
  country: string | undefined
): Promise<{ lat: number; lng: number } | null> {
  const q = [street, house, city, country].filter(Boolean).join(", ");
  if (!q) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
      { headers: { "User-Agent": "FamilyTree/1.0" } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch {}
  return null;
}
