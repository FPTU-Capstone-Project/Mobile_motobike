// Address validation utility for ride booking
// Ensures at least one location is at allowed venues

const ALLOWED_VENUES = [
  'nhà văn hóa sinh viên',
  'nvđhsv',
  'nha van hoa sinh vien',
  'trường đại học fpt',
  'đại học fpt',
  'dai hoc fpt',
  'truong dai hoc fpt',
  'đh fpt',
  'dh fpt',
  'fpt university',
  'fpt uni'
];

/**
 * Check if an address contains allowed venue keywords
 * @param {string} address - Address to validate
 * @returns {boolean} - True if address contains allowed venue
 */
export const isValidVenue = (address) => {
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  const normalizedAddress = address.toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return ALLOWED_VENUES.some(venue => 
    normalizedAddress.includes(venue.toLowerCase())
  );
};

/**
 * Validate pickup and dropoff addresses
 * @param {string} pickupAddress - Pickup address
 * @param {string} dropoffAddress - Dropoff address
 * @returns {object} - Validation result with isValid and message
 */
export const validateAddresses = (pickupAddress, dropoffAddress) => {
  const pickupValid = isValidVenue(pickupAddress);
  const dropoffValid = isValidVenue(dropoffAddress);
  
  if (!pickupValid && !dropoffValid) {
    return {
      isValid: false,
      message: 'Ít nhất một trong hai địa điểm phải là "Nhà văn hóa sinh viên" hoặc "Trường Đại học FPT"'
    };
  }
  
  return {
    isValid: true,
    message: 'Địa chỉ hợp lệ'
  };
};

/**
 * Get suggested addresses for allowed venues
 * @returns {Array} - Array of suggested addresses
 */
export const getSuggestedAddresses = () => [
  {
    id: 'nvdhsv',
    title: 'Nhà văn hóa sinh viên',
    description: 'Công viên nội khu vinhomes grand park, Quận 9, TP.HCM',
    coordinates: { latitude: 10.8431978, longitude: 106.8374791 }
  },
  {
    id: 'fpt_university',
    title: 'Trường Đại học FPT',
    description: 'Lô E2a-7, Đường D1, Đ. D1, Long Thạnh Mỹ, Quận 9, TP.HCM',
    coordinates: { latitude: 10.8411, longitude: 106.8098 }
  }
];

/**
 * Filter search results to only include valid venues or nearby locations
 * @param {Array} searchResults - Results from Goong API
 * @param {string} query - Search query
 * @returns {Array} - Filtered results
 */
export const filterSearchResults = (searchResults, query) => {
  if (!searchResults || !Array.isArray(searchResults)) {
    return [];
  }
  
  // If query contains valid venue keywords, show all results
  if (isValidVenue(query)) {
    return searchResults;
  }
  
  // Otherwise, only show results that contain valid venues
  return searchResults.filter(result => {
    const description = result.description || '';
    const mainText = result.structured_formatting?.main_text || '';
    const secondaryText = result.structured_formatting?.secondary_text || '';
    
    return isValidVenue(description) || 
           isValidVenue(mainText) || 
           isValidVenue(secondaryText);
  });
};

export default {
  isValidVenue,
  validateAddresses,
  getSuggestedAddresses,
  filterSearchResults
};
