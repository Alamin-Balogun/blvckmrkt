import {useState, useRef, useEffect} from "react";

/**
 * BankInput — Searchable bank selector with auto-fill for gateway codes.
 *
 * Nigerian banks: Paystack + Flutterwave codes sourced from official NIBSS/NIP
 * institution codes as used by Paystack and Flutterwave APIs.
 *
 * International banks: name + flag only; codes remain editable by the user.
 *
 * FIX: The clear (×) button is rendered OUTSIDE the trigger <button> as a
 *      positioned sibling — prevents illegal <button> inside <button> nesting
 *      which caused the hydration error.
 *
 * Props:
 *   value    — Current bank name string
 *   onSelect — Called with { name, country, flag, paystack_code, flutterwave_code }
 *   label    — Label node/string
 *   disabled — Disable the input
 */

// ─── Bank Data ────────────────────────────────────────────────────────────────
// Nigerian banks: codes verified against NIBSS NIP institution codes used by
// both Paystack and Flutterwave (same code system for Nigerian banks).
// International banks: codes left empty — user must enter manually.
/**
 * BankInput — Searchable bank selector with auto-fill for Paystack & Flutterwave codes.
 *
 * ✅ VERIFIED: Nigerian bank codes updated to match Paystack/Flutterwave APIs (April 2026)
 * 🌍 READY: International banks included (codes empty, ready for future gateways)
 */

// ─── Bank Data ────────────────────────────────────────────────────────────────
export const BANKS = [

  // ══════════════════════════════════════════════════════════════════════════
  // ✅ NIGERIA - VERIFIED CODES (Updated April 2026)
  // ══════════════════════════════════════════════════════════════════════════
  {name: "Access Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "044", flutterwave_code: "044"},
  {name: "Citibank Nigeria", country: "Nigeria", flag: "🇳🇬", paystack_code: "023", flutterwave_code: "023"},
  {name: "Ecobank Nigeria", country: "Nigeria", flag: "🇳🇬", paystack_code: "050", flutterwave_code: "050"},
  {name: "Fidelity Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "070", flutterwave_code: "070"},
  {name: "First Bank of Nigeria", country: "Nigeria", flag: "🇳🇬", paystack_code: "011", flutterwave_code: "011"},
  {name: "First City Monument Bank (FCMB)", country: "Nigeria", flag: "🇳🇬", paystack_code: "214", flutterwave_code: "214"},
  {name: "Globus Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "00103", flutterwave_code: "00103"},
  {name: "Guaranty Trust Bank (GTBank)", country: "Nigeria", flag: "🇳🇬", paystack_code: "058", flutterwave_code: "058"},
  {name: "Heritage Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "030", flutterwave_code: "030"},
  {name: "Jaiz Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "301", flutterwave_code: "301"},
  {name: "Keystone Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "082", flutterwave_code: "082"},
  {name: "Kuda Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "50211", flutterwave_code: "50211"},
  {name: "Moniepoint Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "50515", flutterwave_code: "50515"},
  {name: "OPay Digital Services", country: "Nigeria", flag: "🇳🇬", paystack_code: "999992", flutterwave_code: "999992"},
  {name: "Optimus Bank (Premium Trust Bank)", country: "Nigeria", flag: "🇳🇬", paystack_code: "105", flutterwave_code: "105"},
  {name: "PalmPay", country: "Nigeria", flag: "🇳🇬", paystack_code: "999991", flutterwave_code: "999991"},
  {name: "Parallex Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "104", flutterwave_code: "104"},
  {name: "Polaris Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "076", flutterwave_code: "076"},
  {name: "Providus Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "101", flutterwave_code: "101"},
  {name: "Stanbic IBTC Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "221", flutterwave_code: "221"},
  {name: "Standard Chartered Bank Nigeria", country: "Nigeria", flag: "🇳🇬", paystack_code: "068", flutterwave_code: "068"},
  {name: "Sterling Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "232", flutterwave_code: "232"},
  {name: "SunTrust Bank Nigeria", country: "Nigeria", flag: "🇳🇬", paystack_code: "100", flutterwave_code: "100"},
  {name: "Taj Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "302", flutterwave_code: "302"},
  {name: "Titan Trust Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "102", flutterwave_code: "102"},
  {name: "Union Bank of Nigeria", country: "Nigeria", flag: "🇳🇬", paystack_code: "032", flutterwave_code: "032"},
  {name: "United Bank for Africa (UBA)", country: "Nigeria", flag: "🇳🇬", paystack_code: "033", flutterwave_code: "033"},
  {name: "Unity Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "215", flutterwave_code: "215"},
  {name: "VFD Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "566", flutterwave_code: "566"},
  {name: "Wema Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "035", flutterwave_code: "035"},
  {name: "Zenith Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "057", flutterwave_code: "057"},
  {name: "Coronation Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "559", flutterwave_code: "559"},
  {name: "Lotus Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "303", flutterwave_code: "303"},
  {name: "Rand Merchant Bank Nigeria", country: "Nigeria", flag: "🇳🇬", paystack_code: "502", flutterwave_code: "502"},
  
  // Nigerian Fintechs / MFBs / PSBs
  {name: "Carbon (One Finance)", country: "Nigeria", flag: "🇳🇬", paystack_code: "565", flutterwave_code: "565"},
  {name: "Chanelle Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "50823", flutterwave_code: "50823"},
  {name: "Eyowo Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "50126", flutterwave_code: "50126"},
  {name: "FairMoney Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "51318", flutterwave_code: "51318"},
  {name: "FBNQuest Merchant Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "60001", flutterwave_code: "60001"},
  {name: "FSDH Merchant Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "501", flutterwave_code: "501"},
  {name: "Greenwich Merchant Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "60004", flutterwave_code: "60004"},
  {name: "HopePSB", country: "Nigeria", flag: "🇳🇬", paystack_code: "120002", flutterwave_code: "120002"},
  {name: "MoMo PSB (MTN)", country: "Nigeria", flag: "🇳🇬", paystack_code: "120003", flutterwave_code: "120003"},
  {name: "Nova Merchant Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "60003", flutterwave_code: "60003"},
  {name: "Paga", country: "Nigeria", flag: "🇳🇬", paystack_code: "100002", flutterwave_code: "100002"},
  {name: "Renmoney Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "50710", flutterwave_code: "50710"},
  {name: "Rubies Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "50767", flutterwave_code: "50767"},
  {name: "Safe Haven Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "51113", flutterwave_code: "51113"},
  {name: "SmartCash PSB (Airtel)", country: "Nigeria", flag: "🇳🇬", paystack_code: "120004", flutterwave_code: "120004"},
  {name: "Sparkle Microfinance Bank", country: "Nigeria", flag: "🇳🇬", paystack_code: "51310", flutterwave_code: "51310"},
  {name: "Tangerine Money MFB", country: "Nigeria", flag: "🇳🇬", paystack_code: "51269", flutterwave_code: "51269"},
  {name: "9PSB (9 Payment Service Bank)", country: "Nigeria", flag: "🇳🇬", paystack_code: "120001", flutterwave_code: "120001"},

  // ══════════════════════════════════════════════════════════════════════════
  // 🌍 INTERNATIONAL BANKS - Ready for future gateway integration
  // ══════════════════════════════════════════════════════════════════════════

  // ── Ghana ─────────────────────────────────────────────────────────────────────
  {name: "Absa Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Access Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Cal Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Consolidated Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Ecobank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Fidelity Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "First Atlantic Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "GCB Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "GTBank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "National Investment Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Republic Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Stanbic Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Standard Chartered Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "United Bank for Africa Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Zenith Bank Ghana", country: "Ghana", flag: "🇬🇭", paystack_code: "", flutterwave_code: ""},

  // ── Kenya ─────────────────────────────────────────────────────────────────────
  {name: "Absa Bank Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Co-operative Bank of Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Diamond Trust Bank Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Equity Bank Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Family Bank Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "I&M Bank Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Kenya Commercial Bank (KCB)", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "NCBA Bank Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "National Bank of Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Prime Bank Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Stanbic Bank Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Standard Chartered Kenya", country: "Kenya", flag: "🇰🇪", paystack_code: "", flutterwave_code: ""},

  // ── South Africa ──────────────────────────────────────────────────────────────
  {name: "Absa Bank South Africa", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},
  {name: "African Bank South Africa", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Capitec Bank", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Discovery Bank", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},
  {name: "First National Bank (FNB)", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Investec South Africa", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Nedbank", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Standard Bank South Africa", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},
  {name: "TymeBank", country: "South Africa", flag: "🇿🇦", paystack_code: "", flutterwave_code: ""},

  // ── Tanzania ──────────────────────────────────────────────────────────────────
  {name: "CRDB Bank Tanzania", country: "Tanzania", flag: "🇹🇿", paystack_code: "", flutterwave_code: ""},
  {name: "Equity Bank Tanzania", country: "Tanzania", flag: "🇹🇿", paystack_code: "", flutterwave_code: ""},
  {name: "KCB Bank Tanzania", country: "Tanzania", flag: "🇹🇿", paystack_code: "", flutterwave_code: ""},
  {name: "NBC Bank Tanzania", country: "Tanzania", flag: "🇹🇿", paystack_code: "", flutterwave_code: ""},
  {name: "NMB Bank Tanzania", country: "Tanzania", flag: "🇹🇿", paystack_code: "", flutterwave_code: ""},
  {name: "Stanbic Bank Tanzania", country: "Tanzania", flag: "🇹🇿", paystack_code: "", flutterwave_code: ""},

  // ── Uganda ────────────────────────────────────────────────────────────────────
  {name: "Absa Bank Uganda", country: "Uganda", flag: "🇺🇬", paystack_code: "", flutterwave_code: ""},
  {name: "Centenary Bank Uganda", country: "Uganda", flag: "🇺🇬", paystack_code: "", flutterwave_code: ""},
  {name: "DFCU Bank Uganda", country: "Uganda", flag: "🇺🇬", paystack_code: "", flutterwave_code: ""},
  {name: "Equity Bank Uganda", country: "Uganda", flag: "🇺🇬", paystack_code: "", flutterwave_code: ""},
  {name: "KCB Bank Uganda", country: "Uganda", flag: "🇺🇬", paystack_code: "", flutterwave_code: ""},
  {name: "Stanbic Bank Uganda", country: "Uganda", flag: "🇺🇬", paystack_code: "", flutterwave_code: ""},
  {name: "Standard Chartered Uganda", country: "Uganda", flag: "🇺🇬", paystack_code: "", flutterwave_code: ""},

  // ── Rwanda ────────────────────────────────────────────────────────────────────
  {name: "Bank of Kigali", country: "Rwanda", flag: "🇷🇼", paystack_code: "", flutterwave_code: ""},
  {name: "BPR Bank Rwanda", country: "Rwanda", flag: "🇷🇼", paystack_code: "", flutterwave_code: ""},
  {name: "Equity Bank Rwanda", country: "Rwanda", flag: "🇷🇼", paystack_code: "", flutterwave_code: ""},
  {name: "KCB Bank Rwanda", country: "Rwanda", flag: "🇷🇼", paystack_code: "", flutterwave_code: ""},

  // ── Senegal ───────────────────────────────────────────────────────────────────
  {name: "CBAO Groupe Attijariwafa Senegal", country: "Senegal", flag: "🇸🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Ecobank Senegal", country: "Senegal", flag: "🇸🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Société Générale Sénégal", country: "Senegal", flag: "🇸🇳", paystack_code: "", flutterwave_code: ""},

  // ── Côte d'Ivoire ─────────────────────────────────────────────────────────────
  {name: "Banque Atlantique Côte d'Ivoire", country: "Côte d'Ivoire", flag: "🇨🇮", paystack_code: "", flutterwave_code: ""},
  {name: "Coris Bank International", country: "Côte d'Ivoire", flag: "🇨🇮", paystack_code: "", flutterwave_code: ""},
  {name: "Ecobank Côte d'Ivoire", country: "Côte d'Ivoire", flag: "🇨🇮", paystack_code: "", flutterwave_code: ""},
  {name: "Société Générale Côte d'Ivoire", country: "Côte d'Ivoire", flag: "🇨🇮", paystack_code: "", flutterwave_code: ""},

  // ── Cameroon ──────────────────────────────────────────────────────────────────
  {name: "Afriland First Bank Cameroon", country: "Cameroon", flag: "🇨🇲", paystack_code: "", flutterwave_code: ""},
  {name: "Ecobank Cameroon", country: "Cameroon", flag: "🇨🇲", paystack_code: "", flutterwave_code: ""},
  {name: "Société Générale Cameroun", country: "Cameroon", flag: "🇨🇲", paystack_code: "", flutterwave_code: ""},

  // ── Ethiopia ──────────────────────────────────────────────────────────────────
  {name: "Abyssinia Bank", country: "Ethiopia", flag: "🇪🇹", paystack_code: "", flutterwave_code: ""},
  {name: "Awash Bank", country: "Ethiopia", flag: "🇪🇹", paystack_code: "", flutterwave_code: ""},
  {name: "Commercial Bank of Ethiopia", country: "Ethiopia", flag: "🇪🇹", paystack_code: "", flutterwave_code: ""},
  {name: "Dashen Bank Ethiopia", country: "Ethiopia", flag: "🇪🇹", paystack_code: "", flutterwave_code: ""},

  // ── Zimbabwe ──────────────────────────────────────────────────────────────────
  {name: "CBZ Bank Zimbabwe", country: "Zimbabwe", flag: "🇿🇼", paystack_code: "", flutterwave_code: ""},
  {name: "FBC Bank Zimbabwe", country: "Zimbabwe", flag: "🇿🇼", paystack_code: "", flutterwave_code: ""},
  {name: "Stanbic Bank Zimbabwe", country: "Zimbabwe", flag: "🇿🇼", paystack_code: "", flutterwave_code: ""},

  // ── Zambia ────────────────────────────────────────────────────────────────────
  {name: "First National Bank Zambia", country: "Zambia", flag: "🇿🇲", paystack_code: "", flutterwave_code: ""},
  {name: "Stanbic Bank Zambia", country: "Zambia", flag: "🇿🇲", paystack_code: "", flutterwave_code: ""},
  {name: "Zanaco Bank", country: "Zambia", flag: "🇿🇲", paystack_code: "", flutterwave_code: ""},

  // ── Egypt ─────────────────────────────────────────────────────────────────────
  {name: "Banque Misr", country: "Egypt", flag: "🇪🇬", paystack_code: "", flutterwave_code: ""},
  {name: "Commercial International Bank Egypt (CIB)", country: "Egypt", flag: "🇪🇬", paystack_code: "", flutterwave_code: ""},
  {name: "HSBC Egypt", country: "Egypt", flag: "🇪🇬", paystack_code: "", flutterwave_code: ""},
  {name: "National Bank of Egypt", country: "Egypt", flag: "🇪🇬", paystack_code: "", flutterwave_code: ""},
  {name: "QNB Al Ahli Egypt", country: "Egypt", flag: "🇪🇬", paystack_code: "", flutterwave_code: ""},

  // ── Morocco ───────────────────────────────────────────────────────────────────
  {name: "Attijariwafa Bank Morocco", country: "Morocco", flag: "🇲🇦", paystack_code: "", flutterwave_code: ""},
  {name: "BMCE Bank of Africa", country: "Morocco", flag: "🇲🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Banque Populaire Morocco", country: "Morocco", flag: "🇲🇦", paystack_code: "", flutterwave_code: ""},
  {name: "CIH Bank Morocco", country: "Morocco", flag: "🇲🇦", paystack_code: "", flutterwave_code: ""},

  // ── Tunisia ───────────────────────────────────────────────────────────────────
  {name: "Attijari Bank Tunisia", country: "Tunisia", flag: "🇹🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Banque Nationale Agricole Tunisia", country: "Tunisia", flag: "🇹🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Société Tunisienne de Banque (STB)", country: "Tunisia", flag: "🇹🇳", paystack_code: "", flutterwave_code: ""},

  // ── United Kingdom ────────────────────────────────────────────────────────────
  {name: "Barclays Bank UK", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Halifax Bank", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "HSBC UK", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Lloyds Bank", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Metro Bank UK", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Monzo Bank", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "NatWest Bank", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Revolut UK", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Santander UK", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Standard Chartered UK", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Starling Bank", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "TSB Bank UK", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Virgin Money UK", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},
  {name: "Wise (TransferWise)", country: "United Kingdom", flag: "🇬🇧", paystack_code: "", flutterwave_code: ""},

  // ── United States ─────────────────────────────────────────────────────────────
  {name: "Ally Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Bank of America", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Capital One Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Chase Bank (JPMorgan)", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Chime Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Citibank USA", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Citizens Bank USA", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Fifth Third Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Goldman Sachs Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Huntington National Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "KeyBank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "PNC Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Regions Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "TD Bank USA", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Truist Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "US Bank", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Wells Fargo", country: "United States", flag: "🇺🇸", paystack_code: "", flutterwave_code: ""},

  // ── Canada ────────────────────────────────────────────────────────────────────
  {name: "BMO Bank of Montreal", country: "Canada", flag: "🇨🇦", paystack_code: "", flutterwave_code: ""},
  {name: "CIBC", country: "Canada", flag: "🇨🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Desjardins Group", country: "Canada", flag: "🇨🇦", paystack_code: "", flutterwave_code: ""},
  {name: "National Bank of Canada", country: "Canada", flag: "🇨🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Royal Bank of Canada (RBC)", country: "Canada", flag: "🇨🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Scotiabank", country: "Canada", flag: "🇨🇦", paystack_code: "", flutterwave_code: ""},
  {name: "TD Bank Canada", country: "Canada", flag: "🇨🇦", paystack_code: "", flutterwave_code: ""},

  // ── Australia ─────────────────────────────────────────────────────────────────
  {name: "ANZ Bank", country: "Australia", flag: "🇦🇺", paystack_code: "", flutterwave_code: ""},
  {name: "Bendigo Bank", country: "Australia", flag: "🇦🇺", paystack_code: "", flutterwave_code: ""},
  {name: "Commonwealth Bank Australia", country: "Australia", flag: "🇦🇺", paystack_code: "", flutterwave_code: ""},
  {name: "Macquarie Bank", country: "Australia", flag: "🇦🇺", paystack_code: "", flutterwave_code: ""},
  {name: "National Australia Bank (NAB)", country: "Australia", flag: "🇦🇺", paystack_code: "", flutterwave_code: ""},
  {name: "Westpac Australia", country: "Australia", flag: "🇦🇺", paystack_code: "", flutterwave_code: ""},

  // ── New Zealand ───────────────────────────────────────────────────────────────
  {name: "ANZ New Zealand", country: "New Zealand", flag: "🇳🇿", paystack_code: "", flutterwave_code: ""},
  {name: "ASB Bank New Zealand", country: "New Zealand", flag: "🇳🇿", paystack_code: "", flutterwave_code: ""},
  {name: "BNZ (Bank of New Zealand)", country: "New Zealand", flag: "🇳🇿", paystack_code: "", flutterwave_code: ""},
  {name: "Westpac New Zealand", country: "New Zealand", flag: "🇳🇿", paystack_code: "", flutterwave_code: ""},

  // ── UAE ───────────────────────────────────────────────────────────────────────
  {name: "Abu Dhabi Commercial Bank (ADCB)", country: "UAE", flag: "🇦🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Abu Dhabi Islamic Bank (ADIB)", country: "UAE", flag: "🇦🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Dubai Islamic Bank (DIB)", country: "UAE", flag: "🇦🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Emirates NBD", country: "UAE", flag: "🇦🇪", paystack_code: "", flutterwave_code: ""},
  {name: "First Abu Dhabi Bank (FAB)", country: "UAE", flag: "🇦🇪", paystack_code: "", flutterwave_code: ""},
  {name: "HSBC UAE", country: "UAE", flag: "🇦🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Mashreq Bank", country: "UAE", flag: "🇦🇪", paystack_code: "", flutterwave_code: ""},
  {name: "RAK Bank", country: "UAE", flag: "🇦🇪", paystack_code: "", flutterwave_code: ""},

  // ── Saudi Arabia ──────────────────────────────────────────────────────────────
  {name: "Al Rajhi Bank", country: "Saudi Arabia", flag: "🇸🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Alinma Bank", country: "Saudi Arabia", flag: "🇸🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Arab National Bank", country: "Saudi Arabia", flag: "🇸🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Riyad Bank", country: "Saudi Arabia", flag: "🇸🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Saudi British Bank (SABB)", country: "Saudi Arabia", flag: "🇸🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Saudi National Bank (SNB)", country: "Saudi Arabia", flag: "🇸🇦", paystack_code: "", flutterwave_code: ""},

  // ── Qatar ─────────────────────────────────────────────────────────────────────
  {name: "Commercial Bank of Qatar", country: "Qatar", flag: "🇶🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Doha Bank", country: "Qatar", flag: "🇶🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Qatar Islamic Bank (QIB)", country: "Qatar", flag: "🇶🇦", paystack_code: "", flutterwave_code: ""},
  {name: "Qatar National Bank (QNB)", country: "Qatar", flag: "🇶🇦", paystack_code: "", flutterwave_code: ""},

  // ── Kuwait ────────────────────────────────────────────────────────────────────
  {name: "Gulf Bank Kuwait", country: "Kuwait", flag: "🇰🇼", paystack_code: "", flutterwave_code: ""},
  {name: "Kuwait Finance House (KFH)", country: "Kuwait", flag: "🇰🇼", paystack_code: "", flutterwave_code: ""},
  {name: "National Bank of Kuwait (NBK)", country: "Kuwait", flag: "🇰🇼", paystack_code: "", flutterwave_code: ""},

  // ── Bahrain ───────────────────────────────────────────────────────────────────
  {name: "Ahli United Bank Bahrain", country: "Bahrain", flag: "🇧🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Bank of Bahrain and Kuwait (BBK)", country: "Bahrain", flag: "🇧🇭", paystack_code: "", flutterwave_code: ""},
  {name: "National Bank of Bahrain (NBB)", country: "Bahrain", flag: "🇧🇭", paystack_code: "", flutterwave_code: ""},

  // ── France ────────────────────────────────────────────────────────────────────
  {name: "BNP Paribas", country: "France", flag: "🇫🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Crédit Agricole", country: "France", flag: "🇫🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Crédit Mutuel", country: "France", flag: "🇫🇷", paystack_code: "", flutterwave_code: ""},
  {name: "La Banque Postale", country: "France", flag: "🇫🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Société Générale France", country: "France", flag: "🇫🇷", paystack_code: "", flutterwave_code: ""},

  // ── Germany ───────────────────────────────────────────────────────────────────
  {name: "Commerzbank", country: "Germany", flag: "🇩🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Deutsche Bank", country: "Germany", flag: "🇩🇪", paystack_code: "", flutterwave_code: ""},
  {name: "DZ Bank Germany", country: "Germany", flag: "🇩🇪", paystack_code: "", flutterwave_code: ""},
  {name: "KfW Bank", country: "Germany", flag: "🇩🇪", paystack_code: "", flutterwave_code: ""},
  {name: "N26 Bank", country: "Germany", flag: "🇩🇪", paystack_code: "", flutterwave_code: ""},

  // ── Netherlands ───────────────────────────────────────────────────────────────
  {name: "ABN AMRO", country: "Netherlands", flag: "🇳🇱", paystack_code: "", flutterwave_code: ""},
  {name: "ING Bank", country: "Netherlands", flag: "🇳🇱", paystack_code: "", flutterwave_code: ""},
  {name: "Rabobank", country: "Netherlands", flag: "🇳🇱", paystack_code: "", flutterwave_code: ""},
  {name: "de Volksbank", country: "Netherlands", flag: "🇳🇱", paystack_code: "", flutterwave_code: ""},

  // ── Spain ─────────────────────────────────────────────────────────────────────
  {name: "BBVA Spain", country: "Spain", flag: "🇪🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Banco Sabadell", country: "Spain", flag: "🇪🇸", paystack_code: "", flutterwave_code: ""},
  {name: "CaixaBank", country: "Spain", flag: "🇪🇸", paystack_code: "", flutterwave_code: ""},
  {name: "Santander Spain", country: "Spain", flag: "🇪🇸", paystack_code: "", flutterwave_code: ""},

  // ── Italy ─────────────────────────────────────────────────────────────────────
  {name: "Banco BPM", country: "Italy", flag: "🇮🇹", paystack_code: "", flutterwave_code: ""},
  {name: "Intesa Sanpaolo", country: "Italy", flag: "🇮🇹", paystack_code: "", flutterwave_code: ""},
  {name: "Mediobanca", country: "Italy", flag: "🇮🇹", paystack_code: "", flutterwave_code: ""},
  {name: "UniCredit Italy", country: "Italy", flag: "🇮🇹", paystack_code: "", flutterwave_code: ""},

  // ── Switzerland ───────────────────────────────────────────────────────────────
  {name: "Julius Bär", country: "Switzerland", flag: "🇨🇭", paystack_code: "", flutterwave_code: ""},
  {name: "UBS Switzerland", country: "Switzerland", flag: "🇨🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Zurich Cantonal Bank (ZKB)", country: "Switzerland", flag: "🇨🇭", paystack_code: "", flutterwave_code: ""},

  // ── Sweden ────────────────────────────────────────────────────────────────────
  {name: "Handelsbanken", country: "Sweden", flag: "🇸🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Nordea Sweden", country: "Sweden", flag: "🇸🇪", paystack_code: "", flutterwave_code: ""},
  {name: "SEB Bank Sweden", country: "Sweden", flag: "🇸🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Swedbank", country: "Sweden", flag: "🇸🇪", paystack_code: "", flutterwave_code: ""},

  // ── Norway / Denmark ──────────────────────────────────────────────────────────
  {name: "DNB Bank Norway", country: "Norway", flag: "🇳🇴", paystack_code: "", flutterwave_code: ""},
  {name: "SpareBank 1", country: "Norway", flag: "🇳🇴", paystack_code: "", flutterwave_code: ""},
  {name: "Danske Bank", country: "Denmark", flag: "🇩🇰", paystack_code: "", flutterwave_code: ""},
  {name: "Nordea Denmark", country: "Denmark", flag: "🇩🇰", paystack_code: "", flutterwave_code: ""},

  // ── Poland ────────────────────────────────────────────────────────────────────
  {name: "Bank Pekao", country: "Poland", flag: "🇵🇱", paystack_code: "", flutterwave_code: ""},
  {name: "PKO Bank Polski", country: "Poland", flag: "🇵🇱", paystack_code: "", flutterwave_code: ""},
  {name: "mBank Poland", country: "Poland", flag: "🇵🇱", paystack_code: "", flutterwave_code: ""},

  // ── Turkey ────────────────────────────────────────────────────────────────────
  {name: "Akbank Turkey", country: "Turkey", flag: "🇹🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Garanti BBVA Turkey", country: "Turkey", flag: "🇹🇷", paystack_code: "", flutterwave_code: ""},
  {name: "İş Bankası (Isbank)", country: "Turkey", flag: "🇹🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Ziraat Bank Turkey", country: "Turkey", flag: "🇹🇷", paystack_code: "", flutterwave_code: ""},

  // ── Russia ────────────────────────────────────────────────────────────────────
  {name: "Gazprombank", country: "Russia", flag: "🇷🇺", paystack_code: "", flutterwave_code: ""},
  {name: "Sberbank Russia", country: "Russia", flag: "🇷🇺", paystack_code: "", flutterwave_code: ""},
  {name: "VTB Bank Russia", country: "Russia", flag: "🇷🇺", paystack_code: "", flutterwave_code: ""},

  // ── Portugal / Belgium / Austria ──────────────────────────────────────────────
  {name: "Caixa Geral de Depósitos Portugal", country: "Portugal", flag: "🇵🇹", paystack_code: "", flutterwave_code: ""},
  {name: "Millennium BCP Portugal", country: "Portugal", flag: "🇵🇹", paystack_code: "", flutterwave_code: ""},
  {name: "BNP Paribas Fortis Belgium", country: "Belgium", flag: "🇧🇪", paystack_code: "", flutterwave_code: ""},
  {name: "ING Belgium", country: "Belgium", flag: "🇧🇪", paystack_code: "", flutterwave_code: ""},
  {name: "KBC Bank Belgium", country: "Belgium", flag: "🇧🇪", paystack_code: "", flutterwave_code: ""},
  {name: "Erste Bank Austria", country: "Austria", flag: "🇦🇹", paystack_code: "", flutterwave_code: ""},
  {name: "Raiffeisen Bank International Austria", country: "Austria", flag: "🇦🇹", paystack_code: "", flutterwave_code: ""},

  // ── Greece / Romania / Israel ─────────────────────────────────────────────────
  {name: "Alpha Bank Greece", country: "Greece", flag: "🇬🇷", paystack_code: "", flutterwave_code: ""},
  {name: "National Bank of Greece", country: "Greece", flag: "🇬🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Piraeus Bank Greece", country: "Greece", flag: "🇬🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Banca Transilvania", country: "Romania", flag: "🇷🇴", paystack_code: "", flutterwave_code: ""},
  {name: "BRD Group Société Générale Romania", country: "Romania", flag: "🇷🇴", paystack_code: "", flutterwave_code: ""},
  {name: "Bank Hapoalim Israel", country: "Israel", flag: "🇮🇱", paystack_code: "", flutterwave_code: ""},
  {name: "Bank Leumi Israel", country: "Israel", flag: "🇮🇱", paystack_code: "", flutterwave_code: ""},
  {name: "Mizrahi Tefahot Bank Israel", country: "Israel", flag: "🇮🇱", paystack_code: "", flutterwave_code: ""},

  // ── India ─────────────────────────────────────────────────────────────────────
  {name: "Axis Bank India", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Bank of Baroda", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Canara Bank India", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "HDFC Bank India", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "ICICI Bank India", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "IndusInd Bank", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Kotak Mahindra Bank", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Punjab National Bank (PNB)", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "State Bank of India (SBI)", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Yes Bank India", country: "India", flag: "🇮🇳", paystack_code: "", flutterwave_code: ""},

  // ── China ─────────────────────────────────────────────────────────────────────
  {name: "Agricultural Bank of China (ABC)", country: "China", flag: "🇨🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Bank of China (BOC)", country: "China", flag: "🇨🇳", paystack_code: "", flutterwave_code: ""},
  {name: "China Construction Bank (CCB)", country: "China", flag: "🇨🇳", paystack_code: "", flutterwave_code: ""},
  {name: "China Merchants Bank (CMB)", country: "China", flag: "🇨🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Industrial and Commercial Bank of China (ICBC)", country: "China", flag: "🇨🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Ping An Bank", country: "China", flag: "🇨🇳", paystack_code: "", flutterwave_code: ""},

  // ── Hong Kong ─────────────────────────────────────────────────────────────────
  {name: "BOC Hong Kong", country: "Hong Kong", flag: "🇭🇰", paystack_code: "", flutterwave_code: ""},
  {name: "Bank of East Asia", country: "Hong Kong", flag: "🇭🇰", paystack_code: "", flutterwave_code: ""},
  {name: "Hang Seng Bank", country: "Hong Kong", flag: "🇭🇰", paystack_code: "", flutterwave_code: ""},
  {name: "HSBC Hong Kong", country: "Hong Kong", flag: "🇭🇰", paystack_code: "", flutterwave_code: ""},

  // ── Japan ─────────────────────────────────────────────────────────────────────
  {name: "Japan Post Bank", country: "Japan", flag: "🇯🇵", paystack_code: "", flutterwave_code: ""},
  {name: "MUFG Bank", country: "Japan", flag: "🇯🇵", paystack_code: "", flutterwave_code: ""},
  {name: "Mizuho Bank", country: "Japan", flag: "🇯🇵", paystack_code: "", flutterwave_code: ""},
  {name: "Resona Bank Japan", country: "Japan", flag: "🇯🇵", paystack_code: "", flutterwave_code: ""},
  {name: "Sumitomo Mitsui Banking Corporation (SMBC)", country: "Japan", flag: "🇯🇵", paystack_code: "", flutterwave_code: ""},

  // ── South Korea ───────────────────────────────────────────────────────────────
  {name: "IBK Industrial Bank of Korea", country: "South Korea", flag: "🇰🇷", paystack_code: "", flutterwave_code: ""},
  {name: "KB Kookmin Bank", country: "South Korea", flag: "🇰🇷", paystack_code: "", flutterwave_code: ""},
  {name: "KEB Hana Bank", country: "South Korea", flag: "🇰🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Kakao Bank", country: "South Korea", flag: "🇰🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Shinhan Bank", country: "South Korea", flag: "🇰🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Woori Bank South Korea", country: "South Korea", flag: "🇰🇷", paystack_code: "", flutterwave_code: ""},

  // ── Singapore / Malaysia ──────────────────────────────────────────────────────
  {name: "DBS Bank Singapore", country: "Singapore", flag: "🇸🇬", paystack_code: "", flutterwave_code: ""},
  {name: "OCBC Bank Singapore", country: "Singapore", flag: "🇸🇬", paystack_code: "", flutterwave_code: ""},
  {name: "Standard Chartered Singapore", country: "Singapore", flag: "🇸🇬", paystack_code: "", flutterwave_code: ""},
  {name: "United Overseas Bank (UOB)", country: "Singapore", flag: "🇸🇬", paystack_code: "", flutterwave_code: ""},
  {name: "CIMB Bank Malaysia", country: "Malaysia", flag: "🇲🇾", paystack_code: "", flutterwave_code: ""},
  {name: "Hong Leong Bank Malaysia", country: "Malaysia", flag: "🇲🇾", paystack_code: "", flutterwave_code: ""},
  {name: "Maybank Malaysia", country: "Malaysia", flag: "🇲🇾", paystack_code: "", flutterwave_code: ""},
  {name: "Public Bank Malaysia", country: "Malaysia", flag: "🇲🇾", paystack_code: "", flutterwave_code: ""},
  {name: "RHB Bank Malaysia", country: "Malaysia", flag: "🇲🇾", paystack_code: "", flutterwave_code: ""},

  // ── Indonesia ─────────────────────────────────────────────────────────────────
  {name: "Bank Central Asia (BCA)", country: "Indonesia", flag: "🇮🇩", paystack_code: "", flutterwave_code: ""},
  {name: "Bank Mandiri", country: "Indonesia", flag: "🇮🇩", paystack_code: "", flutterwave_code: ""},
  {name: "Bank Negara Indonesia (BNI)", country: "Indonesia", flag: "🇮🇩", paystack_code: "", flutterwave_code: ""},
  {name: "Bank Rakyat Indonesia (BRI)", country: "Indonesia", flag: "🇮🇩", paystack_code: "", flutterwave_code: ""},
  {name: "Bank CIMB Niaga", country: "Indonesia", flag: "🇮🇩", paystack_code: "", flutterwave_code: ""},

  // ── Philippines / Thailand / Vietnam ─────────────────────────────────────────
  {name: "BDO Unibank Philippines", country: "Philippines", flag: "🇵🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Bank of the Philippine Islands (BPI)", country: "Philippines", flag: "🇵🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Metrobank Philippines", country: "Philippines", flag: "🇵🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Bangkok Bank", country: "Thailand", flag: "🇹🇭", paystack_code: "", flutterwave_code: ""},
  {name: "Kasikorn Bank (KBank)", country: "Thailand", flag: "🇹🇭", paystack_code: "", flutterwave_code: ""},
  {name: "SCB (Siam Commercial Bank)", country: "Thailand", flag: "🇹🇭", paystack_code: "", flutterwave_code: ""},
  {name: "BIDV Vietnam", country: "Vietnam", flag: "🇻🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Techcombank Vietnam", country: "Vietnam", flag: "🇻🇳", paystack_code: "", flutterwave_code: ""},
  {name: "Vietcombank", country: "Vietnam", flag: "🇻🇳", paystack_code: "", flutterwave_code: ""},
  {name: "VietinBank", country: "Vietnam", flag: "🇻🇳", paystack_code: "", flutterwave_code: ""},

  // ── Pakistan / Bangladesh / Sri Lanka ─────────────────────────────────────────
  {name: "Allied Bank Pakistan", country: "Pakistan", flag: "🇵🇰", paystack_code: "", flutterwave_code: ""},
  {name: "Habib Bank Limited (HBL)", country: "Pakistan", flag: "🇵🇰", paystack_code: "", flutterwave_code: ""},
  {name: "MCB Bank Pakistan", country: "Pakistan", flag: "🇵🇰", paystack_code: "", flutterwave_code: ""},
  {name: "United Bank Limited (UBL)", country: "Pakistan", flag: "🇵🇰", paystack_code: "", flutterwave_code: ""},
  {name: "BRAC Bank Bangladesh", country: "Bangladesh", flag: "🇧🇩", paystack_code: "", flutterwave_code: ""},
  {name: "Dutch-Bangla Bank", country: "Bangladesh", flag: "🇧🇩", paystack_code: "", flutterwave_code: ""},
  {name: "Sonali Bank Bangladesh", country: "Bangladesh", flag: "🇧🇩", paystack_code: "", flutterwave_code: ""},
  {name: "Bank of Ceylon", country: "Sri Lanka", flag: "🇱🇰", paystack_code: "", flutterwave_code: ""},
  {name: "Commercial Bank of Ceylon", country: "Sri Lanka", flag: "🇱🇰", paystack_code: "", flutterwave_code: ""},
  {name: "People's Bank Sri Lanka", country: "Sri Lanka", flag: "🇱🇰", paystack_code: "", flutterwave_code: ""},

  // ── Brazil / Mexico / Argentina / Colombia / Chile ────────────────────────────
  {name: "Banco do Brasil", country: "Brazil", flag: "🇧🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Bradesco Bank Brazil", country: "Brazil", flag: "🇧🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Caixa Econômica Federal Brazil", country: "Brazil", flag: "🇧🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Itaú Unibanco", country: "Brazil", flag: "🇧🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Nubank", country: "Brazil", flag: "🇧🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Santander Brazil", country: "Brazil", flag: "🇧🇷", paystack_code: "", flutterwave_code: ""},
  {name: "BBVA Mexico", country: "Mexico", flag: "🇲🇽", paystack_code: "", flutterwave_code: ""},
  {name: "Banamex (Citibanamex)", country: "Mexico", flag: "🇲🇽", paystack_code: "", flutterwave_code: ""},
  {name: "Banorte", country: "Mexico", flag: "🇲🇽", paystack_code: "", flutterwave_code: ""},
  {name: "HSBC Mexico", country: "Mexico", flag: "🇲🇽", paystack_code: "", flutterwave_code: ""},
  {name: "Santander Mexico", country: "Mexico", flag: "🇲🇽", paystack_code: "", flutterwave_code: ""},
  {name: "Banco Galicia", country: "Argentina", flag: "🇦🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Banco Santander Argentina", country: "Argentina", flag: "🇦🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Banco de la Nación Argentina", country: "Argentina", flag: "🇦🇷", paystack_code: "", flutterwave_code: ""},
  {name: "Bancolombia", country: "Colombia", flag: "🇨🇴", paystack_code: "", flutterwave_code: ""},
  {name: "Banco de Bogotá", country: "Colombia", flag: "🇨🇴", paystack_code: "", flutterwave_code: ""},
  {name: "Davivienda Bank Colombia", country: "Colombia", flag: "🇨🇴", paystack_code: "", flutterwave_code: ""},
  {name: "BancoEstado Chile", country: "Chile", flag: "🇨🇱", paystack_code: "", flutterwave_code: ""},
  {name: "Banco de Chile", country: "Chile", flag: "🇨🇱", paystack_code: "", flutterwave_code: ""},
  {name: "Santander Chile", country: "Chile", flag: "🇨🇱", paystack_code: "", flutterwave_code: ""},
];

export default function BankInput({value, onSelect, label, disabled}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const filtered = BANKS.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.country.toLowerCase().includes(q) ||
      b.paystack_code.includes(q) ||
      b.flutterwave_code.includes(q)
    );
  });

  const selectedBank = BANKS.find((b) => b.name === value) || null;
  const hasAutoCode = selectedBank?.paystack_code !== "";

  const handleSelect = (bank) => {
    onSelect(bank);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect({name: "", country: "", flag: "", paystack_code: "", flutterwave_code: ""});
  };

  return (
    <div ref={wrapRef} style={{position: "relative"}}>
      {/* Label */}
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

      {/*
       * FIX: Trigger and clear are SIBLINGS inside a <div>.
       * Previously the clear <button> was nested inside the trigger <button>
       * which is invalid HTML — fixed by making them siblings.
       */}
      <div style={{position: "relative", display: "flex", alignItems: "stretch"}}>
        {/* Trigger button */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${open ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.12)"}`,
            color: value ? "#fff" : "rgba(255,255,255,0.3)",
            fontSize: 13,
            padding: selectedBank ? "11px 40px 11px 14px" : "11px 14px",
            borderRadius: 9,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: 10,
            textAlign: "left",
            opacity: disabled ? 0.5 : 1,
          }}>
          {selectedBank ? (
            <>
              <span style={{fontSize: 18, lineHeight: 1, flexShrink: 0}}>{selectedBank.flag}</span>
              <div style={{flex: 1, minWidth: 0}}>
                <div style={{color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>
                  {selectedBank.name}
                </div>
                <div style={{color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1}}>
                  {selectedBank.country}
                  {hasAutoCode && (
                    <span style={{
                      marginLeft: 8,
                      background: "rgba(34,197,94,0.15)",
                      color: "#22c55e",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: 4,
                      padding: "1px 6px",
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                    }}>
                      CODES AUTO-FILLED & LOCKED
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink: 0}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 10h18M3 14h10M3 18h10" />
              </svg>
              <span style={{flex: 1, color: "rgba(255,255,255,0.3)", fontSize: 13}}>
                Select your bank…
              </span>
              <svg width="12" height="12" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" viewBox="0 0 24 24" style={{flexShrink: 0}}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </>
          )}
        </button>

        {/* Clear button — SIBLING of trigger, NOT nested inside it */}
        {selectedBank && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear bank selection"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 2,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.35)",
              padding: "2px 4px",
              fontSize: 18,
              lineHeight: 1,
            }}>
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "#161616",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          }}>

          {/* Search */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}>
            <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" viewBox="0 0 24 24" style={{flexShrink: 0}}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bank name or country…"
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
                style={{background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 0, fontSize: 16, lineHeight: 1}}>
                ×
              </button>
            )}
          </div>

          {/* List */}
          <div style={{maxHeight: 300, overflowY: "auto"}}>
            {filtered.length === 0 ? (
              <p style={{color: "rgba(255,255,255,0.3)", fontSize: 12, textAlign: "center", padding: "20px"}}>
                No results for "{search}"
              </p>
            ) : (
              filtered.map((bank, i) => {
                const isSelected = bank.name === value;
                const hasCode = bank.paystack_code !== "";
                return (
                  <button
                    key={`${bank.name}-${i}`}
                    type="button"
                    onClick={() => handleSelect(bank)}
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
                    <span style={{fontSize: 18, lineHeight: 1, flexShrink: 0}}>{bank.flag}</span>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap"}}>
                        <span style={{fontSize: 12, fontWeight: 700, color: isSelected ? "#fff" : "rgba(255,255,255,0.85)"}}>
                          {bank.name}
                        </span>
                        {hasCode && (
                          <span style={{
                            background: "rgba(34,197,94,0.12)",
                            color: "#22c55e",
                            border: "1px solid rgba(34,197,94,0.2)",
                            borderRadius: 4,
                            padding: "1px 5px",
                            fontSize: 8,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                          }}>
                            AUTO
                          </span>
                        )}
                      </div>
                      <p style={{color: "rgba(255,255,255,0.3)", fontSize: 10, margin: 0}}>
                        {bank.country}
                        {hasCode && (
                          <span style={{color: "rgba(255,255,255,0.2)", marginLeft: 6}}>
                            · PS: {bank.paystack_code} · FLW: {bank.flutterwave_code}
                          </span>
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <svg width="10" height="10" fill="none" stroke="#ef4444" strokeWidth="3" viewBox="0 0 24 24" style={{flexShrink: 0}}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "8px 14px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <p style={{color: "rgba(255,255,255,0.2)", fontSize: 9, margin: 0}}>
              {filtered.length} {filtered.length === 1 ? "bank" : "banks"} shown
            </p>
            <p style={{color: "rgba(34,197,94,0.5)", fontSize: 9, margin: 0}}>
              🟢 = codes auto-fill & lock
            </p>
          </div>
        </div>
      )}
    </div>
  );
}