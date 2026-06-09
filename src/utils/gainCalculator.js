/**
 * Tarif: 500 FCFA par km
 */
const PRIX_PAR_KM = 500;

/**
 * Calcule le gain pour une course basée sur la distance
 * @param {number} distance - Distance en km
 * @returns {number} Gain en FCFA
 */
export const calculerGain = (distance) => {
    if (!distance || distance <= 0) return 0;
    return Math.round(distance * PRIX_PAR_KM);
};

/**
 * Formate le gain en texte lisible
 * @param {number} gain - Le gain en FCFA
 * @returns {string} Format: "1 000 FCFA"
 */
export const formatGain = (gain) => {
    return `${gain.toLocaleString('fr-FR')} FCFA`;
};

/**
 * Calcule la distance entre deux points GPS (formule Haversine)
 * @param {number} lat1 - Latitude point 1
 * @param {number} lon1 - Longitude point 1
 * @param {number} lat2 - Latitude point 2
 * @param {number} lon2 - Longitude point 2
 * @returns {number} Distance en km
 */
export const calculerDistanceGPS = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Arrondir à 1 décimale
};

export const PRIX_PAR_KM_CONSTANT = PRIX_PAR_KM;
