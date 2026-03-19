/**
 * Central configuration for the RentaFast application.
 * Use this to manage app-wide constants, hubs, and metadata.
 */

export const APP_CONFIG = {
  name: "RentaFast Cross River",
  shortName: "RentaFast",
  description: "The smartest way to rent in Cross River State.",
  currency: {
    symbol: "₦",
    code: "NGN",
    format: "₦"
  },
  regionalHubs: [
    "Calabar",
    "Ikom",
    "Ogoja",
    "Obudu",
    "Ugep",
    "Akamkpa"
  ],
  supportEmail: "support@rentfast.com.ng",
  socials: {
    facebook: "https://facebook.com/rentfastcr",
    instagram: "https://instagram.com/rentfastcr"
  },
  // Feature toggles
  features: {
    aiMatching: true,
    neighborhoodGuides: true,
    verificationPortal: true,
    performanceAnalytics: true
  }
};

export default APP_CONFIG;
