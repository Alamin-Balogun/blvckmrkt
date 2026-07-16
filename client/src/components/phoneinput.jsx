import {useState, useEffect, useRef} from "react";

/**
 * PhoneInput — country-flag phone input with E.164 output.
 *
 * Country data is embedded directly (like currencycontext.jsx embeds exchange
 * rate fallbacks). Phone dial codes and national formats are ITU-standard data
 * that changes at most once or twice a decade — a static dataset is the right
 * call: zero network dependency, zero latency, works offline, never fails.
 *
 * All ~240 ITU-recognised countries/territories are included.
 * Sorted alphabetically in the dropdown with a live search box.
 *
 * Props:
 *   value          — E.164 string e.g. "+2348012345678" (controlled)
 *   onChange       — called with full E.164 string whenever value changes
 *   onValidChange  — called with boolean (true = valid or empty, false = invalid)
 *   defaultCountry — ISO-2 code e.g. "NG" — sets the flag/dial prefix when
 *                    value is empty. Changing while field is empty switches flag.
 *                    If the user has already typed a number it is left alone.
 *   error          — external error string (e.g. from form validation step)
 */

// ─── Complete world phone data ────────────────────────────────────────────────
// Fields:
//   code        ISO 3166-1 alpha-2
//   name        English country name
//   flag        Emoji flag
//   dial        ITU calling code (string, no "+")
//   digits      Expected subscriber number length (after stripping leading zero)
//   leadingZero Whether the national format opens with 0 (e.g. 0801…)
//   example     Typical local format used as placeholder
const PHONE_COUNTRIES = [
  // ── Africa ──────────────────────────────────────────────────────────────────
  { code:"DZ", name:"Algeria",                  flag:"🇩🇿", dial:"213", digits:9,  leadingZero:false, example:"0551 23 45 67" },
  { code:"AO", name:"Angola",                   flag:"🇦🇴", dial:"244", digits:9,  leadingZero:false, example:"923 123 456" },
  { code:"BJ", name:"Benin",                    flag:"🇧🇯", dial:"229", digits:8,  leadingZero:false, example:"90 12 34 56" },
  { code:"BW", name:"Botswana",                 flag:"🇧🇼", dial:"267", digits:8,  leadingZero:false, example:"71 234 567" },
  { code:"BF", name:"Burkina Faso",             flag:"🇧🇫", dial:"226", digits:8,  leadingZero:false, example:"70 12 34 56" },
  { code:"BI", name:"Burundi",                  flag:"🇧🇮", dial:"257", digits:8,  leadingZero:false, example:"79 123 456" },
  { code:"CV", name:"Cabo Verde",               flag:"🇨🇻", dial:"238", digits:7,  leadingZero:false, example:"991 23 45" },
  { code:"CM", name:"Cameroon",                 flag:"🇨🇲", dial:"237", digits:9,  leadingZero:false, example:"671 234 567" },
  { code:"CF", name:"Central African Republic", flag:"🇨🇫", dial:"236", digits:8,  leadingZero:false, example:"72 12 34 56" },
  { code:"TD", name:"Chad",                     flag:"🇹🇩", dial:"235", digits:8,  leadingZero:false, example:"63 12 34 56" },
  { code:"KM", name:"Comoros",                  flag:"🇰🇲", dial:"269", digits:7,  leadingZero:false, example:"321 23 45" },
  { code:"CG", name:"Congo",                    flag:"🇨🇬", dial:"242", digits:9,  leadingZero:false, example:"06 123 4567" },
  { code:"CD", name:"Congo (DRC)",              flag:"🇨🇩", dial:"243", digits:9,  leadingZero:false, example:"081 234 5678" },
  { code:"CI", name:"Côte d'Ivoire",            flag:"🇨🇮", dial:"225", digits:10, leadingZero:false, example:"07 12 34 56 78" },
  { code:"DJ", name:"Djibouti",                 flag:"🇩🇯", dial:"253", digits:8,  leadingZero:false, example:"77 83 10 01" },
  { code:"EG", name:"Egypt",                    flag:"🇪🇬", dial:"20",  digits:10, leadingZero:true,  example:"0101 234 5678" },
  { code:"GQ", name:"Equatorial Guinea",        flag:"🇬🇶", dial:"240", digits:9,  leadingZero:false, example:"222 123 456" },
  { code:"ER", name:"Eritrea",                  flag:"🇪🇷", dial:"291", digits:7,  leadingZero:true,  example:"071 234 56" },
  { code:"SZ", name:"Eswatini",                 flag:"🇸🇿", dial:"268", digits:8,  leadingZero:false, example:"7612 3456" },
  { code:"ET", name:"Ethiopia",                 flag:"🇪🇹", dial:"251", digits:9,  leadingZero:true,  example:"091 123 4567" },
  { code:"GA", name:"Gabon",                    flag:"🇬🇦", dial:"241", digits:8,  leadingZero:false, example:"06 03 12 34" },
  { code:"GM", name:"Gambia",                   flag:"🇬🇲", dial:"220", digits:7,  leadingZero:false, example:"301 2345" },
  { code:"GH", name:"Ghana",                    flag:"🇬🇭", dial:"233", digits:9,  leadingZero:true,  example:"024 123 4567" },
  { code:"GN", name:"Guinea",                   flag:"🇬🇳", dial:"224", digits:9,  leadingZero:false, example:"601 12 34 56" },
  { code:"GW", name:"Guinea-Bissau",            flag:"🇬🇼", dial:"245", digits:9,  leadingZero:false, example:"955 012 345" },
  { code:"KE", name:"Kenya",                    flag:"🇰🇪", dial:"254", digits:9,  leadingZero:true,  example:"0712 345 678" },
  { code:"LS", name:"Lesotho",                  flag:"🇱🇸", dial:"266", digits:8,  leadingZero:false, example:"5012 3456" },
  { code:"LR", name:"Liberia",                  flag:"🇱🇷", dial:"231", digits:8,  leadingZero:true,  example:"077 012 3456" },
  { code:"LY", name:"Libya",                    flag:"🇱🇾", dial:"218", digits:9,  leadingZero:true,  example:"091 234 5678" },
  { code:"MG", name:"Madagascar",               flag:"🇲🇬", dial:"261", digits:9,  leadingZero:true,  example:"032 12 345 67" },
  { code:"MW", name:"Malawi",                   flag:"🇲🇼", dial:"265", digits:9,  leadingZero:true,  example:"0991 23 45 67" },
  { code:"ML", name:"Mali",                     flag:"🇲🇱", dial:"223", digits:8,  leadingZero:false, example:"65 01 23 45" },
  { code:"MR", name:"Mauritania",               flag:"🇲🇷", dial:"222", digits:8,  leadingZero:false, example:"22 12 34 56" },
  { code:"MU", name:"Mauritius",                flag:"🇲🇺", dial:"230", digits:8,  leadingZero:false, example:"5251 2345" },
  { code:"MA", name:"Morocco",                  flag:"🇲🇦", dial:"212", digits:9,  leadingZero:true,  example:"0612 345 678" },
  { code:"MZ", name:"Mozambique",               flag:"🇲🇿", dial:"258", digits:9,  leadingZero:false, example:"82 123 4567" },
  { code:"NA", name:"Namibia",                  flag:"🇳🇦", dial:"264", digits:9,  leadingZero:true,  example:"081 123 4567" },
  { code:"NE", name:"Niger",                    flag:"🇳🇪", dial:"227", digits:8,  leadingZero:false, example:"93 12 34 56" },
  { code:"NG", name:"Nigeria",                  flag:"🇳🇬", dial:"234", digits:10, leadingZero:true,  example:"0801 234 5678" },
  { code:"RW", name:"Rwanda",                   flag:"🇷🇼", dial:"250", digits:9,  leadingZero:true,  example:"0781 234 567" },
  { code:"ST", name:"São Tomé & Príncipe",      flag:"🇸🇹", dial:"239", digits:7,  leadingZero:false, example:"981 2345" },
  { code:"SN", name:"Senegal",                  flag:"🇸🇳", dial:"221", digits:9,  leadingZero:false, example:"77 123 45 67" },
  { code:"SC", name:"Seychelles",               flag:"🇸🇨", dial:"248", digits:7,  leadingZero:false, example:"251 2345" },
  { code:"SL", name:"Sierra Leone",             flag:"🇸🇱", dial:"232", digits:8,  leadingZero:true,  example:"076 123 456" },
  { code:"SO", name:"Somalia",                  flag:"🇸🇴", dial:"252", digits:8,  leadingZero:false, example:"61 1234567" },
  { code:"ZA", name:"South Africa",             flag:"🇿🇦", dial:"27",  digits:9,  leadingZero:true,  example:"071 234 5678" },
  { code:"SS", name:"South Sudan",              flag:"🇸🇸", dial:"211", digits:9,  leadingZero:true,  example:"091 234 5678" },
  { code:"SD", name:"Sudan",                    flag:"🇸🇩", dial:"249", digits:9,  leadingZero:true,  example:"091 123 1234" },
  { code:"TZ", name:"Tanzania",                 flag:"🇹🇿", dial:"255", digits:9,  leadingZero:true,  example:"0712 345 678" },
  { code:"TG", name:"Togo",                     flag:"🇹🇬", dial:"228", digits:8,  leadingZero:false, example:"90 11 23 45" },
  { code:"TN", name:"Tunisia",                  flag:"🇹🇳", dial:"216", digits:8,  leadingZero:false, example:"20 123 456" },
  { code:"UG", name:"Uganda",                   flag:"🇺🇬", dial:"256", digits:9,  leadingZero:true,  example:"0712 345 678" },
  { code:"ZM", name:"Zambia",                   flag:"🇿🇲", dial:"260", digits:9,  leadingZero:true,  example:"097 1234567" },
  { code:"ZW", name:"Zimbabwe",                 flag:"🇿🇼", dial:"263", digits:9,  leadingZero:true,  example:"071 234 5678" },

  // ── Americas ─────────────────────────────────────────────────────────────────
  { code:"AG", name:"Antigua & Barbuda",        flag:"🇦🇬", dial:"1268",digits:7,  leadingZero:false, example:"464-1234" },
  { code:"AR", name:"Argentina",                flag:"🇦🇷", dial:"54",  digits:10, leadingZero:false, example:"911 123 4567" },
  { code:"BS", name:"Bahamas",                  flag:"🇧🇸", dial:"1242",digits:7,  leadingZero:false, example:"359-1234" },
  { code:"BB", name:"Barbados",                 flag:"🇧🇧", dial:"1246",digits:7,  leadingZero:false, example:"230-1234" },
  { code:"BZ", name:"Belize",                   flag:"🇧🇿", dial:"501", digits:7,  leadingZero:false, example:"622-1234" },
  { code:"BO", name:"Bolivia",                  flag:"🇧🇴", dial:"591", digits:8,  leadingZero:false, example:"71234567" },
  { code:"BR", name:"Brazil",                   flag:"🇧🇷", dial:"55",  digits:11, leadingZero:false, example:"(11) 91234-5678" },
  { code:"CA", name:"Canada",                   flag:"🇨🇦", dial:"1",   digits:10, leadingZero:false, example:"(416) 555-1234" },
  { code:"CL", name:"Chile",                    flag:"🇨🇱", dial:"56",  digits:9,  leadingZero:false, example:"9 1234 5678" },
  { code:"CO", name:"Colombia",                 flag:"🇨🇴", dial:"57",  digits:10, leadingZero:false, example:"321 123 4567" },
  { code:"CR", name:"Costa Rica",               flag:"🇨🇷", dial:"506", digits:8,  leadingZero:false, example:"8312 3456" },
  { code:"CU", name:"Cuba",                     flag:"🇨🇺", dial:"53",  digits:8,  leadingZero:true,  example:"051 23456" },
  { code:"DM", name:"Dominica",                 flag:"🇩🇲", dial:"1767",digits:7,  leadingZero:false, example:"275-1234" },
  { code:"DO", name:"Dominican Republic",       flag:"🇩🇴", dial:"1",   digits:10, leadingZero:false, example:"(809) 234-5678" },
  { code:"EC", name:"Ecuador",                  flag:"🇪🇨", dial:"593", digits:9,  leadingZero:true,  example:"099 123 4567" },
  { code:"SV", name:"El Salvador",              flag:"🇸🇻", dial:"503", digits:8,  leadingZero:false, example:"7012 3456" },
  { code:"GD", name:"Grenada",                  flag:"🇬🇩", dial:"1473",digits:7,  leadingZero:false, example:"403-1234" },
  { code:"GT", name:"Guatemala",                flag:"🇬🇹", dial:"502", digits:8,  leadingZero:false, example:"5012 3456" },
  { code:"GY", name:"Guyana",                   flag:"🇬🇾", dial:"592", digits:7,  leadingZero:false, example:"609 1234" },
  { code:"HT", name:"Haiti",                    flag:"🇭🇹", dial:"509", digits:8,  leadingZero:false, example:"34 10 1234" },
  { code:"HN", name:"Honduras",                 flag:"🇭🇳", dial:"504", digits:8,  leadingZero:false, example:"9812 3456" },
  { code:"JM", name:"Jamaica",                  flag:"🇯🇲", dial:"1876",digits:7,  leadingZero:false, example:"210-1234" },
  { code:"MX", name:"Mexico",                   flag:"🇲🇽", dial:"52",  digits:10, leadingZero:false, example:"555 123 4567" },
  { code:"NI", name:"Nicaragua",                flag:"🇳🇮", dial:"505", digits:8,  leadingZero:false, example:"8412 3456" },
  { code:"PA", name:"Panama",                   flag:"🇵🇦", dial:"507", digits:8,  leadingZero:false, example:"6001 2345" },
  { code:"PY", name:"Paraguay",                 flag:"🇵🇾", dial:"595", digits:9,  leadingZero:false, example:"961 456789" },
  { code:"PE", name:"Peru",                     flag:"🇵🇪", dial:"51",  digits:9,  leadingZero:false, example:"912 345 678" },
  { code:"KN", name:"Saint Kitts & Nevis",      flag:"🇰🇳", dial:"1869",digits:7,  leadingZero:false, example:"765-2917" },
  { code:"LC", name:"Saint Lucia",              flag:"🇱🇨", dial:"1758",digits:7,  leadingZero:false, example:"284-5678" },
  { code:"VC", name:"St. Vincent & Grenadines", flag:"🇻🇨", dial:"1784",digits:7,  leadingZero:false, example:"430-1234" },
  { code:"SR", name:"Suriname",                 flag:"🇸🇷", dial:"597", digits:7,  leadingZero:false, example:"741-2345" },
  { code:"TT", name:"Trinidad & Tobago",        flag:"🇹🇹", dial:"1868",digits:7,  leadingZero:false, example:"291-1234" },
  { code:"US", name:"United States",            flag:"🇺🇸", dial:"1",   digits:10, leadingZero:false, example:"(555) 234-5678" },
  { code:"UY", name:"Uruguay",                  flag:"🇺🇾", dial:"598", digits:8,  leadingZero:false, example:"094 123 456" },
  { code:"VE", name:"Venezuela",                flag:"🇻🇪", dial:"58",  digits:10, leadingZero:true,  example:"0412 123 4567" },

  // ── Europe ────────────────────────────────────────────────────────────────────
  { code:"AL", name:"Albania",                  flag:"🇦🇱", dial:"355", digits:9,  leadingZero:true,  example:"066 123 4567" },
  { code:"AD", name:"Andorra",                  flag:"🇦🇩", dial:"376", digits:6,  leadingZero:false, example:"312 345" },
  { code:"AT", name:"Austria",                  flag:"🇦🇹", dial:"43",  digits:10, leadingZero:true,  example:"0664 123 456 78" },
  { code:"BY", name:"Belarus",                  flag:"🇧🇾", dial:"375", digits:9,  leadingZero:true,  example:"044 123 4567" },
  { code:"BE", name:"Belgium",                  flag:"🇧🇪", dial:"32",  digits:9,  leadingZero:true,  example:"0470 12 34 56" },
  { code:"BA", name:"Bosnia & Herzegovina",     flag:"🇧🇦", dial:"387", digits:8,  leadingZero:true,  example:"061 123 456" },
  { code:"BG", name:"Bulgaria",                 flag:"🇧🇬", dial:"359", digits:9,  leadingZero:true,  example:"087 123 4567" },
  { code:"HR", name:"Croatia",                  flag:"🇭🇷", dial:"385", digits:9,  leadingZero:true,  example:"091 234 5678" },
  { code:"CY", name:"Cyprus",                   flag:"🇨🇾", dial:"357", digits:8,  leadingZero:false, example:"96 123456" },
  { code:"CZ", name:"Czechia",                  flag:"🇨🇿", dial:"420", digits:9,  leadingZero:false, example:"601 123 456" },
  { code:"DK", name:"Denmark",                  flag:"🇩🇰", dial:"45",  digits:8,  leadingZero:false, example:"20 12 34 56" },
  { code:"EE", name:"Estonia",                  flag:"🇪🇪", dial:"372", digits:8,  leadingZero:false, example:"5123 4567" },
  { code:"FI", name:"Finland",                  flag:"🇫🇮", dial:"358", digits:9,  leadingZero:true,  example:"041 234 5678" },
  { code:"FR", name:"France",                   flag:"🇫🇷", dial:"33",  digits:9,  leadingZero:true,  example:"06 12 34 56 78" },
  { code:"DE", name:"Germany",                  flag:"🇩🇪", dial:"49",  digits:10, leadingZero:true,  example:"0151 2345 6789" },
  { code:"GR", name:"Greece",                   flag:"🇬🇷", dial:"30",  digits:10, leadingZero:false, example:"694 123 4567" },
  { code:"HU", name:"Hungary",                  flag:"🇭🇺", dial:"36",  digits:9,  leadingZero:true,  example:"06 30 123 4567" },
  { code:"IS", name:"Iceland",                  flag:"🇮🇸", dial:"354", digits:7,  leadingZero:false, example:"611 1234" },
  { code:"IE", name:"Ireland",                  flag:"🇮🇪", dial:"353", digits:9,  leadingZero:true,  example:"085 123 4567" },
  { code:"IT", name:"Italy",                    flag:"🇮🇹", dial:"39",  digits:10, leadingZero:false, example:"312 345 6789" },
  { code:"XK", name:"Kosovo",                   flag:"🇽🇰", dial:"383", digits:8,  leadingZero:true,  example:"043 123 456" },
  { code:"LV", name:"Latvia",                   flag:"🇱🇻", dial:"371", digits:8,  leadingZero:false, example:"21 234 567" },
  { code:"LI", name:"Liechtenstein",            flag:"🇱🇮", dial:"423", digits:7,  leadingZero:false, example:"660 1234" },
  { code:"LT", name:"Lithuania",                flag:"🇱🇹", dial:"370", digits:8,  leadingZero:true,  example:"061 234 567" },
  { code:"LU", name:"Luxembourg",               flag:"🇱🇺", dial:"352", digits:9,  leadingZero:false, example:"621 123 456" },
  { code:"MT", name:"Malta",                    flag:"🇲🇹", dial:"356", digits:8,  leadingZero:false, example:"9901 2345" },
  { code:"MD", name:"Moldova",                  flag:"🇲🇩", dial:"373", digits:8,  leadingZero:true,  example:"069 123 456" },
  { code:"MC", name:"Monaco",                   flag:"🇲🇨", dial:"377", digits:8,  leadingZero:false, example:"06 12 34 56 78" },
  { code:"ME", name:"Montenegro",               flag:"🇲🇪", dial:"382", digits:8,  leadingZero:true,  example:"067 123 456" },
  { code:"NL", name:"Netherlands",              flag:"🇳🇱", dial:"31",  digits:9,  leadingZero:true,  example:"06 1234 5678" },
  { code:"MK", name:"North Macedonia",          flag:"🇲🇰", dial:"389", digits:8,  leadingZero:true,  example:"070 123 456" },
  { code:"NO", name:"Norway",                   flag:"🇳🇴", dial:"47",  digits:8,  leadingZero:false, example:"412 34 567" },
  { code:"PL", name:"Poland",                   flag:"🇵🇱", dial:"48",  digits:9,  leadingZero:false, example:"512 345 678" },
  { code:"PT", name:"Portugal",                 flag:"🇵🇹", dial:"351", digits:9,  leadingZero:false, example:"912 345 678" },
  { code:"RO", name:"Romania",                  flag:"🇷🇴", dial:"40",  digits:9,  leadingZero:true,  example:"0712 345 678" },
  { code:"RU", name:"Russia",                   flag:"🇷🇺", dial:"7",   digits:10, leadingZero:false, example:"912 345 6789" },
  { code:"SM", name:"San Marino",               flag:"🇸🇲", dial:"378", digits:10, leadingZero:false, example:"66 66 12 34 56" },
  { code:"RS", name:"Serbia",                   flag:"🇷🇸", dial:"381", digits:9,  leadingZero:true,  example:"060 123 4567" },
  { code:"SK", name:"Slovakia",                 flag:"🇸🇰", dial:"421", digits:9,  leadingZero:true,  example:"0901 234 567" },
  { code:"SI", name:"Slovenia",                 flag:"🇸🇮", dial:"386", digits:8,  leadingZero:true,  example:"040 123 456" },
  { code:"ES", name:"Spain",                    flag:"🇪🇸", dial:"34",  digits:9,  leadingZero:false, example:"612 345 678" },
  { code:"SE", name:"Sweden",                   flag:"🇸🇪", dial:"46",  digits:9,  leadingZero:true,  example:"070 123 4567" },
  { code:"CH", name:"Switzerland",              flag:"🇨🇭", dial:"41",  digits:9,  leadingZero:true,  example:"075 123 4567" },
  { code:"UA", name:"Ukraine",                  flag:"🇺🇦", dial:"380", digits:9,  leadingZero:true,  example:"050 123 4567" },
  { code:"GB", name:"United Kingdom",           flag:"🇬🇧", dial:"44",  digits:10, leadingZero:true,  example:"07911 123456" },
  { code:"VA", name:"Vatican City",             flag:"🇻🇦", dial:"39",  digits:10, leadingZero:false, example:"06 6982 0001" },

  // ── Asia & Middle East ───────────────────────────────────────────────────────
  { code:"AF", name:"Afghanistan",              flag:"🇦🇫", dial:"93",  digits:9,  leadingZero:true,  example:"070 123 4567" },
  { code:"AM", name:"Armenia",                  flag:"🇦🇲", dial:"374", digits:8,  leadingZero:true,  example:"077 123 456" },
  { code:"AZ", name:"Azerbaijan",               flag:"🇦🇿", dial:"994", digits:9,  leadingZero:true,  example:"040 123 4567" },
  { code:"BH", name:"Bahrain",                  flag:"🇧🇭", dial:"973", digits:8,  leadingZero:false, example:"3600 1234" },
  { code:"BD", name:"Bangladesh",               flag:"🇧🇩", dial:"880", digits:10, leadingZero:true,  example:"01712 345678" },
  { code:"BT", name:"Bhutan",                   flag:"🇧🇹", dial:"975", digits:8,  leadingZero:false, example:"17 12 34 56" },
  { code:"BN", name:"Brunei",                   flag:"🇧🇳", dial:"673", digits:7,  leadingZero:false, example:"712 3456" },
  { code:"KH", name:"Cambodia",                 flag:"🇰🇭", dial:"855", digits:9,  leadingZero:true,  example:"012 345 678" },
  { code:"CN", name:"China",                    flag:"🇨🇳", dial:"86",  digits:11, leadingZero:false, example:"131 2345 6789" },
  { code:"GE", name:"Georgia",                  flag:"🇬🇪", dial:"995", digits:9,  leadingZero:true,  example:"555 12 34 56" },
  { code:"HK", name:"Hong Kong",                flag:"🇭🇰", dial:"852", digits:8,  leadingZero:false, example:"9123 4567" },
  { code:"IN", name:"India",                    flag:"🇮🇳", dial:"91",  digits:10, leadingZero:false, example:"98765 43210" },
  { code:"ID", name:"Indonesia",                flag:"🇮🇩", dial:"62",  digits:10, leadingZero:true,  example:"0812 3456 7890" },
  { code:"IR", name:"Iran",                     flag:"🇮🇷", dial:"98",  digits:10, leadingZero:true,  example:"0912 345 6789" },
  { code:"IQ", name:"Iraq",                     flag:"🇮🇶", dial:"964", digits:10, leadingZero:true,  example:"0791 234 5678" },
  { code:"IL", name:"Israel",                   flag:"🇮🇱", dial:"972", digits:9,  leadingZero:true,  example:"050-123-4567" },
  { code:"JP", name:"Japan",                    flag:"🇯🇵", dial:"81",  digits:10, leadingZero:true,  example:"080-1234-5678" },
  { code:"JO", name:"Jordan",                   flag:"🇯🇴", dial:"962", digits:9,  leadingZero:true,  example:"079 012 3456" },
  { code:"KZ", name:"Kazakhstan",               flag:"🇰🇿", dial:"7",   digits:10, leadingZero:true,  example:"701 234 5678" },
  { code:"KW", name:"Kuwait",                   flag:"🇰🇼", dial:"965", digits:8,  leadingZero:false, example:"5012 3456" },
  { code:"KG", name:"Kyrgyzstan",               flag:"🇰🇬", dial:"996", digits:9,  leadingZero:true,  example:"0700 123 456" },
  { code:"LA", name:"Laos",                     flag:"🇱🇦", dial:"856", digits:9,  leadingZero:true,  example:"020 123 4567" },
  { code:"LB", name:"Lebanon",                  flag:"🇱🇧", dial:"961", digits:8,  leadingZero:true,  example:"03 123 456" },
  { code:"MO", name:"Macao",                    flag:"🇲🇴", dial:"853", digits:8,  leadingZero:false, example:"6612 3456" },
  { code:"MY", name:"Malaysia",                 flag:"🇲🇾", dial:"60",  digits:9,  leadingZero:true,  example:"012-345 6789" },
  { code:"MV", name:"Maldives",                 flag:"🇲🇻", dial:"960", digits:7,  leadingZero:false, example:"771 2345" },
  { code:"MN", name:"Mongolia",                 flag:"🇲🇳", dial:"976", digits:8,  leadingZero:false, example:"8812 3456" },
  { code:"MM", name:"Myanmar",                  flag:"🇲🇲", dial:"95",  digits:9,  leadingZero:true,  example:"09 212 345 678" },
  { code:"NP", name:"Nepal",                    flag:"🇳🇵", dial:"977", digits:10, leadingZero:true,  example:"098 412 3456" },
  { code:"KP", name:"North Korea",              flag:"🇰🇵", dial:"850", digits:10, leadingZero:true,  example:"0191 2341234" },
  { code:"OM", name:"Oman",                     flag:"🇴🇲", dial:"968", digits:8,  leadingZero:false, example:"9212 3456" },
  { code:"PK", name:"Pakistan",                 flag:"🇵🇰", dial:"92",  digits:10, leadingZero:true,  example:"0312 3456789" },
  { code:"PS", name:"Palestine",                flag:"🇵🇸", dial:"970", digits:9,  leadingZero:true,  example:"059 234 5678" },
  { code:"PH", name:"Philippines",              flag:"🇵🇭", dial:"63",  digits:10, leadingZero:true,  example:"0917 123 4567" },
  { code:"QA", name:"Qatar",                    flag:"🇶🇦", dial:"974", digits:8,  leadingZero:false, example:"3312 3456" },
  { code:"SA", name:"Saudi Arabia",             flag:"🇸🇦", dial:"966", digits:9,  leadingZero:true,  example:"0501 234 567" },
  { code:"SG", name:"Singapore",                flag:"🇸🇬", dial:"65",  digits:8,  leadingZero:false, example:"8123 4567" },
  { code:"KR", name:"South Korea",              flag:"🇰🇷", dial:"82",  digits:10, leadingZero:true,  example:"010-1234-5678" },
  { code:"LK", name:"Sri Lanka",                flag:"🇱🇰", dial:"94",  digits:9,  leadingZero:true,  example:"071 234 5678" },
  { code:"SY", name:"Syria",                    flag:"🇸🇾", dial:"963", digits:9,  leadingZero:true,  example:"094 456 1234" },
  { code:"TW", name:"Taiwan",                   flag:"🇹🇼", dial:"886", digits:9,  leadingZero:true,  example:"0912 345 678" },
  { code:"TJ", name:"Tajikistan",               flag:"🇹🇯", dial:"992", digits:9,  leadingZero:true,  example:"093 123 4567" },
  { code:"TH", name:"Thailand",                 flag:"🇹🇭", dial:"66",  digits:9,  leadingZero:true,  example:"081 234 5678" },
  { code:"TL", name:"Timor-Leste",              flag:"🇹🇱", dial:"670", digits:8,  leadingZero:false, example:"7721 2345" },
  { code:"TR", name:"Turkey",                   flag:"🇹🇷", dial:"90",  digits:10, leadingZero:true,  example:"0532 123 4567" },
  { code:"TM", name:"Turkmenistan",             flag:"🇹🇲", dial:"993", digits:8,  leadingZero:true,  example:"065 123456" },
  { code:"AE", name:"UAE",                      flag:"🇦🇪", dial:"971", digits:9,  leadingZero:true,  example:"050 123 4567" },
  { code:"UZ", name:"Uzbekistan",               flag:"🇺🇿", dial:"998", digits:9,  leadingZero:true,  example:"090 123 4567" },
  { code:"VN", name:"Vietnam",                  flag:"🇻🇳", dial:"84",  digits:9,  leadingZero:true,  example:"091 234 5678" },
  { code:"YE", name:"Yemen",                    flag:"🇾🇪", dial:"967", digits:9,  leadingZero:true,  example:"071 234 5678" },

  // ── Oceania ────────────────────────────────────────────────────────────────
  { code:"AU", name:"Australia",                flag:"🇦🇺", dial:"61",  digits:9,  leadingZero:true,  example:"0412 345 678" },
  { code:"FJ", name:"Fiji",                     flag:"🇫🇯", dial:"679", digits:7,  leadingZero:false, example:"701 2345" },
  { code:"KI", name:"Kiribati",                 flag:"🇰🇮", dial:"686", digits:8,  leadingZero:false, example:"9200 1234" },
  { code:"MH", name:"Marshall Islands",         flag:"🇲🇭", dial:"692", digits:7,  leadingZero:false, example:"235-1234" },
  { code:"FM", name:"Micronesia",               flag:"🇫🇲", dial:"691", digits:7,  leadingZero:false, example:"320-1234" },
  { code:"NR", name:"Nauru",                    flag:"🇳🇷", dial:"674", digits:7,  leadingZero:false, example:"555-1234" },
  { code:"NZ", name:"New Zealand",              flag:"🇳🇿", dial:"64",  digits:9,  leadingZero:true,  example:"021 123 4567" },
  { code:"PW", name:"Palau",                    flag:"🇵🇼", dial:"680", digits:7,  leadingZero:false, example:"775-1234" },
  { code:"PG", name:"Papua New Guinea",         flag:"🇵🇬", dial:"675", digits:8,  leadingZero:false, example:"7012 3456" },
  { code:"WS", name:"Samoa",                    flag:"🇼🇸", dial:"685", digits:7,  leadingZero:false, example:"7212345" },
  { code:"SB", name:"Solomon Islands",          flag:"🇸🇧", dial:"677", digits:7,  leadingZero:false, example:"7412 345" },
  { code:"TO", name:"Tonga",                    flag:"🇹🇴", dial:"676", digits:7,  leadingZero:false, example:"771 2345" },
  { code:"TV", name:"Tuvalu",                   flag:"🇹🇻", dial:"688", digits:6,  leadingZero:false, example:"901234" },
  { code:"VU", name:"Vanuatu",                  flag:"🇻🇺", dial:"678", digits:7,  leadingZero:false, example:"591 2345" },
];

// Alphabetically sorted master list used in the dropdown
const COUNTRIES = [...PHONE_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Parse a stored E.164 or partial phone string → {country, local}.
 * Tries longest dial-code first so "1868" (Trinidad) beats "1" (US/CA).
 */
function parseStoredPhone(stored = "") {
  if (!stored) return { country: COUNTRIES.find((c) => c.code === "NG") || COUNTRIES[0], local: "" };
  const digits = stored.replace(/\D/g, "");
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  for (const c of sorted) {
    if (digits.startsWith(c.dial)) {
      let subscriber = digits.slice(c.dial.length);
      if (c.leadingZero && !subscriber.startsWith("0")) subscriber = "0" + subscriber;
      return { country: c, local: subscriber };
    }
  }
  return { country: COUNTRIES.find((c) => c.code === "NG") || COUNTRIES[0], local: stored };
}

/** Strip leading zero before comparing against country.digits */
function extractSubscriber(raw, country) {
  return country.leadingZero && raw.startsWith("0") ? raw.slice(1) : raw;
}

/** Returns an error string or null */
function phoneError(local, country) {
  if (!local) return null;
  const raw = local.replace(/\D/g, "");
  if (raw.length === 0) return null;
  const subscriber = extractSubscriber(raw, country);
  if (subscriber.length < country.digits)
    return `Too short — need ${country.digits} digits (e.g. ${country.example})`;
  if (subscriber.length > country.digits)
    return `Too long — max ${country.digits} digits`;
  return null;
}

function findByIso(iso) {
  if (!iso) return null;
  return COUNTRIES.find((c) => c.code === iso.toUpperCase()) || null;
}

// ─── PhoneInput Component ─────────────────────────────────────────────────────
export default function PhoneInput({
  value = "",
  onChange,
  onValidChange,
  defaultCountry,
  error: externalError,
}) {
  const parsed = parseStoredPhone(value);
  const [country, setCountry] = useState(parsed.country);
  const [local, setLocal]     = useState(parsed.local);
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const dropRef   = useRef(null);
  const searchRef = useRef(null);

  // Auto-switch flag when defaultCountry prop changes and field is still empty
  useEffect(() => {
    if (!defaultCountry) return;
    const found = findByIso(defaultCountry);
    if (!found) return;
    if (!local) setCountry(found);
  }, [defaultCountry]); // intentionally omits `local`

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
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

  // Emit E.164 upstream
  useEffect(() => {
    if (!local) {
      onChange?.("");
      onValidChange?.(true);
      return;
    }
    const raw        = local.replace(/\D/g, "");
    const subscriber = extractSubscriber(raw, country);
    onChange?.(`+${country.dial}${subscriber}`);
    onValidChange?.(!phoneError(local, country));
  }, [local, country]); // eslint-disable-line

  const handleLocalChange = (e) => {
    setLocal(e.target.value.replace(/[^\d\s\-().]/g, ""));
  };

  const handleCountrySelect = (c) => {
    setCountry(c);
    setLocal("");
    setOpen(false);
    setSearch("");
  };

  const internalError = touched ? phoneError(local, country) : null;
  const err   = externalError || internalError;
  const raw   = local.replace(/\D/g, "");
  const filled = extractSubscriber(raw, country);
  const pct   = Math.min(100, Math.round((filled.length / country.digits) * 100));
  const valid  = filled.length > 0 && !phoneError(local, country);

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <div style={{ position: "relative" }}>
      {/* ── Main input row ── */}
      <div style={{
        display: "flex", alignItems: "stretch",
        border: `1px solid ${err ? "#ef4444" : focused ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 9, overflow: "hidden",
        background: "rgba(255,255,255,0.04)", transition: "border-color 0.2s",
      }}>
        {/* Country trigger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "0 12px", flexShrink: 0, cursor: "pointer",
            background: "rgba(255,255,255,0.04)",
            borderRight: "1px solid rgba(255,255,255,0.08)",
            border: "none", color: "#fff", minWidth: 90,
          }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>{country.flag}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.02em" }}>
            +{country.dial}
          </span>
          <svg
            width="10" height="10" fill="none" stroke="rgba(255,255,255,0.3)"
            strokeWidth="2.5" viewBox="0 0 24 24"
            style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Number field */}
        <input
          type="tel"
          value={local}
          onChange={handleLocalChange}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); setTouched(true); }}
          placeholder={country.example}
          maxLength={country.digits + 4}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#fff", fontSize: 13, padding: "12px 14px", fontFamily: "inherit",
          }}
        />

        {/* Green checkmark when valid */}
        {valid && (
          <div style={{ display: "flex", alignItems: "center", padding: "0 12px", flexShrink: 0 }}>
            <div style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "rgba(34,197,94,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" fill="none" stroke="#22c55e" strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar + digit count hint */}
      {local && (
        <div style={{ marginTop: 6 }}>
          <div style={{
            height: 2, background: "rgba(255,255,255,0.06)",
            borderRadius: 99, overflow: "hidden", marginBottom: 4,
          }}>
            <div style={{
              height: "100%", borderRadius: 99,
              transition: "width 0.3s, background 0.3s",
              width: `${pct}%`,
              background: err ? "#ef4444" : pct === 100 ? "#22c55e" : "#f97316",
            }} />
          </div>
          {err ? (
            <p style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, margin: 0 }}>{err}</p>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0 }}>
              {filled.length} / {country.digits} digits{valid ? " ✓" : ""}
            </p>
          )}
        </div>
      )}

      {/* External error shown even when field is empty */}
      {!local && externalError && (
        <p style={{ color: "#ef4444", fontSize: 10, fontWeight: 700, margin: "4px 0 0" }}>{externalError}</p>
      )}

      {/* ── Country dropdown ── */}
      {open && (
        <div
          ref={dropRef}
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0,
            zIndex: 9999, background: "#1a1a1a",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12, width: 300,
            boxShadow: "0 20px 60px rgba(0,0,0,0.7)", overflow: "hidden",
          }}>
          {/* Search */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 10px",
            }}>
              <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country, name or code…"
                style={{
                  flex: 1, background: "none", border: "none", outline: "none",
                  color: "#fff", fontSize: 12, fontFamily: "inherit",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "rgba(255,255,255,0.3)", padding: 0, fontSize: 16, lineHeight: 1,
                  }}>
                  ×
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 260, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: "20px" }}>
                No results for "{search}"
              </p>
            ) : (
              filtered.map((c) => {
                const isSelected = country.code === c.code && country.dial === c.dial;
                return (
                  <button
                    key={`${c.code}-${c.dial}`}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 14px",
                      background: isSelected ? "rgba(239,68,68,0.1)" : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                    <span style={{
                      flex: 1, fontSize: 12,
                      color: isSelected ? "#fff" : "rgba(255,255,255,0.7)",
                      fontWeight: isSelected ? 700 : 400,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {c.name}
                    </span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      +{c.dial}
                    </span>
                    {isSelected && (
                      <svg width="10" height="10" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer: current format hint + result count */}
          <div style={{
            padding: "8px 14px", borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 18 }}>{country.flag}</span>
            <div>
              <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, margin: 0 }}>
                Format: <strong style={{ color: "rgba(255,255,255,0.5)" }}>{country.example}</strong>
              </p>
              <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 9, margin: 0 }}>
                {filtered.length} {filtered.length === 1 ? "country" : "countries"} shown
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}