import { PropertyItem } from '@/lib/seedData';

/**
 * Adjacent city mapping for the Chandigarh Tricity cluster.
 * Ordered by geographic distance from the source city.
 */
export const TRICITY_NEARBY_CITIES: Record<string, string[]> = {
  Panchkula: ['Zirakpur', 'Chandigarh', 'Mohali', 'Kharar'],
  Zirakpur: ['Panchkula', 'Chandigarh', 'Mohali', 'Kharar'],
  Chandigarh: ['Mohali', 'Panchkula', 'Zirakpur', 'Kharar'],
  Mohali: ['Kharar', 'Chandigarh', 'Zirakpur', 'Panchkula'],
  Kharar: ['Mohali', 'Chandigarh', 'Zirakpur', 'Panchkula'],
};

/**
 * Normalize string for location comparison (removes sector prefixes, punctuation, whitespace).
 */
function normalizeLocationString(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Extract numeric sector or phase number if present (e.g. "Sector 20" -> 20, "Phase 7" -> 7).
 */
function extractSectorOrPhaseNumber(str: string): number | null {
  const match = (str || '').match(/(?:sector|sec|phase|ph|block)\s*(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  const genericMatch = (str || '').match(/\b(\d+)\b/);
  return genericMatch && genericMatch[1] ? parseInt(genericMatch[1], 10) : null;
}

/**
 * Calculates a proximity score (0 to 100) between a property's location and a target city/locality.
 */
export function calculateLocationProximityScore(
  property: { city?: string; locality?: string; address?: string },
  targetCity: string,
  targetLocality: string
): number {
  const propCityNorm = normalizeLocationString(property.city || '');
  const targetCityNorm = normalizeLocationString(targetCity || '');
  const propLocNorm = normalizeLocationString(property.locality || property.address || '');
  const targetLocNorm = normalizeLocationString(targetLocality || '');

  const isAnyCity = !targetCity || targetCity.toLowerCase() === 'all';
  const hasLocality = Boolean(targetLocality && targetLocality.trim().length > 0);

  // If a locality is specified
  if (hasLocality) {
    // 1. Exact locality string match
    if (propLocNorm.includes(targetLocNorm) || targetLocNorm.includes(propLocNorm)) {
      return 100;
    }

    // 2. Numeric sector/phase proximity in same city
    const targetSectorNum = extractSectorOrPhaseNumber(targetLocality);
    const propSectorNum = extractSectorOrPhaseNumber(property.locality || property.address || '');

    const isSameCity = isAnyCity || propCityNorm === targetCityNorm;

    if (isSameCity && targetSectorNum !== null && propSectorNum !== null) {
      const diff = Math.abs(targetSectorNum - propSectorNum);
      if (diff <= 3) return 85; // Adjacent sector/phase (e.g. Sec 20 vs Sec 21)
      if (diff <= 10) return 70; // Close sector/phase in same city
      return 60; // Same city, different sector
    }

    // 3. Same city, different locality
    if (isSameCity) {
      return 55;
    }

    // 4. Neighboring cities
    const targetCityKey = Object.keys(TRICITY_NEARBY_CITIES).find(
      (c) => normalizeLocationString(c) === targetCityNorm
    );
    if (targetCityKey) {
      const nearbyList = TRICITY_NEARBY_CITIES[targetCityKey] || [];
      const cityIndex = nearbyList.findIndex(
        (c) => normalizeLocationString(c) === propCityNorm
      );
      if (cityIndex !== -1) {
        return Math.max(20, 45 - cityIndex * 8); // 45, 37, 29, 21
      }
    }

    return 10;
  }

  // If filtering by City only (no specific locality)
  if (!isAnyCity) {
    if (propCityNorm === targetCityNorm) {
      return 100; // Exact city match
    }

    const targetCityKey = Object.keys(TRICITY_NEARBY_CITIES).find(
      (c) => normalizeLocationString(c) === targetCityNorm
    );
    if (targetCityKey) {
      const nearbyList = TRICITY_NEARBY_CITIES[targetCityKey] || [];
      const cityIndex = nearbyList.findIndex(
        (c) => normalizeLocationString(c) === propCityNorm
      );
      if (cityIndex !== -1) {
        return Math.max(20, 50 - cityIndex * 10); // 50, 40, 30, 20
      }
    }

    return 10;
  }

  // No location filter applied
  return 100;
}

/**
 * Partitions a list of properties into exact location matches and nearby location matches.
 */
export function partitionPropertiesByLocation(
  properties: PropertyItem[],
  targetCity: string,
  targetLocality: string
): {
  exactMatches: PropertyItem[];
  nearbyMatches: PropertyItem[];
  hasLocationFilter: boolean;
} {
  const isCityFiltered = Boolean(targetCity && targetCity !== 'all');
  const isLocalityFiltered = Boolean(targetLocality && targetLocality.trim().length > 0);
  const hasLocationFilter = isCityFiltered || isLocalityFiltered;

  if (!hasLocationFilter) {
    return {
      exactMatches: properties,
      nearbyMatches: [],
      hasLocationFilter: false,
    };
  }

  const targetCityNorm = normalizeLocationString(targetCity || '');
  const targetLocNorm = normalizeLocationString(targetLocality || '');

  const exactMatches: PropertyItem[] = [];
  const nearbyCandidates: { property: PropertyItem; score: number }[] = [];

  for (const prop of properties) {
    const propCityNorm = normalizeLocationString(prop.city || '');
    const propLocNorm = normalizeLocationString(prop.locality || '');

    let isExact = false;

    if (isLocalityFiltered) {
      const locMatch = propLocNorm.includes(targetLocNorm) || targetLocNorm.includes(propLocNorm);
      const cityMatch = !isCityFiltered || propCityNorm === targetCityNorm;
      isExact = locMatch && cityMatch;
    } else if (isCityFiltered) {
      isExact = propCityNorm === targetCityNorm;
    }

    if (isExact) {
      exactMatches.push(prop);
    } else {
      const score = calculateLocationProximityScore(prop, targetCity, targetLocality);
      if (score > 0) {
        nearbyCandidates.push({ property: prop, score });
      }
    }
  }

  // Sort nearby matches by highest proximity score first
  nearbyCandidates.sort((a, b) => b.score - a.score);

  return {
    exactMatches,
    nearbyMatches: nearbyCandidates.map((c) => c.property),
    hasLocationFilter: true,
  };
}
