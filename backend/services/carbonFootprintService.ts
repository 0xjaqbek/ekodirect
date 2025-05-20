// backend/services/carbonFootprintService.ts
import { APP_SETTINGS } from '../shared/constants';

// Factors that influence carbon footprint
const {
  KM_PER_KG_CO2,
  LOCAL_PRODUCTION_MULTIPLIER,
  ECO_CERTIFICATE_MULTIPLIER
} = APP_SETTINGS.CARBON_FOOTPRINT_FACTORS;

class CarbonFootprintService {
  /**
   * Calculate carbon footprint based on distance, weight, and other factors
   * @param distanceKm - Average distance in kilometers
   * @param weightKg - Total weight in kilograms
   * @param isLocalProduction - Whether all products are from local producers (<50 km)
   * @param hasEcoCertificate - Whether all products have eco certificates
   * @returns Carbon footprint in kg CO2
   */
  calculateCarbonFootprint(
    distanceKm: number,
    weightKg: number,
    isLocalProduction: boolean = false,
    hasEcoCertificate: boolean = false
  ): number {
    // Base calculation: distance * weight * emission factor
    let footprint = distanceKm * weightKg * KM_PER_KG_CO2;
    
    // Apply multipliers for local production and eco certificates
    if (isLocalProduction) {
      footprint *= LOCAL_PRODUCTION_MULTIPLIER;
    }
    
    if (hasEcoCertificate) {
      footprint *= ECO_CERTIFICATE_MULTIPLIER;
    }
    
    // Round to 2 decimal places
    return Math.round(footprint * 100) / 100;
  }
  
  /**
   * Calculate carbon savings compared to conventional shopping
   * @param footprint - Calculated carbon footprint
   * @returns Carbon savings in kg CO2
   */
  calculateCarbonSavings(footprint: number): number {
    // Assume conventional shopping has 1.5x the carbon footprint
    const conventionalFootprint = footprint * 1.5;
    const savings = conventionalFootprint - footprint;
    
    // Round to 2 decimal places
    return Math.round(savings * 100) / 100;
  }
  
  /**
   * Get carbon footprint rating
   * @param footprint - Calculated carbon footprint
   * @returns Rating: 'low', 'medium', or 'high'
   */
  getCarbonFootprintRating(footprint: number): 'low' | 'medium' | 'high' {
    if (footprint < 5) {
      return 'low';
    } else if (footprint < 15) {
      return 'medium';
    } else {
      return 'high';
    }
  }
  
  /**
   * Get carbon footprint recommendations
   * @param footprint - Calculated carbon footprint
   * @returns Array of recommendations
   */
  getCarbonFootprintRecommendations(footprint: number): string[] {
    const rating = this.getCarbonFootprintRating(footprint);
    const recommendations: string[] = [];
    
    if (rating === 'medium' || rating === 'high') {
      recommendations.push('Wybieraj produkty od lokalnych rolników (w odległości do 30 km).');
      recommendations.push('Preferuj produkty z certyfikatami ekologicznymi.');
    }
    
    if (rating === 'high') {
      recommendations.push('Rozważ składanie większych zamówień, ale rzadziej.');
      recommendations.push('Wybieraj produkty sezonowe, które nie wymagają długiego transportu.');
    }
    
    return recommendations;
  }
}

export const carbonFootprintService = new CarbonFootprintService();
export default carbonFootprintService;