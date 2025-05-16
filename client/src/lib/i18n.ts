import { create } from "zustand";

// Available languages
type LanguageCode = "en" | "hi" | "ml" | "ta";

interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const languages: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
];

// Translation keys for the application
type TranslationKey =
  | "welcome"
  | "welcome_subtitle"
  | "driver"
  | "transporter"
  | "already_have_account"
  | "sign_in"
  | "back"
  | "driver_registration"
  | "transporter_registration"
  | "create_account_steps"
  | "basic_info"
  | "verification"
  | "documents"
  | "company"
  | "success"
  | "full_name"
  | "mobile_number"
  | "preferred_job_locations"
  | "optional"
  | "continue"
  | "verify_number"
  | "otp_sent"
  | "enter_otp"
  | "didnt_receive_otp"
  | "resend"
  | "verify"
  | "upload_docs_optional"
  | "driving_license"
  | "upload_license"
  | "identity_proof"
  | "upload_id_proof"
  | "accepted_formats"
  | "skip_for_now"
  | "complete_later"
  | "registration_successful"
  | "account_created"
  | "next_steps"
  | "go_to_dashboard"
  | "email_address"
  | "company_name"
  | "fleet_size"
  | "company_registration"
  | "upload_document"
  | "gst_business_registration"
  | "welcome_user"
  | "complete_profile"
  | "find_jobs"
  | "recommended_jobs"
  | "view_all_jobs"
  | "nearby_facilities"
  | "fuel_stations"
  | "rest_areas"
  | "service_centers"
  | "hospitals"
  | "nearby"
  | "post_job"
  | "find_drivers"
  | "search"
  | "manage_jobs"
  | "manage_trips" // Added here
  | "manage"
  | "recommended_drivers"
  | "view_all_drivers"
  | "years_experience"
  | "sign_out"
  | "home"
  | "jobs"
  | "alerts"
  | "profile"
  | "drivers"
  | "support_chat"
  | "how_can_i_help"
  | "type_message";

// Translations for each language
type Translations = Record<LanguageCode, Record<TranslationKey, string>>;

const translations: Translations = {
  en: {
    welcome: "Welcome to SIGNO Connect",
    welcome_subtitle: "The logistics marketplace connecting drivers and transporters",
    driver: "Driver",
    transporter: "Fleet Owner/Transporter",
    already_have_account: "Already have an account?",
    sign_in: "Sign in",
    back: "Back",
    driver_registration: "Driver Registration",
    transporter_registration: "Fleet Owner Registration",
    create_account_steps: "Create your account in a few easy steps",
    basic_info: "Basic Info",
    verification: "Verification",
    documents: "Documents",
    company: "Company",
    success: "Success",
    full_name: "Full Name",
    mobile_number: "Mobile Number",
    preferred_job_locations: "Preferred Job Locations",
    optional: "Optional",
    continue: "Continue",
    verify_number: "Verify Your Number",
    otp_sent: "We've sent a 6-digit OTP to",
    enter_otp: "Enter OTP",
    didnt_receive_otp: "Didn't receive the OTP?",
    resend: "Resend",
    verify: "Verify",
    upload_docs_optional: "Upload your documents for verification (Optional for basic sign-up)",
    driving_license: "Driving License",
    upload_license: "Upload License",
    identity_proof: "Identity Proof",
    upload_id_proof: "Upload ID Proof",
    accepted_formats: "Accepted formats: Aadhaar, Passport, Voter ID",
    skip_for_now: "Skip for now",
    complete_later: "You can complete this step later",
    registration_successful: "Registration Successful!",
    account_created: "Your account has been created successfully.",
    next_steps: "Next Steps:",
    go_to_dashboard: "Go to Dashboard",
    email_address: "Email Address",
    company_name: "Company Name",
    fleet_size: "Fleet Size",
    company_registration: "Company Registration",
    upload_document: "Upload Document",
    gst_business_registration: "GST Certificate, Business Registration, etc.",
    welcome_user: "Welcome,",
    complete_profile: "Complete Profile",
    find_jobs: "Find Jobs",
    recommended_jobs: "Recommended Jobs",
    view_all_jobs: "View All Jobs",
    nearby_facilities: "Nearby Facilities",
    fuel_stations: "Fuel Stations",
    rest_areas: "Rest Areas",
    service_centers: "Service Centers",
    hospitals: "Hospitals",
    nearby: "nearby",
    post_job: "Post Job",
    find_drivers: "Find Drivers",
    search: "Search",
    manage_jobs: "Manage Jobs",
    manage: "Manage",
    recommended_drivers: "Recommended Drivers",
    view_all_drivers: "View All Drivers",
    years_experience: "years experience",
    sign_out: "Sign Out",
    home: "Home",
    jobs: "Jobs",
    alerts: "Alerts",
    profile: "Profile",
    drivers: "Drivers",
    support_chat: "Support Chat",
    how_can_i_help: "Hi there! How can I help you with SIGNO Connect today?",
    type_message: "Type your message...",
    manage_trips: "Manage Trips", // English translation
  },
  hi: {
    welcome: "SIGNO Connect में आपका स्वागत है",
    welcome_subtitle: "ड्राइवरों और ट्रांसपोर्टरों को जोड़ने वाला लॉजिस्टिक्स मार्केटप्लेस",
    driver: "ड्राइवर",
    transporter: "फ्लीट मालिक/ट्रांसपोर्टर",
    already_have_account: "क्या आपके पास पहले से एक खाता है?",
    sign_in: "साइन इन करें",
    back: "वापस",
    driver_registration: "ड्राइवर पंजीकरण",
    transporter_registration: "फ्लीट मालिक पंजीकरण",
    create_account_steps: "कुछ आसान चरणों में अपना खाता बनाएं",
    basic_info: "बुनियादी जानकारी",
    verification: "सत्यापन",
    documents: "दस्तावेज़",
    company: "कंपनी",
    success: "सफलता",
    full_name: "पूरा नाम",
    mobile_number: "मोबाइल नंबर",
    preferred_job_locations: "पसंदीदा नौकरी स्थान",
    optional: "वैकल्पिक",
    continue: "जारी रखें",
    verify_number: "अपना नंबर सत्यापित करें",
    otp_sent: "हमने 6 अंकों का OTP भेजा है",
    enter_otp: "OTP दर्ज करें",
    didnt_receive_otp: "OTP प्राप्त नहीं हुआ?",
    resend: "पुनः भेजें",
    verify: "सत्यापित करें",
    upload_docs_optional: "सत्यापन के लिए अपने दस्तावेज़ अपलोड करें (बेसिक साइन-अप के लिए वैकल्पिक)",
    driving_license: "ड्राइविंग लाइसेंस",
    upload_license: "लाइसेंस अपलोड करें",
    identity_proof: "पहचान प्रमाण",
    upload_id_proof: "पहचान प्रमाण अपलोड करें",
    accepted_formats: "स्वीकृत प्रारूप: आधार, पासपोर्ट, वोटर आईडी",
    skip_for_now: "अभी के लिए छोड़ें",
    complete_later: "आप इस चरण को बाद में पूरा कर सकते हैं",
    registration_successful: "पंजीकरण सफल!",
    account_created: "आपका खाता सफलतापूर्वक बनाया गया है।",
    next_steps: "अगले कदम:",
    go_to_dashboard: "डैशबोर्ड पर जाएं",
    email_address: "ईमेल पता",
    company_name: "कंपनी का नाम",
    fleet_size: "फ्लीट का आकार",
    company_registration: "कंपनी पंजीकरण",
    upload_document: "दस्तावेज़ अपलोड करें",
    gst_business_registration: "GST प्रमाणपत्र, व्यापार पंजीकरण, आदि।",
    welcome_user: "स्वागत है,",
    complete_profile: "प्रोफ़ाइल पूरा करें",
    find_jobs: "नौकरियां खोजें",
    recommended_jobs: "अनुशंसित नौकरियां",
    view_all_jobs: "सभी नौकरियां देखें",
    nearby_facilities: "नज़दीकी सुविधाएँ",
    fuel_stations: "ईंधन स्टेशन",
    rest_areas: "आराम क्षेत्र",
    service_centers: "सेवा केंद्र",
    hospitals: "अस्पताल",
    nearby: "नज़दीक",
    post_job: "नौकरी पोस्ट करें",
    find_drivers: "ड्राइवर खोजें",
    search: "खोज",
    manage_jobs: "नौकरियां प्रबंधित करें",
    manage: "प्रबंधित करें",
    recommended_drivers: "अनुशंसित ड्राइवर",
    view_all_drivers: "सभी ड्राइवर देखें",
    years_experience: "वर्षों का अनुभव",
    sign_out: "साइन आउट",
    home: "होम",
    jobs: "नौकरियां",
    alerts: "अलर्ट",
    profile: "प्रोफाइल",
    drivers: "ड्राइवर",
    support_chat: "सहायता चैट",
    how_can_i_help: "नमस्ते! मैं SIGNO Connect के साथ आपकी कैसे मदद कर सकता हूं?",
    type_message: "अपना संदेश टाइप करें...",
    manage_trips: "यात्राओं का प्रबंधन करें", // Hindi translation
  },
  ml: {
    welcome: "SIGNO Connect-ലേക്ക് സ്വാഗതം",
    welcome_subtitle: "ഡ്രൈവർമാരെയും ട്രാൻസ്പോർട്ടർമാരെയും ബന്ധിപ്പിക്കുന്ന ലോജിസ്റ്റിക്സ് മാർക്കറ്റ്പ്ലേസ്",
    driver: "ഡ്രൈവർ",
    transporter: "ഫ്ലീറ്റ് ഉടമ/ട്രാൻസ്പോർട്ടർ",
    already_have_account: "ഇതിനകം ഒരു അക്കൗണ്ട് ഉണ്ടോ?",
    sign_in: "സൈൻ ഇൻ",
    back: "തിരികെ",
    driver_registration: "ഡ്രൈവർ രജിസ്ട്രേഷൻ",
    transporter_registration: "ഫ്ലീറ്റ് ഉടമ രജിസ്ട്രേഷൻ",
    create_account_steps: "ചുരുക്കം ചില നടപടികളിലൂടെ നിങ്ങളുടെ അക്കൗണ്ട് സൃഷ്ടിക്കുക",
    basic_info: "അടിസ്ഥാന വിവരം",
    verification: "പരിശോധന",
    documents: "രേഖകൾ",
    company: "കമ്പനി",
    success: "വിജയം",
    full_name: "മുഴുവൻ പേര്",
    mobile_number: "മൊബൈൽ നമ്പർ",
    preferred_job_locations: "മുൻഗണന ജോലി സ്ഥലങ്ങൾ",
    optional: "ഓപ്ഷണൽ",
    continue: "തുടരുക",
    verify_number: "നിങ്ങളുടെ നമ്പർ പരിശോധിക്കുക",
    otp_sent: "ഞങ്ങൾ 6 അക്ക OTP അയച്ചിട്ടുണ്ട്",
    enter_otp: "OTP നൽകുക",
    didnt_receive_otp: "OTP ലഭിച്ചില്ലേ?",
    resend: "വീണ്ടും അയയ്ക്കുക",
    verify: "പരിശോധിക്കുക",
    upload_docs_optional: "പരിശോധനയ്ക്കായി നിങ്ങളുടെ രേഖകൾ അപ്‌ലോഡ് ചെയ്യുക (അടിസ്ഥാന സൈൻ-അപ്പിന് ഓപ്ഷണൽ)",
    driving_license: "ഡ്രൈവിംഗ് ലൈസൻസ്",
    upload_license: "ലൈസൻസ് അപ്‌ലോഡ് ചെയ്യുക",
    identity_proof: "തിരിച്ചറിയൽ രേഖ",
    upload_id_proof: "ഐഡി പ്രൂഫ് അപ്‌ലോഡ് ചെയ്യുക",
    accepted_formats: "സ്വീകരിക്കുന്ന ഫോർമാറ്റുകൾ: ആധാർ, പാസ്പോർട്ട്, വോട്ടർ ഐഡി",
    skip_for_now: "ഇപ്പോൾ ഒഴിവാക്കുക",
    complete_later: "ഈ ഘട്ടം നിങ്ങൾക്ക് പിന്നീട് പൂർത്തിയാക്കാം",
    registration_successful: "രജിസ്ട്രേഷൻ വിജയകരമായി!",
    account_created: "നിങ്ങളുടെ അക്കൗണ്ട് വിജയകരമായി സൃഷ്ടിച്ചു.",
    next_steps: "അടുത്ത ഘട്ടങ്ങൾ:",
    go_to_dashboard: "ഡാഷ്ബോർഡിലേക്ക് പോകുക",
    email_address: "ഇമെയിൽ വിലാസം",
    company_name: "കമ്പനി പേര്",
    fleet_size: "ഫ്ലീറ്റ് വലുപ്പം",
    company_registration: "കമ്പനി രജിസ്ട്രേഷൻ",
    upload_document: "രേഖ അപ്‌ലോഡ് ചെയ്യുക",
    gst_business_registration: "GST സർട്ടിഫിക്കറ്റ്, ബിസിനസ് രജിസ്ട്രേഷൻ, തുടങ്ങിയവ.",
    welcome_user: "സ്വാഗതം,",
    complete_profile: "പ്രൊഫൈൽ പൂർത്തിയാക്കുക",
    find_jobs: "ജോലികൾ കണ്ടെത്തുക",
    recommended_jobs: "ശുപാർശ ചെയ്ത ജോലികൾ",
    view_all_jobs: "എല്ലാ ജോലികളും കാണുക",
    nearby_facilities: "സമീപത്തുള്ള സൗകര്യങ്ങൾ",
    fuel_stations: "ഇന്ധന സ്റ്റേഷനുകൾ",
    rest_areas: "വിശ്രമകേന്ദ്രങ്ങൾ",
    service_centers: "സേവന കേന്ദ്രങ്ങൾ",
    hospitals: "ആശുപത്രികൾ",
    nearby: "സമീപത്തുള്ള",
    post_job: "ജോലി പോസ്റ്റ് ചെയ്യുക",
    find_drivers: "ഡ്രൈവർമാരെ കണ്ടെത്തുക",
    search: "തിരയുക",
    manage_jobs: "ജോലികൾ നിയന്ത്രിക്കുക",
    manage: "നിയന്ത്രിക്കുക",
    recommended_drivers: "ശുപാർശ ചെയ്ത ഡ്രൈവർമാർ",
    view_all_drivers: "എല്ലാ ഡ്രൈവർമാരെയും കാണുക",
    years_experience: "വർഷത്തെ പരിചയം",
    sign_out: "സൈൻ ഔട്ട്",
    home: "ഹോം",
    jobs: "ജോലികൾ",
    alerts: "അറിയിപ്പുകൾ",
    profile: "പ്രൊഫൈൽ",
    drivers: "ഡ്രൈവർമാർ",
    support_chat: "സപ്പോർട്ട് ചാറ്റ്",
    how_can_i_help: "ഹായ്! SIGNO Connect-മായി ബന്ധപ്പെട്ട് എങ്ങനെ സഹായിക്കാൻ കഴിയും?",
    type_message: "നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക...",
    manage_trips: "യാത്രകൾ കൈകാര്യം ചെയ്യുക", // Malayalam translation
  },
  ta: {
    welcome: "SIGNO Connect-க்கு வரவேற்கிறோம்",
    welcome_subtitle: "டிரைவர்கள் மற்றும் போக்குவரத்தாளர்களை இணைக்கும் லாஜிஸ்டிக்ஸ் சந்தை",
    driver: "டிரைவர்",
    transporter: "வாகன உரிமையாளர்/போக்குவரத்தாளர்",
    already_have_account: "ஏற்கனவே கணக்கு உள்ளதா?",
    sign_in: "உள்நுழைக",
    back: "பின்செல்",
    driver_registration: "டிரைவர் பதிவு",
    transporter_registration: "வாகன உரிமையாளர் பதிவு",
    create_account_steps: "சில எளிய படிகளில் உங்கள் கணக்கை உருவாக்கவும்",
    basic_info: "அடிப்படை தகவல்",
    verification: "சரிபார்ப்பு",
    documents: "ஆவணங்கள்",
    company: "நிறுவனம்",
    success: "வெற்றி",
    full_name: "முழு பெயர்",
    mobile_number: "மொபைல் எண்",
    preferred_job_locations: "விருப்பமான வேலை இடங்கள்",
    optional: "விருப்பத்திற்குரியது",
    continue: "தொடரவும்",
    verify_number: "உங்கள் எண்ணை சரிபார்க்கவும்",
    otp_sent: "நாங்கள் 6 இலக்க OTP அனுப்பியுள்ளோம்",
    enter_otp: "OTP ஐ உள்ளிடவும்",
    didnt_receive_otp: "OTP பெறவில்லையா?",
    resend: "மீண்டும் அனுப்பு",
    verify: "சரிபார்க்க",
    upload_docs_optional: "சரிபார்ப்புக்காக உங்கள் ஆவணங்களை பதிவேற்றவும் (அடிப்படை பதிவுக்கு விருப்பத்திற்குரியது)",
    driving_license: "ஓட்டுநர் உரிமம்",
    upload_license: "உரிமத்தை பதிவேற்றவும்",
    identity_proof: "அடையாள சான்று",
    upload_id_proof: "அடையாள சான்றை பதிவேற்றவும்",
    accepted_formats: "ஏற்றுக்கொள்ளப்பட்ட வடிவங்கள்: ஆதார், பாஸ்போர்ட், வாக்காளர் அடையாள அட்டை",
    skip_for_now: "தற்போதைக்கு தவிர்க்கவும்",
    complete_later: "இந்த படியை நீங்கள் பின்னர் முடிக்கலாம்",
    registration_successful: "பதிவு வெற்றிகரமாக முடிந்தது!",
    account_created: "உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது.",
    next_steps: "அடுத்த படிகள்:",
    go_to_dashboard: "டாஷ்போர்டுக்குச் செல்லவும்",
    email_address: "மின்னஞ்சல் முகவரி",
    company_name: "நிறுவனத்தின் பெயர்",
    fleet_size: "வாகன எண்ணிக்கை",
    company_registration: "நிறுவன பதிவு",
    upload_document: "ஆவணத்தை பதிவேற்றவும்",
    gst_business_registration: "GST சான்றிதழ், வணிக பதிவு, முதலியன.",
    welcome_user: "வரவேற்கிறோம்,",
    complete_profile: "சுயவிவரத்தை முடிக்கவும்",
    find_jobs: "வேலைகளைக் கண்டறியவும்",
    recommended_jobs: "பரிந்துரைக்கப்பட்ட வேலைகள்",
    view_all_jobs: "அனைத்து வேலைகளையும் காண",
    nearby_facilities: "அருகிலுள்ள வசதிகள்",
    fuel_stations: "எரிபொருள் நிலையங்கள்",
    rest_areas: "ஓய்வு பகுதிகள்",
    service_centers: "சேவை மையங்கள்",
    hospitals: "மருத்துவமனைகள்",
    nearby: "அருகில்",
    post_job: "வேலை பதிவிடுக",
    find_drivers: "டிரைவர்களைக் கண்டறியவும்",
    search: "தேடல்",
    manage_jobs: "வேலைகளை நிர்வகிக்கவும்",
    manage: "நிர்வகிக்க",
    recommended_drivers: "பரிந்துரைக்கப்பட்ட டிரைவர்கள்",
    view_all_drivers: "அனைத்து டிரைவர்களையும் காண",
    years_experience: "ஆண்டுகள் அனுபவம்",
    sign_out: "வெளியேறு",
    home: "முகப்பு",
    jobs: "வேலைகள்",
    alerts: "விழிப்பூட்டல்கள்",
    profile: "சுயவிவரம்",
    drivers: "டிரைவர்கள்",
    support_chat: "ஆதரவு அரட்டை",
    how_can_i_help: "வணக்கம்! SIGNO Connect பற்றி உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    type_message: "உங்கள் செய்தியை தட்டச்சு செய்யவும்...",
    manage_trips: "பயணங்களை நிர்வகிக்கவும்", // Tamil translation
  }
};

// Zustand store for language state
interface LanguageState {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: "en",
  setLanguage: (language) => set({ currentLanguage: language }),
  t: (key) => {
    const { currentLanguage } = get();
    return translations[currentLanguage][key] || translations.en[key] || key;
  }
}));
