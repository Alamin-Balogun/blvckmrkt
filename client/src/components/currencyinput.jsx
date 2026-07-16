import {useState, useEffect, useRef} from "react";
import {CURRENCY_SYMBOLS, COUNTRY_CURRENCY} from "../components/currencycontext";

/**
 * CurrencyInput — Select currency with country flags and currency symbols.
 *
 * Displays all countries with their currencies, flags, and symbols.
 * Search by country name, currency code, or currency name.
 * Embedded data — zero network dependency, works offline.
 *
 * Props:
 *   value        — Currency code (e.g. "NGN", "USD", "EUR")
 *   onChange     — Called with currency code when selection changes
 *   error        — External error message
 *   label        — Input label text
 *   placeholder  — Placeholder when no selection
 *   disabled     — Disable the input
 */

// ─── Currency names map ───────────────────────────────────────────────────────
const CURRENCY_NAMES = {
  USD: "US Dollar", EUR: "Euro", GBP: "British Pound", JPY: "Japanese Yen",
  CNY: "Chinese Yuan", INR: "Indian Rupee", NGN: "Nigerian Naira", SAR: "Saudi Riyal",
  AED: "UAE Dirham", CAD: "Canadian Dollar", AUD: "Australian Dollar", CHF: "Swiss Franc",
  KRW: "South Korean Won", BRL: "Brazilian Real", MXN: "Mexican Peso", SGD: "Singapore Dollar",
  HKD: "Hong Kong Dollar", NOK: "Norwegian Krone", SEK: "Swedish Krona", DKK: "Danish Krone",
  PLN: "Polish Złoty", CZK: "Czech Koruna", HUF: "Hungarian Forint", RON: "Romanian Leu",
  BGN: "Bulgarian Lev", RUB: "Russian Ruble", TRY: "Turkish Lira", ZAR: "South African Rand",
  EGP: "Egyptian Pound", GHS: "Ghanaian Cedi", KES: "Kenyan Shilling", TZS: "Tanzanian Shilling",
  UGX: "Ugandan Shilling", ETB: "Ethiopian Birr", MAD: "Moroccan Dirham", TND: "Tunisian Dinar",
  DZD: "Algerian Dinar", XOF: "West African CFA Franc", XAF: "Central African CFA Franc",
  QAR: "Qatari Riyal", KWD: "Kuwaiti Dinar", BHD: "Bahraini Dinar", OMR: "Omani Rial",
  JOD: "Jordanian Dinar", IQD: "Iraqi Dinar", PKR: "Pakistani Rupee", BDT: "Bangladeshi Taka",
  LKR: "Sri Lankan Rupee", NPR: "Nepalese Rupee", MYR: "Malaysian Ringgit", IDR: "Indonesian Rupiah",
  PHP: "Philippine Peso", THB: "Thai Baht", VND: "Vietnamese Dong", TWD: "New Taiwan Dollar",
  ILS: "Israeli Shekel", UAH: "Ukrainian Hryvnia", KZT: "Kazakhstani Tenge", GEL: "Georgian Lari",
  AMD: "Armenian Dram", AZN: "Azerbaijani Manat", MDL: "Moldovan Leu", RSD: "Serbian Dinar",
  ALL: "Albanian Lek", CLP: "Chilean Peso", COP: "Colombian Peso", ARS: "Argentine Peso",
  PEN: "Peruvian Sol", UYU: "Uruguayan Peso", BOB: "Bolivian Boliviano", GTQ: "Guatemalan Quetzal",
  HNL: "Honduran Lempira", NIO: "Nicaraguan Córdoba", CRC: "Costa Rican Colón", JMD: "Jamaican Dollar",
  TTD: "Trinidad & Tobago Dollar", DOP: "Dominican Peso", NZD: "New Zealand Dollar", HRK: "Croatian Kuna",
  ISK: "Icelandic Króna", BWP: "Botswana Pula", MUR: "Mauritian Rupee", MWK: "Malawian Kwacha",
  ZMW: "Zambian Kwacha", AFN: "Afghan Afghani", AOA: "Angolan Kwanza", BAM: "Bosnia Mark",
  BBD: "Barbadian Dollar", BIF: "Burundian Franc", BMD: "Bermudian Dollar", BND: "Brunei Dollar",
  BSD: "Bahamian Dollar", BTN: "Bhutanese Ngultrum", BYN: "Belarusian Ruble", BZD: "Belize Dollar",
  CDF: "Congolese Franc", CVE: "Cape Verdean Escudo", CUP: "Cuban Peso", DJF: "Djiboutian Franc",
  ERN: "Eritrean Nakfa", FJD: "Fijian Dollar", FKP: "Falkland Pound", GIP: "Gibraltar Pound",
  GMD: "Gambian Dalasi", GNF: "Guinean Franc", GYD: "Guyanese Dollar", HTG: "Haitian Gourde",
  IRR: "Iranian Rial", KGS: "Kyrgyzstani Som", KHR: "Cambodian Riel", KMF: "Comorian Franc",
  KPW: "North Korean Won", KYD: "Cayman Dollar", LAK: "Lao Kip", LBP: "Lebanese Pound",
  LRD: "Liberian Dollar", LSL: "Lesotho Loti", LYD: "Libyan Dinar", MGA: "Malagasy Ariary",
  MKD: "Macedonian Denar", MMK: "Myanmar Kyat", MNT: "Mongolian Tögrög", MOP: "Macanese Pataca",
  MRU: "Mauritanian Ouguiya", MVR: "Maldivian Rufiyaa", MZN: "Mozambican Metical", NAD: "Namibian Dollar",
  PAB: "Panamanian Balboa", PGK: "Papua New Guinean Kina", PYG: "Paraguayan Guaraní", 
  RWF: "Rwandan Franc", SBD: "Solomon Islands Dollar", SCR: "Seychellois Rupee", SDG: "Sudanese Pound",
  SHP: "Saint Helena Pound", SLL: "Sierra Leonean Leone", SOS: "Somali Shilling", SRD: "Surinamese Dollar",
  STN: "São Tomé Dobra", SVC: "Salvadoran Colón", SYP: "Syrian Pound", SZL: "Swazi Lilangeni",
  TJS: "Tajikistani Somoni", TMT: "Turkmen Manat", TOP: "Tongan Paʻanga", VES: "Venezuelan Bolívar",
  VUV: "Vanuatu Vatu", WST: "Samoan Tālā", XCD: "East Caribbean Dollar", XPF: "CFP Franc",
  YER: "Yemeni Rial", ZWL: "Zimbabwean Dollar",
};

// ─── Complete country data with currencies ────────────────────────────────────
const CURRENCY_COUNTRIES = [
  // ── Africa ──────────────────────────────────────────────────────────────────
  {code: "DZ", name: "Algeria", flag: "🇩🇿", currency: "DZD"},
  {code: "AO", name: "Angola", flag: "🇦🇴", currency: "AOA"},
  {code: "BJ", name: "Benin", flag: "🇧🇯", currency: "XOF"},
  {code: "BW", name: "Botswana", flag: "🇧🇼", currency: "BWP"},
  {code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF"},
  {code: "BI", name: "Burundi", flag: "🇧🇮", currency: "BIF"},
  {code: "CV", name: "Cabo Verde", flag: "🇨🇻", currency: "CVE"},
  {code: "CM", name: "Cameroon", flag: "🇨🇲", currency: "XAF"},
  {code: "CF", name: "Central African Republic", flag: "🇨🇫", currency: "XAF"},
  {code: "TD", name: "Chad", flag: "🇹🇩", currency: "XAF"},
  {code: "KM", name: "Comoros", flag: "🇰🇲", currency: "KMF"},
  {code: "CG", name: "Congo", flag: "🇨🇬", currency: "XAF"},
  {code: "CD", name: "Congo (DRC)", flag: "🇨🇩", currency: "CDF"},
  {code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF"},
  {code: "DJ", name: "Djibouti", flag: "🇩🇯", currency: "DJF"},
  {code: "EG", name: "Egypt", flag: "🇪🇬", currency: "EGP"},
  {code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶", currency: "XAF"},
  {code: "ER", name: "Eritrea", flag: "🇪🇷", currency: "ERN"},
  {code: "SZ", name: "Eswatini", flag: "🇸🇿", currency: "SZL"},
  {code: "ET", name: "Ethiopia", flag: "🇪🇹", currency: "ETB"},
  {code: "GA", name: "Gabon", flag: "🇬🇦", currency: "XAF"},
  {code: "GM", name: "Gambia", flag: "🇬🇲", currency: "GMD"},
  {code: "GH", name: "Ghana", flag: "🇬🇭", currency: "GHS"},
  {code: "GN", name: "Guinea", flag: "🇬🇳", currency: "GNF"},
  {code: "GW", name: "Guinea-Bissau", flag: "🇬🇼", currency: "XOF"},
  {code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES"},
  {code: "LS", name: "Lesotho", flag: "🇱🇸", currency: "LSL"},
  {code: "LR", name: "Liberia", flag: "🇱🇷", currency: "LRD"},
  {code: "LY", name: "Libya", flag: "🇱🇾", currency: "LYD"},
  {code: "MG", name: "Madagascar", flag: "🇲🇬", currency: "MGA"},
  {code: "MW", name: "Malawi", flag: "🇲🇼", currency: "MWK"},
  {code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF"},
  {code: "MR", name: "Mauritania", flag: "🇲🇷", currency: "MRU"},
  {code: "MU", name: "Mauritius", flag: "🇲🇺", currency: "MUR"},
  {code: "MA", name: "Morocco", flag: "🇲🇦", currency: "MAD"},
  {code: "MZ", name: "Mozambique", flag: "🇲🇿", currency: "MZN"},
  {code: "NA", name: "Namibia", flag: "🇳🇦", currency: "NAD"},
  {code: "NE", name: "Niger", flag: "🇳🇪", currency: "XOF"},
  {code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN"},
  {code: "RW", name: "Rwanda", flag: "🇷🇼", currency: "RWF"},
  {code: "ST", name: "São Tomé & Príncipe", flag: "🇸🇹", currency: "STN"},
  {code: "SN", name: "Senegal", flag: "🇸🇳", currency: "XOF"},
  {code: "SC", name: "Seychelles", flag: "🇸🇨", currency: "SCR"},
  {code: "SL", name: "Sierra Leone", flag: "🇸🇱", currency: "SLL"},
  {code: "SO", name: "Somalia", flag: "🇸🇴", currency: "SOS"},
  {code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR"},
  {code: "SS", name: "South Sudan", flag: "🇸🇸", currency: "SDG"},
  {code: "SD", name: "Sudan", flag: "🇸🇩", currency: "SDG"},
  {code: "TZ", name: "Tanzania", flag: "🇹🇿", currency: "TZS"},
  {code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF"},
  {code: "TN", name: "Tunisia", flag: "🇹🇳", currency: "TND"},
  {code: "UG", name: "Uganda", flag: "🇺🇬", currency: "UGX"},
  {code: "ZM", name: "Zambia", flag: "🇿🇲", currency: "ZMW"},
  {code: "ZW", name: "Zimbabwe", flag: "🇿🇼", currency: "ZWL"},

  // ── Americas ─────────────────────────────────────────────────────────────────
  {code: "AG", name: "Antigua & Barbuda", flag: "🇦🇬", currency: "XCD"},
  {code: "AR", name: "Argentina", flag: "🇦🇷", currency: "ARS"},
  {code: "BS", name: "Bahamas", flag: "🇧🇸", currency: "BSD"},
  {code: "BB", name: "Barbados", flag: "🇧🇧", currency: "BBD"},
  {code: "BZ", name: "Belize", flag: "🇧🇿", currency: "BZD"},
  {code: "BO", name: "Bolivia", flag: "🇧🇴", currency: "BOB"},
  {code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL"},
  {code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD"},
  {code: "CL", name: "Chile", flag: "🇨🇱", currency: "CLP"},
  {code: "CO", name: "Colombia", flag: "🇨🇴", currency: "COP"},
  {code: "CR", name: "Costa Rica", flag: "🇨🇷", currency: "CRC"},
  {code: "CU", name: "Cuba", flag: "🇨🇺", currency: "CUP"},
  {code: "DM", name: "Dominica", flag: "🇩🇲", currency: "XCD"},
  {code: "DO", name: "Dominican Republic", flag: "🇩🇴", currency: "DOP"},
  {code: "EC", name: "Ecuador", flag: "🇪🇨", currency: "USD"},
  {code: "SV", name: "El Salvador", flag: "🇸🇻", currency: "USD"},
  {code: "GD", name: "Grenada", flag: "🇬🇩", currency: "XCD"},
  {code: "GT", name: "Guatemala", flag: "🇬🇹", currency: "GTQ"},
  {code: "GY", name: "Guyana", flag: "🇬🇾", currency: "GYD"},
  {code: "HT", name: "Haiti", flag: "🇭🇹", currency: "HTG"},
  {code: "HN", name: "Honduras", flag: "🇭🇳", currency: "HNL"},
  {code: "JM", name: "Jamaica", flag: "🇯🇲", currency: "JMD"},
  {code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN"},
  {code: "NI", name: "Nicaragua", flag: "🇳🇮", currency: "NIO"},
  {code: "PA", name: "Panama", flag: "🇵🇦", currency: "PAB"},
  {code: "PY", name: "Paraguay", flag: "🇵🇾", currency: "PYG"},
  {code: "PE", name: "Peru", flag: "🇵🇪", currency: "PEN"},
  {code: "KN", name: "Saint Kitts & Nevis", flag: "🇰🇳", currency: "XCD"},
  {code: "LC", name: "Saint Lucia", flag: "🇱🇨", currency: "XCD"},
  {code: "VC", name: "St. Vincent & Grenadines", flag: "🇻🇨", currency: "XCD"},
  {code: "SR", name: "Suriname", flag: "🇸🇷", currency: "SRD"},
  {code: "TT", name: "Trinidad & Tobago", flag: "🇹🇹", currency: "TTD"},
  {code: "US", name: "United States", flag: "🇺🇸", currency: "USD"},
  {code: "UY", name: "Uruguay", flag: "🇺🇾", currency: "UYU"},
  {code: "VE", name: "Venezuela", flag: "🇻🇪", currency: "VES"},

  // ── Europe ────────────────────────────────────────────────────────────────────
  {code: "AL", name: "Albania", flag: "🇦🇱", currency: "ALL"},
  {code: "AD", name: "Andorra", flag: "🇦🇩", currency: "EUR"},
  {code: "AT", name: "Austria", flag: "🇦🇹", currency: "EUR"},
  {code: "BY", name: "Belarus", flag: "🇧🇾", currency: "BYN"},
  {code: "BE", name: "Belgium", flag: "🇧🇪", currency: "EUR"},
  {code: "BA", name: "Bosnia & Herzegovina", flag: "🇧🇦", currency: "BAM"},
  {code: "BG", name: "Bulgaria", flag: "🇧🇬", currency: "BGN"},
  {code: "HR", name: "Croatia", flag: "🇭🇷", currency: "EUR"},
  {code: "CY", name: "Cyprus", flag: "🇨🇾", currency: "EUR"},
  {code: "CZ", name: "Czechia", flag: "🇨🇿", currency: "CZK"},
  {code: "DK", name: "Denmark", flag: "🇩🇰", currency: "DKK"},
  {code: "EE", name: "Estonia", flag: "🇪🇪", currency: "EUR"},
  {code: "FI", name: "Finland", flag: "🇫🇮", currency: "EUR"},
  {code: "FR", name: "France", flag: "🇫🇷", currency: "EUR"},
  {code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR"},
  {code: "GR", name: "Greece", flag: "🇬🇷", currency: "EUR"},
  {code: "HU", name: "Hungary", flag: "🇭🇺", currency: "HUF"},
  {code: "IS", name: "Iceland", flag: "🇮🇸", currency: "ISK"},
  {code: "IE", name: "Ireland", flag: "🇮🇪", currency: "EUR"},
  {code: "IT", name: "Italy", flag: "🇮🇹", currency: "EUR"},
  {code: "XK", name: "Kosovo", flag: "🇽🇰", currency: "EUR"},
  {code: "LV", name: "Latvia", flag: "🇱🇻", currency: "EUR"},
  {code: "LI", name: "Liechtenstein", flag: "🇱🇮", currency: "CHF"},
  {code: "LT", name: "Lithuania", flag: "🇱🇹", currency: "EUR"},
  {code: "LU", name: "Luxembourg", flag: "🇱🇺", currency: "EUR"},
  {code: "MT", name: "Malta", flag: "🇲🇹", currency: "EUR"},
  {code: "MD", name: "Moldova", flag: "🇲🇩", currency: "MDL"},
  {code: "MC", name: "Monaco", flag: "🇲🇨", currency: "EUR"},
  {code: "ME", name: "Montenegro", flag: "🇲🇪", currency: "EUR"},
  {code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR"},
  {code: "MK", name: "North Macedonia", flag: "🇲🇰", currency: "MKD"},
  {code: "NO", name: "Norway", flag: "🇳🇴", currency: "NOK"},
  {code: "PL", name: "Poland", flag: "🇵🇱", currency: "PLN"},
  {code: "PT", name: "Portugal", flag: "🇵🇹", currency: "EUR"},
  {code: "RO", name: "Romania", flag: "🇷🇴", currency: "RON"},
  {code: "RU", name: "Russia", flag: "🇷🇺", currency: "RUB"},
  {code: "SM", name: "San Marino", flag: "🇸🇲", currency: "EUR"},
  {code: "RS", name: "Serbia", flag: "🇷🇸", currency: "RSD"},
  {code: "SK", name: "Slovakia", flag: "🇸🇰", currency: "EUR"},
  {code: "SI", name: "Slovenia", flag: "🇸🇮", currency: "EUR"},
  {code: "ES", name: "Spain", flag: "🇪🇸", currency: "EUR"},
  {code: "SE", name: "Sweden", flag: "🇸🇪", currency: "SEK"},
  {code: "CH", name: "Switzerland", flag: "🇨🇭", currency: "CHF"},
  {code: "UA", name: "Ukraine", flag: "🇺🇦", currency: "UAH"},
  {code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP"},
  {code: "VA", name: "Vatican City", flag: "🇻🇦", currency: "EUR"},

  // ── Asia & Middle East ───────────────────────────────────────────────────────
  {code: "AF", name: "Afghanistan", flag: "🇦🇫", currency: "AFN"},
  {code: "AM", name: "Armenia", flag: "🇦🇲", currency: "AMD"},
  {code: "AZ", name: "Azerbaijan", flag: "🇦🇿", currency: "AZN"},
  {code: "BH", name: "Bahrain", flag: "🇧🇭", currency: "BHD"},
  {code: "BD", name: "Bangladesh", flag: "🇧🇩", currency: "BDT"},
  {code: "BT", name: "Bhutan", flag: "🇧🇹", currency: "BTN"},
  {code: "BN", name: "Brunei", flag: "🇧🇳", currency: "BND"},
  {code: "KH", name: "Cambodia", flag: "🇰🇭", currency: "KHR"},
  {code: "CN", name: "China", flag: "🇨🇳", currency: "CNY"},
  {code: "GE", name: "Georgia", flag: "🇬🇪", currency: "GEL"},
  {code: "HK", name: "Hong Kong", flag: "🇭🇰", currency: "HKD"},
  {code: "IN", name: "India", flag: "🇮🇳", currency: "INR"},
  {code: "ID", name: "Indonesia", flag: "🇮🇩", currency: "IDR"},
  {code: "IR", name: "Iran", flag: "🇮🇷", currency: "IRR"},
  {code: "IQ", name: "Iraq", flag: "🇮🇶", currency: "IQD"},
  {code: "IL", name: "Israel", flag: "🇮🇱", currency: "ILS"},
  {code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY"},
  {code: "JO", name: "Jordan", flag: "🇯🇴", currency: "JOD"},
  {code: "KZ", name: "Kazakhstan", flag: "🇰🇿", currency: "KZT"},
  {code: "KW", name: "Kuwait", flag: "🇰🇼", currency: "KWD"},
  {code: "KG", name: "Kyrgyzstan", flag: "🇰🇬", currency: "KGS"},
  {code: "LA", name: "Laos", flag: "🇱🇦", currency: "LAK"},
  {code: "LB", name: "Lebanon", flag: "🇱🇧", currency: "LBP"},
  {code: "MO", name: "Macao", flag: "🇲🇴", currency: "MOP"},
  {code: "MY", name: "Malaysia", flag: "🇲🇾", currency: "MYR"},
  {code: "MV", name: "Maldives", flag: "🇲🇻", currency: "MVR"},
  {code: "MN", name: "Mongolia", flag: "🇲🇳", currency: "MNT"},
  {code: "MM", name: "Myanmar", flag: "🇲🇲", currency: "MMK"},
  {code: "NP", name: "Nepal", flag: "🇳🇵", currency: "NPR"},
  {code: "KP", name: "North Korea", flag: "🇰🇵", currency: "KPW"},
  {code: "OM", name: "Oman", flag: "🇴🇲", currency: "OMR"},
  {code: "PK", name: "Pakistan", flag: "🇵🇰", currency: "PKR"},
  {code: "PS", name: "Palestine", flag: "🇵🇸", currency: "ILS"},
  {code: "PH", name: "Philippines", flag: "🇵🇭", currency: "PHP"},
  {code: "QA", name: "Qatar", flag: "🇶🇦", currency: "QAR"},
  {code: "SA", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR"},
  {code: "SG", name: "Singapore", flag: "🇸🇬", currency: "SGD"},
  {code: "KR", name: "South Korea", flag: "🇰🇷", currency: "KRW"},
  {code: "LK", name: "Sri Lanka", flag: "🇱🇰", currency: "LKR"},
  {code: "SY", name: "Syria", flag: "🇸🇾", currency: "SYP"},
  {code: "TW", name: "Taiwan", flag: "🇹🇼", currency: "TWD"},
  {code: "TJ", name: "Tajikistan", flag: "🇹🇯", currency: "TJS"},
  {code: "TH", name: "Thailand", flag: "🇹🇭", currency: "THB"},
  {code: "TL", name: "Timor-Leste", flag: "🇹🇱", currency: "USD"},
  {code: "TR", name: "Turkey", flag: "🇹🇷", currency: "TRY"},
  {code: "TM", name: "Turkmenistan", flag: "🇹🇲", currency: "TMT"},
  {code: "AE", name: "UAE", flag: "🇦🇪", currency: "AED"},
  {code: "UZ", name: "Uzbekistan", flag: "🇺🇿", currency: "UZS"},
  {code: "VN", name: "Vietnam", flag: "🇻🇳", currency: "VND"},
  {code: "YE", name: "Yemen", flag: "🇾🇪", currency: "YER"},

  // ── Oceania ──────────────────────────────────────────────────────────────────
  {code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD"},
  {code: "FJ", name: "Fiji", flag: "🇫🇯", currency: "FJD"},
  {code: "KI", name: "Kiribati", flag: "🇰🇮", currency: "AUD"},
  {code: "MH", name: "Marshall Islands", flag: "🇲🇭", currency: "USD"},
  {code: "FM", name: "Micronesia", flag: "🇫🇲", currency: "USD"},
  {code: "NR", name: "Nauru", flag: "🇳🇷", currency: "AUD"},
  {code: "NZ", name: "New Zealand", flag: "🇳🇿", currency: "NZD"},
  {code: "PW", name: "Palau", flag: "🇵🇼", currency: "USD"},
  {code: "PG", name: "Papua New Guinea", flag: "🇵🇬", currency: "PGK"},
  {code: "WS", name: "Samoa", flag: "🇼🇸", currency: "WST"},
  {code: "SB", name: "Solomon Islands", flag: "🇸🇧", currency: "SBD"},
  {code: "TO", name: "Tonga", flag: "🇹🇴", currency: "TOP"},
  {code: "TV", name: "Tuvalu", flag: "🇹🇻", currency: "AUD"},
  {code: "VU", name: "Vanuatu", flag: "🇻🇺", currency: "VUV"},
];

// Alphabetically sorted master list
const COUNTRIES = [...CURRENCY_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

// ─── Helper to find country by currency code ─────────────────────────────────
function findByCurrency(currencyCode) {
  if (!currencyCode) return COUNTRIES.find((c) => c.currency === "NGN") || COUNTRIES[0];
  return COUNTRIES.find((c) => c.currency === currencyCode.toUpperCase()) || COUNTRIES[0];
}

// ─── CurrencyInput Component ──────────────────────────────────────────────────
export default function CurrencyInput({
  value = "NGN",
  onChange,
  error,
  label,
  placeholder = "Select currency...",
  disabled = false,
}) {
  const selected = findByCurrency(value);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [dropdownWidth, setDropdownWidth] = useState(0);
  const buttonRef = useRef(null);
  const dropRef = useRef(null);
  const searchRef = useRef(null);

  // Measure button width for dropdown
  useEffect(() => {
    if (buttonRef.current) {
      setDropdownWidth(buttonRef.current.offsetWidth);
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) && 
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) searchRef.current.focus();
  }, [open]);

  const handleSelect = (country) => {
    onChange?.(country.currency);
    setOpen(false);
    setSearch("");
  };

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.currency.toLowerCase().includes(search.toLowerCase()) ||
          (CURRENCY_NAMES[c.currency] || "").toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const symbol = CURRENCY_SYMBOLS[selected.currency] || selected.currency;
  const currencyName = CURRENCY_NAMES[selected.currency] || selected.currency;

  return (
    <div style={{position: "relative"}}>
      {label && (
        <label
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.05em",
            display: "block",
            marginBottom: 6,
          }}>
          {label}
        </label>
      )}

      {/* ── Main trigger button ── */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 14px",
          background: "rgba(255,255,255,0.05)",
          border: `1px solid ${error ? "#ef4444" : focused ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 9,
          cursor: disabled ? "not-allowed" : "pointer",
          color: "#fff",
          fontSize: 13,
          fontFamily: "inherit",
          transition: "border-color 0.2s",
          textAlign: "left",
          opacity: disabled ? 0.5 : 1,
        }}>
        <div style={{display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0}}>
          <span style={{fontSize: 18, lineHeight: 1, flexShrink: 0}}>{selected.flag}</span>
          <div style={{flex: 1, minWidth: 0}}>
            <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 2}}>
              <span style={{fontWeight: 700, fontSize: 13}}>{selected.currency}</span>
              <span
                style={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "monospace",
                }}>
                {symbol}
              </span>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
              {currencyName} • {selected.name}
            </p>
          </div>
        </div>
        <svg
          width="10"
          height="10"
          fill="none"
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          style={{
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "none",
            flexShrink: 0,
          }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Error message */}
      {error && (
        <p style={{color: "#ef4444", fontSize: 10, fontWeight: 700, margin: "4px 0 0"}}>
          {error}
        </p>
      )}

      {/* ── Dropdown (Portal-style with fixed positioning) ── */}
      {open && (
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: buttonRef.current?.getBoundingClientRect().bottom + window.scrollY + 6 || 0,
            left: buttonRef.current?.getBoundingClientRect().left + window.scrollX || 0,
            width: dropdownWidth || "100%",
            zIndex: 99999,
            background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
            overflow: "hidden",
          }}>
          {/* Search */}
          <div style={{padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)"}}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 8,
                padding: "8px 10px",
              }}>
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search currency, country, or code…"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 12,
                  fontFamily: "inherit",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.3)",
                    padding: 0,
                    fontSize: 16,
                    lineHeight: 1,
                  }}>
                  ×
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{maxHeight: 280, overflowY: "auto"}}>
            {filtered.length === 0 ? (
              <p
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 12,
                  textAlign: "center",
                  padding: "20px",
                }}>
                No results for "{search}"
              </p>
            ) : (
              filtered.map((c) => {
                const isSelected = selected.currency === c.currency;
                const sym = CURRENCY_SYMBOLS[c.currency] || c.currency;
                const name = CURRENCY_NAMES[c.currency] || c.currency;

                return (
                  <button
                    key={`${c.code}-${c.currency}`}
                    type="button"
                    onClick={() => handleSelect(c)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: isSelected ? "rgba(239,68,68,0.1)" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "transparent";
                    }}>
                    <span style={{fontSize: 18, lineHeight: 1, flexShrink: 0}}>{c.flag}</span>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{display: "flex", alignItems: "center", gap: 8, marginBottom: 2}}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: isSelected ? "#fff" : "rgba(255,255,255,0.8)",
                          }}>
                          {c.currency}
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color: isSelected
                              ? "rgba(239,68,68,0.8)"
                              : "rgba(255,255,255,0.4)",
                            fontFamily: "monospace",
                          }}>
                          {sym}
                        </span>
                      </div>
                      <p
                        style={{
                          color: "rgba(255,255,255,0.35)",
                          fontSize: 11,
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                        {name} • {c.name}
                      </p>
                    </div>
                    {isSelected && (
                      <svg
                        width="10"
                        height="10"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        style={{flexShrink: 0}}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "8px 14px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
            <span style={{fontSize: 18}}>{selected.flag}</span>
            <div>
              <p style={{color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0}}>
                Selected: <strong style={{color: "rgba(255,255,255,0.5)"}}>{selected.currency}</strong>{" "}
                {symbol}
              </p>
              <p style={{color: "rgba(255,255,255,0.18)", fontSize: 9, margin: 0}}>
                {filtered.length} {filtered.length === 1 ? "currency" : "currencies"} shown
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}