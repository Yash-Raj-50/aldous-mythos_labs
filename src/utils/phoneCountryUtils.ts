/**
 * Comprehensive country detection utility based on phone number country codes
 * Covers all ITU-T E.164 international calling codes
 */

interface CountryInfo {
  name: string;
  code: string;
  flag: string;
}

// Comprehensive country code mapping covering all international dialing codes
const COUNTRY_CODE_MAP: { [key: string]: CountryInfo } = {
  // Zone 1 - North America
  '+1': { name: 'United States/Canada', code: 'US/CA', flag: '🇺🇸🇨🇦' },
  
  // Zone 2 - Africa
  '+20': { name: 'Egypt', code: 'EG', flag: '🇪🇬' },
  '+27': { name: 'South Africa', code: 'ZA', flag: '🇿🇦' },
  '+30': { name: 'Greece', code: 'GR', flag: '🇬🇷' },
  '+31': { name: 'Netherlands', code: 'NL', flag: '🇳🇱' },
  '+32': { name: 'Belgium', code: 'BE', flag: '🇧🇪' },
  '+33': { name: 'France', code: 'FR', flag: '🇫🇷' },
  '+34': { name: 'Spain', code: 'ES', flag: '🇪🇸' },
  '+36': { name: 'Hungary', code: 'HU', flag: '🇭🇺' },
  '+39': { name: 'Italy', code: 'IT', flag: '🇮🇹' },
  '+40': { name: 'Romania', code: 'RO', flag: '🇷🇴' },
  '+41': { name: 'Switzerland', code: 'CH', flag: '🇨🇭' },
  '+43': { name: 'Austria', code: 'AT', flag: '🇦🇹' },
  '+44': { name: 'United Kingdom', code: 'GB', flag: '🇬🇧' },
  '+45': { name: 'Denmark', code: 'DK', flag: '🇩🇰' },
  '+46': { name: 'Sweden', code: 'SE', flag: '🇸🇪' },
  '+47': { name: 'Norway', code: 'NO', flag: '🇳🇴' },
  '+48': { name: 'Poland', code: 'PL', flag: '🇵🇱' },
  '+49': { name: 'Germany', code: 'DE', flag: '🇩🇪' },
  '+51': { name: 'Peru', code: 'PE', flag: '🇵🇪' },
  '+52': { name: 'Mexico', code: 'MX', flag: '🇲🇽' },
  '+53': { name: 'Cuba', code: 'CU', flag: '🇨🇺' },
  '+54': { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
  '+55': { name: 'Brazil', code: 'BR', flag: '🇧🇷' },
  '+56': { name: 'Chile', code: 'CL', flag: '🇨🇱' },
  '+57': { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
  '+58': { name: 'Venezuela', code: 'VE', flag: '🇻🇪' },
  
  // Zone 3 & 4 - Europe
  '+212': { name: 'Morocco', code: 'MA', flag: '🇲🇦' },
  '+213': { name: 'Algeria', code: 'DZ', flag: '🇩🇿' },
  '+216': { name: 'Tunisia', code: 'TN', flag: '🇹🇳' },
  '+218': { name: 'Libya', code: 'LY', flag: '🇱🇾' },
  '+220': { name: 'Gambia', code: 'GM', flag: '🇬🇲' },
  '+221': { name: 'Senegal', code: 'SN', flag: '🇸🇳' },
  '+222': { name: 'Mauritania', code: 'MR', flag: '🇲🇷' },
  '+223': { name: 'Mali', code: 'ML', flag: '🇲🇱' },
  '+224': { name: 'Guinea', code: 'GN', flag: '🇬🇳' },
  '+225': { name: 'Côte d\'Ivoire', code: 'CI', flag: '🇨🇮' },
  '+226': { name: 'Burkina Faso', code: 'BF', flag: '🇧🇫' },
  '+227': { name: 'Niger', code: 'NE', flag: '🇳🇪' },
  '+228': { name: 'Togo', code: 'TG', flag: '🇹🇬' },
  '+229': { name: 'Benin', code: 'BJ', flag: '🇧🇯' },
  '+230': { name: 'Mauritius', code: 'MU', flag: '🇲🇺' },
  '+231': { name: 'Liberia', code: 'LR', flag: '🇱🇷' },
  '+232': { name: 'Sierra Leone', code: 'SL', flag: '🇸🇱' },
  '+233': { name: 'Ghana', code: 'GH', flag: '🇬🇭' },
  '+234': { name: 'Nigeria', code: 'NG', flag: '🇳🇬' },
  '+235': { name: 'Chad', code: 'TD', flag: '🇹🇩' },
  '+236': { name: 'Central African Republic', code: 'CF', flag: '🇨🇫' },
  '+237': { name: 'Cameroon', code: 'CM', flag: '🇨🇲' },
  '+238': { name: 'Cape Verde', code: 'CV', flag: '🇨🇻' },
  '+239': { name: 'São Tomé and Príncipe', code: 'ST', flag: '🇸🇹' },
  '+240': { name: 'Equatorial Guinea', code: 'GQ', flag: '🇬🇶' },
  '+241': { name: 'Gabon', code: 'GA', flag: '🇬🇦' },
  '+242': { name: 'Republic of the Congo', code: 'CG', flag: '🇨🇬' },
  '+243': { name: 'Democratic Republic of the Congo', code: 'CD', flag: '🇨🇩' },
  '+244': { name: 'Angola', code: 'AO', flag: '🇦🇴' },
  '+245': { name: 'Guinea-Bissau', code: 'GW', flag: '🇬🇼' },
  '+246': { name: 'British Indian Ocean Territory', code: 'IO', flag: '🇮🇴' },
  '+248': { name: 'Seychelles', code: 'SC', flag: '🇸🇨' },
  '+249': { name: 'Sudan', code: 'SD', flag: '🇸🇩' },
  '+250': { name: 'Rwanda', code: 'RW', flag: '🇷🇼' },
  '+251': { name: 'Ethiopia', code: 'ET', flag: '🇪🇹' },
  '+252': { name: 'Somalia', code: 'SO', flag: '🇸🇴' },
  '+253': { name: 'Djibouti', code: 'DJ', flag: '🇩🇯' },
  '+254': { name: 'Kenya', code: 'KE', flag: '🇰🇪' },
  '+255': { name: 'Tanzania', code: 'TZ', flag: '🇹🇿' },
  '+256': { name: 'Uganda', code: 'UG', flag: '🇺🇬' },
  '+257': { name: 'Burundi', code: 'BI', flag: '🇧🇮' },
  '+258': { name: 'Mozambique', code: 'MZ', flag: '🇲🇿' },
  '+260': { name: 'Zambia', code: 'ZM', flag: '🇿🇲' },
  '+261': { name: 'Madagascar', code: 'MG', flag: '🇲🇬' },
  '+262': { name: 'Réunion/Mayotte', code: 'RE/YT', flag: '🇷🇪🇾🇹' },
  '+263': { name: 'Zimbabwe', code: 'ZW', flag: '🇿🇼' },
  '+264': { name: 'Namibia', code: 'NA', flag: '🇳🇦' },
  '+265': { name: 'Malawi', code: 'MW', flag: '🇲🇼' },
  '+266': { name: 'Lesotho', code: 'LS', flag: '🇱🇸' },
  '+267': { name: 'Botswana', code: 'BW', flag: '🇧🇼' },
  '+268': { name: 'Eswatini', code: 'SZ', flag: '🇸🇿' },
  '+269': { name: 'Comoros', code: 'KM', flag: '🇰🇲' },
  
  // More European countries
  '+290': { name: 'Saint Helena', code: 'SH', flag: '🇸🇭' },
  '+291': { name: 'Eritrea', code: 'ER', flag: '🇪🇷' },
  '+297': { name: 'Aruba', code: 'AW', flag: '🇦🇼' },
  '+298': { name: 'Faroe Islands', code: 'FO', flag: '🇫🇴' },
  '+299': { name: 'Greenland', code: 'GL', flag: '🇬🇱' },
  
  '+350': { name: 'Gibraltar', code: 'GI', flag: '🇬🇮' },
  '+351': { name: 'Portugal', code: 'PT', flag: '🇵🇹' },
  '+352': { name: 'Luxembourg', code: 'LU', flag: '🇱🇺' },
  '+353': { name: 'Ireland', code: 'IE', flag: '🇮🇪' },
  '+354': { name: 'Iceland', code: 'IS', flag: '🇮🇸' },
  '+355': { name: 'Albania', code: 'AL', flag: '🇦🇱' },
  '+356': { name: 'Malta', code: 'MT', flag: '🇲🇹' },
  '+357': { name: 'Cyprus', code: 'CY', flag: '🇨🇾' },
  '+358': { name: 'Finland', code: 'FI', flag: '🇫🇮' },
  '+359': { name: 'Bulgaria', code: 'BG', flag: '🇧🇬' },
  '+370': { name: 'Lithuania', code: 'LT', flag: '🇱🇹' },
  '+371': { name: 'Latvia', code: 'LV', flag: '🇱🇻' },
  '+372': { name: 'Estonia', code: 'EE', flag: '🇪🇪' },
  '+373': { name: 'Moldova', code: 'MD', flag: '🇲🇩' },
  '+374': { name: 'Armenia', code: 'AM', flag: '🇦🇲' },
  '+375': { name: 'Belarus', code: 'BY', flag: '🇧🇾' },
  '+376': { name: 'Andorra', code: 'AD', flag: '🇦🇩' },
  '+377': { name: 'Monaco', code: 'MC', flag: '🇲🇨' },
  '+378': { name: 'San Marino', code: 'SM', flag: '🇸🇲' },
  '+380': { name: 'Ukraine', code: 'UA', flag: '🇺🇦' },
  '+381': { name: 'Serbia', code: 'RS', flag: '🇷🇸' },
  '+382': { name: 'Montenegro', code: 'ME', flag: '🇲🇪' },
  '+383': { name: 'Kosovo', code: 'XK', flag: '🇽🇰' },
  '+385': { name: 'Croatia', code: 'HR', flag: '🇭🇷' },
  '+386': { name: 'Slovenia', code: 'SI', flag: '🇸🇮' },
  '+387': { name: 'Bosnia and Herzegovina', code: 'BA', flag: '🇧🇦' },
  '+389': { name: 'North Macedonia', code: 'MK', flag: '🇲🇰' },
  
  // Zone 4 continued
  '+420': { name: 'Czech Republic', code: 'CZ', flag: '🇨🇿' },
  '+421': { name: 'Slovakia', code: 'SK', flag: '🇸🇰' },
  '+423': { name: 'Liechtenstein', code: 'LI', flag: '🇱🇮' },
  
  // Zone 5 - Latin America
  '+500': { name: 'Falkland Islands', code: 'FK', flag: '🇫🇰' },
  '+501': { name: 'Belize', code: 'BZ', flag: '🇧🇿' },
  '+502': { name: 'Guatemala', code: 'GT', flag: '🇬🇹' },
  '+503': { name: 'El Salvador', code: 'SV', flag: '🇸🇻' },
  '+504': { name: 'Honduras', code: 'HN', flag: '🇭🇳' },
  '+505': { name: 'Nicaragua', code: 'NI', flag: '🇳🇮' },
  '+506': { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
  '+507': { name: 'Panama', code: 'PA', flag: '🇵🇦' },
  '+508': { name: 'Saint Pierre and Miquelon', code: 'PM', flag: '🇵🇲' },
  '+509': { name: 'Haiti', code: 'HT', flag: '🇭🇹' },
  '+590': { name: 'Guadeloupe', code: 'GP', flag: '🇬🇵' },
  '+591': { name: 'Bolivia', code: 'BO', flag: '🇧🇴' },
  '+592': { name: 'Guyana', code: 'GY', flag: '🇬🇾' },
  '+593': { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
  '+594': { name: 'French Guiana', code: 'GF', flag: '🇬🇫' },
  '+595': { name: 'Paraguay', code: 'PY', flag: '🇵🇾' },
  '+596': { name: 'Martinique', code: 'MQ', flag: '🇲🇶' },
  '+597': { name: 'Suriname', code: 'SR', flag: '🇸🇷' },
  '+598': { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
  
  // Zone 6 - Asia Pacific
  '+60': { name: 'Malaysia', code: 'MY', flag: '🇲🇾' },
  '+61': { name: 'Australia', code: 'AU', flag: '🇦🇺' },
  '+62': { name: 'Indonesia', code: 'ID', flag: '🇮🇩' },
  '+63': { name: 'Philippines', code: 'PH', flag: '🇵🇭' },
  '+64': { name: 'New Zealand', code: 'NZ', flag: '🇳🇿' },
  '+65': { name: 'Singapore', code: 'SG', flag: '🇸🇬' },
  '+66': { name: 'Thailand', code: 'TH', flag: '🇹🇭' },
  '+670': { name: 'East Timor', code: 'TL', flag: '🇹🇱' },
  '+672': { name: 'Australian External Territories', code: 'AQ', flag: '🇦🇶' },
  '+673': { name: 'Brunei', code: 'BN', flag: '🇧🇳' },
  '+674': { name: 'Nauru', code: 'NR', flag: '🇳🇷' },
  '+675': { name: 'Papua New Guinea', code: 'PG', flag: '🇵🇬' },
  '+676': { name: 'Tonga', code: 'TO', flag: '🇹🇴' },
  '+677': { name: 'Solomon Islands', code: 'SB', flag: '🇸🇧' },
  '+678': { name: 'Vanuatu', code: 'VU', flag: '🇻🇺' },
  '+679': { name: 'Fiji', code: 'FJ', flag: '🇫🇯' },
  '+680': { name: 'Palau', code: 'PW', flag: '🇵🇼' },
  '+681': { name: 'Wallis and Futuna', code: 'WF', flag: '🇼🇫' },
  '+682': { name: 'Cook Islands', code: 'CK', flag: '🇨🇰' },
  '+683': { name: 'Niue', code: 'NU', flag: '🇳🇺' },
  '+684': { name: 'American Samoa', code: 'AS', flag: '🇦🇸' },
  '+685': { name: 'Samoa', code: 'WS', flag: '🇼🇸' },
  '+686': { name: 'Kiribati', code: 'KI', flag: '🇰🇮' },
  '+687': { name: 'New Caledonia', code: 'NC', flag: '🇳🇨' },
  '+688': { name: 'Tuvalu', code: 'TV', flag: '🇹🇻' },
  '+689': { name: 'French Polynesia', code: 'PF', flag: '🇵🇫' },
  '+690': { name: 'Tokelau', code: 'TK', flag: '🇹🇰' },
  '+691': { name: 'Federated States of Micronesia', code: 'FM', flag: '🇫🇲' },
  '+692': { name: 'Marshall Islands', code: 'MH', flag: '🇲🇭' },
  
  // Zone 7 - Russia and Kazakhstan
  '+7': { name: 'Russia/Kazakhstan', code: 'RU/KZ', flag: '🇷🇺🇰🇿' },
  
  // Zone 8 - Asia
  '+81': { name: 'Japan', code: 'JP', flag: '🇯🇵' },
  '+82': { name: 'South Korea', code: 'KR', flag: '🇰🇷' },
  '+84': { name: 'Vietnam', code: 'VN', flag: '🇻🇳' },
  '+86': { name: 'China', code: 'CN', flag: '🇨🇳' },
  '+852': { name: 'Hong Kong', code: 'HK', flag: '🇭🇰' },
  '+853': { name: 'Macau', code: 'MO', flag: '🇲🇴' },
  '+855': { name: 'Cambodia', code: 'KH', flag: '🇰🇭' },
  '+856': { name: 'Laos', code: 'LA', flag: '🇱🇦' },
  
  // Zone 9 - Middle East and West/South Asia
  '+90': { name: 'Turkey', code: 'TR', flag: '🇹🇷' },
  '+91': { name: 'India', code: 'IN', flag: '🇮🇳' },
  '+92': { name: 'Pakistan', code: 'PK', flag: '🇵🇰' },
  '+93': { name: 'Afghanistan', code: 'AF', flag: '🇦🇫' },
  '+94': { name: 'Sri Lanka', code: 'LK', flag: '🇱🇰' },
  '+95': { name: 'Myanmar', code: 'MM', flag: '🇲🇲' },
  '+98': { name: 'Iran', code: 'IR', flag: '🇮🇷' },
  '+960': { name: 'Maldives', code: 'MV', flag: '🇲🇻' },
  '+961': { name: 'Lebanon', code: 'LB', flag: '🇱🇧' },
  '+962': { name: 'Jordan', code: 'JO', flag: '🇯🇴' },
  '+963': { name: 'Syria', code: 'SY', flag: '🇸🇾' },
  '+964': { name: 'Iraq', code: 'IQ', flag: '🇮🇶' },
  '+965': { name: 'Kuwait', code: 'KW', flag: '🇰🇼' },
  '+966': { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦' },
  '+967': { name: 'Yemen', code: 'YE', flag: '🇾🇪' },
  '+968': { name: 'Oman', code: 'OM', flag: '🇴🇲' },
  '+970': { name: 'Palestine', code: 'PS', flag: '🇵🇸' },
  '+971': { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪' },
  '+972': { name: 'Israel', code: 'IL', flag: '🇮🇱' },
  '+973': { name: 'Bahrain', code: 'BH', flag: '🇧🇭' },
  '+974': { name: 'Qatar', code: 'QA', flag: '🇶🇦' },
  '+975': { name: 'Bhutan', code: 'BT', flag: '🇧🇹' },
  '+976': { name: 'Mongolia', code: 'MN', flag: '🇲🇳' },
  '+977': { name: 'Nepal', code: 'NP', flag: '🇳🇵' },
  '+992': { name: 'Tajikistan', code: 'TJ', flag: '🇹🇯' },
  '+993': { name: 'Turkmenistan', code: 'TM', flag: '🇹🇲' },
  '+994': { name: 'Azerbaijan', code: 'AZ', flag: '🇦🇿' },
  '+995': { name: 'Georgia', code: 'GE', flag: '🇬🇪' },
  '+996': { name: 'Kyrgyzstan', code: 'KG', flag: '🇰🇬' },
  '+998': { name: 'Uzbekistan', code: 'UZ', flag: '🇺🇿' },
};

/**
 * Extracts the country information from a phone number
 * @param phoneNumber - The phone number with country code (e.g., '+1234567890' or 'whatsapp:+1234567890')
 * @returns Country information object with name, code, and flag
 */
export function getCountryFromPhone(phoneNumber: string): CountryInfo {
  // Remove WhatsApp prefix and any non-digit characters except +
  const cleanPhone = phoneNumber.replace(/^whatsapp:/, '').replace(/[^\d+]/g, '');
  
  // Sort country codes by length (descending) to match longer codes first
  const sortedCodes = Object.keys(COUNTRY_CODE_MAP).sort((a, b) => b.length - a.length);
  
  // Find the matching country code
  for (const code of sortedCodes) {
    if (cleanPhone.startsWith(code)) {
      return COUNTRY_CODE_MAP[code];
    }
  }
  
  // Return unknown if no match found
  return {
    name: 'Unknown',
    code: 'XX',
    flag: '🏴'
  };
}

/**
 * Gets just the country name from a phone number
 * @param phoneNumber - The phone number with country code
 * @returns Country name string
 */
export function getCountryNameFromPhone(phoneNumber: string): string {
  return getCountryFromPhone(phoneNumber).name;
}

/**
 * Gets the country code from a phone number
 * @param phoneNumber - The phone number with country code
 * @returns Country code string (e.g., 'US', 'GB', 'IN')
 */
export function getCountryCodeFromPhone(phoneNumber: string): string {
  return getCountryFromPhone(phoneNumber).code;
}

/**
 * Gets the flag emoji from a phone number
 * @param phoneNumber - The phone number with country code
 * @returns Flag emoji string
 */
export function getFlagFromPhone(phoneNumber: string): string {
  return getCountryFromPhone(phoneNumber).flag;
}

/**
 * Validates if a phone number has a valid country code
 * @param phoneNumber - The phone number to validate
 * @returns Boolean indicating if the country code is recognized
 */
export function hasValidCountryCode(phoneNumber: string): boolean {
  const country = getCountryFromPhone(phoneNumber);
  return country.name !== 'Unknown';
}

/**
 * Gets all available country codes and their information
 * @returns Array of all country information objects
 */
export function getAllCountries(): CountryInfo[] {
  return Object.values(COUNTRY_CODE_MAP);
}

/**
 * Searches for countries by name
 * @param searchTerm - The search term to match against country names
 * @returns Array of matching country information objects
 */
export function searchCountriesByName(searchTerm: string): CountryInfo[] {
  const term = searchTerm.toLowerCase();
  return Object.values(COUNTRY_CODE_MAP).filter(country => 
    country.name.toLowerCase().includes(term)
  );
}
