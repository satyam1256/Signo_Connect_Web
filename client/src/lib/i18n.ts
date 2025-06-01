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
  | "manage_your_trips"
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
  | "type_message"
  | "complete_profile_hint"
  | "recently"
  | "just_now"
  | "one_day_ago"
  | "days_ago"
  | "enter_full_name"
  | "contact_information"
  | "work_details"
  | "preferred_vehicle_types"
  | "date_of_birth"
  | "emergency_contact"
  | "phone_number"
  | "address"
  | "experience"
  | "profile_completion"
  | "profile_status"
  | "complete"
  | "add_your"
  | "profile_complete"
  | "account"
  | "help_and_support"
  | "notification_settings"
  | "language_settings"
  | "logout"
  | "account_information"
  | "account_type"
  | "edit_profile"
  | "update_profile_info"
  | "personal_information"
  | "professional_information"
  | "front_side"
  | "back_side"
  | "uploaded"
  | "view_current"
  | "new_file_selected"
  | "current_value"
  | "using_data_value"
  | "save_changes"
  | "cancel"
  | "saving"
  | "account_settings"
  | "manage_account_settings"
  | "change_password"
  | "deactivate_account"
  | "close"
  | "get_assistance"
  | "customer_support"
  | "need_immediate_assistance"
  | "helpline"
  | "manage_notifications"
  | "email_notifications"
  | "receive_updates_email"
  | "sms_notifications"
  | "receive_updates_sms"
  | "choose_language"
  | "more_languages_coming_soon"
  | "trips"
  | "details"
  | "preferences"
  | "not_added"
  | "license_number"
  | "aadhar_number"
  | "email_label"
  | "account_settings_placeholder"
  | "preferences_placeholder"
  | "profile_status_label"
  | "percent_complete"
  | "add_your_item"
  | "years_label"
  | "select_experience_placeholder"
  | "select_vehicle_types_placeholder"
  | "selected_vehicle_types"
  | "get_assistance_and_support"
  | "contact_support"
  | "customer_support_heading"
  | "immediate_assistance_text"
  | "helpline_label"
  | "close_button"
  | "manage_notifications_description"
  | "email_notifications_label"
  | "receive_updates_email_text"
  | "sms_notifications_label"
  | "receive_updates_sms_text"
  | "save_changes_button"
  | "cancel_button"
  | "choose_language_description"
  | "english_language_option"
  | "hindi_language_option"
  | "profile_picture"
  | "contact_support_hint"
  | "aadhar_card"
  | "year"
  | "search_placeholder"
  | "filter_jobs"
  | "job_type"
  | "salary_range"
  | "other_options"
  | "show_new_jobs"
  | "hide_applied_jobs"
  | "active_filters"
  | "clear_all"
  | "all_jobs"
  | "saved"
  | "applied"
  | "loading_jobs"
  | "loading_jobs_message"
  | "error_fetching_jobs"
  | "error_fetching_jobs_message"
  | "no_jobs_found"
  | "no_jobs_found_message"
  | "openings"
  | "save_job"
  | "remove"
  | "apply_now"
  | "applying"
  | "no_saved_jobs"
  | "no_saved_jobs_message"
  | "loading_applications"
  | "no_applications"
  | "no_applications_message"
  | "applied_on"
  | "status"
  | "load_more"
  | "job_location_label"
  | "job_salary_label"
  | "job_type_label"
  | "job_distance_label"
  | "job_openings_label"
  | "full_time"
  | "part_time"
  | "job_distance_placeholder"
  | "error_details"
  | "description";

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
    manage_your_trips: "Manage Trips",
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
    years_experience: "Years Experience",
    sign_out: "Sign Out",
    home: "Home",
    jobs: "Jobs",
    alerts: "Alerts",
    profile: "Profile",
    drivers: "Drivers",
    support_chat: "Support Chat",
    how_can_i_help: "Hi there! How can I help you with SIGNO Connect today?",
    type_message: "Type your message...",
    complete_profile_hint: "Complete your profile to get better job recommendations",
    recently: "Recently",
    just_now: "Just now",
    one_day_ago: "1 day ago",
    days_ago: "{count} days ago",
    enter_full_name: "Enter your full name",
    contact_information: "Contact Information",
    work_details: "Work Details",
    preferred_vehicle_types: "Preferred Vehicle Types",
    date_of_birth: "Date of Birth",
    emergency_contact: "Emergency Contact",
    phone_number: "Phone Number",
    address: "Address",
    experience: "Experience",
    profile_completion: "Profile Completion",
    profile_status: "Profile Status",
    complete: "Complete",
    add_your: "Add your",
    profile_complete: "Profile Complete",
    account: "Account",
    help_and_support: "Help & Support",
    notification_settings: "Notification Settings",
    language_settings: "Language Settings",
    logout: "Logout",
    account_information: "Account Information",
    account_type: "Account Type",
    edit_profile: "Edit Profile",
    update_profile_info: "Update your profile information. Ensure all details are accurate.",
    personal_information: "Personal Information",
    professional_information: "Professional Information",
    front_side: "Front Side",
    back_side: "Back Side",
    uploaded: "Uploaded",
    view_current: "View current",
    new_file_selected: "New file selected:",
    current_value: "Current value:",
    using_data_value: "Using data value:",
    save_changes: "Save Changes",
    cancel: "Cancel",
    saving: "Saving...",
    account_settings: "Account Settings",
    manage_account_settings: "Manage your account settings and preferences.",
    change_password: "Change Password",
    deactivate_account: "Deactivate Account",
    close: "Close",
    get_assistance: "Get assistance and support.",
    customer_support: "Customer Support",
    need_immediate_assistance: "Need immediate assistance? Our team is available 24/7 to help you.",
    helpline: "Helpline:",
    manage_notifications: "Manage how you receive notifications.",
    email_notifications: "Email Notifications",
    receive_updates_email: "Receive updates and alerts via email",
    sms_notifications: "SMS Notifications",
    receive_updates_sms: "Receive updates and alerts via SMS",
    choose_language: "Choose your preferred language.",
    more_languages_coming_soon: "More languages and settings coming soon.",
    trips: "Trips",
    details: "Details",
    preferences: "Preferences",
    not_added: "Not added",
    license_number: "License Number",
    aadhar_number: "Aadhar Number",
    email_label: "Email:",
    account_settings_placeholder: "Account settings options will appear here.",
    preferences_placeholder: "Preferences content goes here.",
    profile_status_label: "Profile Status",
    percent_complete: "{percentage}% Complete",
    add_your_item: "Add your {item}",
    years_label: "years",
    select_experience_placeholder: "Select years of experience",
    select_vehicle_types_placeholder: "Select vehicle types",
    selected_vehicle_types: "Selected: {count} vehicle type(s)",
    get_assistance_and_support: "Get assistance and support.",
    contact_support: "Contact Support",
    customer_support_heading: "Customer Support",
    immediate_assistance_text: "Need immediate assistance? Our team is available 24/7 to help you.",
    helpline_label: "Helpline:",
    close_button: "Close",
    manage_notifications_description: "Manage how you receive notifications.",
    email_notifications_label: "Email Notifications",
    receive_updates_email_text: "Receive updates and alerts via email",
    sms_notifications_label: "SMS Notifications",
    receive_updates_sms_text: "Receive updates and alerts via SMS",
    save_changes_button: "Save Changes",
    cancel_button: "Cancel",
    choose_language_description: "Choose your preferred language.",
    english_language_option: "English",
    hindi_language_option: "हिंदी (Hindi)",
    profile_picture: "Profile Picture",
    contact_support_hint: "Contact support to update phone number.",
    aadhar_card: "Aadhar Card",
    year: "year",
    search_placeholder: "Search jobs, companies, locations...",
    filter_jobs: "Filter Jobs",
    job_type: "Job Type",
    salary_range: "Salary Range",
    other_options: "Other Options",
    show_new_jobs: "Show new jobs only",
    hide_applied_jobs: "Hide jobs I've applied to",
    active_filters: "Active Filters",
    clear_all: "Clear All",
    all_jobs: "All Jobs",
    saved: "Saved",
    applied: "Applied",
    loading_jobs: "Loading Jobs...",
    loading_jobs_message: "Please wait while we fetch available jobs.",
    error_fetching_jobs: "Error Fetching Jobs",
    error_fetching_jobs_message: "We couldn't load the jobs. Please try again later.",
    no_jobs_found: "No jobs found",
    no_jobs_found_message: "We couldn't find any jobs matching your search criteria. Try adjusting your filters or search term.",
    openings: "openings",
    save_job: "Save Job",
    remove: "Remove",
    apply_now: "Apply Now",
    applying: "Applying...",
    no_saved_jobs: "No saved jobs yet",
    no_saved_jobs_message: "Jobs you save will appear here for easy access. Start browsing jobs and save the ones you're interested in.",
    loading_applications: "Loading Applications...",
    no_applications: "No applications yet",
    no_applications_message: "Start applying to jobs to track your application status here.",
    applied_on: "Applied on",
    status: "Status",
    load_more: "Load More",
    job_location_label: "Job Location",
    job_salary_label: "Salary",
    job_type_label: "Job Type",
    job_distance_label: "Distance",
    job_openings_label: "Openings",
    full_time: "Full-time",
    part_time: "Part-time",
    job_distance_placeholder: "Details in description",
    error_details: "Details",
    description: "Description"
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
    manage_your_trips: "यात्राओं का प्रबंधन करें",
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
    profile: "प्रोफ़ाइल",
    drivers: "ड्राइवर",
    support_chat: "सहायता चैट",
    how_can_i_help: "नमस्ते! मैं SIGNO Connect के साथ आपकी कैसे मदद कर सकता हूं?",
    type_message: "अपना संदेश टाइप करें...",
    complete_profile_hint: "बेहतर नौकरी के सुझाव पाने के लिए अपनी प्रोफ़ाइल पूरी करें",
    recently: "हाल ही में",
    just_now: "अभी",
    one_day_ago: "1 दिन पहले",
    days_ago: "{count} दिन पहले",
    enter_full_name: "अपना पूरा नाम दर्ज करें",
    contact_information: "संपर्क जानकारी",
    work_details: "कार्य विवरण",
    preferred_vehicle_types: "पसंदीदा वाहन प्रकार",
    date_of_birth: "जन्म तिथि",
    emergency_contact: "आपातकालीन संपर्क",
    phone_number: "फोन नंबर",
    address: "पता",
    experience: "अनुभव",
    profile_completion: "प्रोफ़ाइल पूर्णता",
    profile_status: "प्रोफ़ाइल स्थिति",
    complete: "पूर्ण",
    add_your: "अपना जोड़ें",
    profile_complete: "प्रोफ़ाइल पूर्ण",
    account: "खाता",
    help_and_support: "सहायता और समर्थन",
    notification_settings: "सूचना सेटिंग्स",
    language_settings: "भाषा सेटिंग्स",
    logout: "लॉग आउट",
    account_information: "खाता जानकारी",
    account_type: "खाता प्रकार",
    edit_profile: "प्रोफ़ाइल संपादित करें",
    update_profile_info: "अपनी प्रोफ़ाइल जानकारी अपडेट करें। सुनिश्चित करें कि सभी विवरण सटीक हैं।",
    personal_information: "व्यक्तिगत जानकारी",
    professional_information: "पेशेवर जानकारी",
    front_side: "सामने की तरफ",
    back_side: "पीछे की तरफ",
    uploaded: "अपलोड किया गया",
    view_current: "वर्तमान देखें",
    new_file_selected: "नई फ़ाइल चुनी गई:",
    current_value: "वर्तमान मान:",
    using_data_value: "डेटा मान का उपयोग कर रहे हैं:",
    save_changes: "परिवर्तन सहेजें",
    cancel: "रद्द करें",
    saving: "सहेज रहे हैं...",
    account_settings: "खाता सेटिंग्स",
    manage_account_settings: "अपनी खाता सेटिंग्स और प्राथमिकताएं प्रबंधित करें।",
    change_password: "पासवर्ड बदलें",
    deactivate_account: "खाता निष्क्रिय करें",
    close: "बंद करें",
    get_assistance: "सहायता और समर्थन प्राप्त करें।",
    customer_support: "ग्राहक सहायता",
    need_immediate_assistance: "तत्काल सहायता चाहिए? हमारी टीम आपकी मदद के लिए 24/7 उपलब्ध है।",
    helpline: "हेल्पलाइन:",
    manage_notifications: "प्रबंधित करें कि आप कैसे सूचनाएं प्राप्त करते हैं।",
    email_notifications: "ईमेल सूचनाएं",
    receive_updates_email: "ईमेल के माध्यम से अपडेट और अलर्ट प्राप्त करें",
    sms_notifications: "एसएमएस सूचनाएं",
    receive_updates_sms: "एसएमएस के माध्यम से अपडेट और अलर्ट प्राप्त करें",
    choose_language: "अपनी पसंदीदा भाषा चुनें।",
    more_languages_coming_soon: "अधिक भाषाएं और सेटिंग्स जल्द आ रही हैं।",
    trips: "यात्राएं",
    details: "विवरण",
    preferences: "पसंद",
    not_added: "जोड़ा नहीं गया",
    license_number: "लाइसेंस नंबर",
    aadhar_number: "आधार नंबर",
    email_label: "ईमेल:",
    account_settings_placeholder: "खाता सेटिंग विकल्प यहां दिखाई देंगे।",
    preferences_placeholder: "पसंद की सामग्री यहां जाती है।",
    profile_status_label: "प्रोफ़ाइल स्थिति",
    percent_complete: "{percentage}% पूर्ण",
    add_your_item: "अपना {item} जोड़ें",
    years_label: "साल",
    select_experience_placeholder: "अनुभव के वर्ष चुनें",
    select_vehicle_types_placeholder: "वाहन प्रकार चुनें",
    selected_vehicle_types: "चयनित: {count} वाहन प्रकार(",
    get_assistance_and_support: "सहायता और समर्थन प्राप्त करें।",
    contact_support: "सहायता से संपर्क करें",
    customer_support_heading: "ग्राहक सहायता",
    immediate_assistance_text: "तत्काल सहायता चाहिए? हमारी टीम आपकी मदद के लिए 24/7 उपलब्ध है।",
    helpline_label: "हेल्पलाइन:",
    close_button: "बंद करें",
    manage_notifications_description: "प्रबंधित करें कि आप कैसे सूचनाएं प्राप्त करते हैं।",
    email_notifications_label: "ईमेल सूचनाएं",
    receive_updates_email_text: "ईमेल के माध्यम से अपडेट और अलर्ट प्राप्त करें",
    sms_notifications_label: "एसएमएस सूचनाएं",
    receive_updates_sms_text: "एसएमएस के माध्यम से अपडेट और अलर्ट प्राप्त करें",
    save_changes_button: "परिवर्तन सहेजें",
    cancel_button: "रद्द करें",
    choose_language_description: "अपनी पसंदीदा भाषा चुनें।",
    english_language_option: "अंग्रेजी",
    hindi_language_option: "हिंदी",
    profile_picture: "प्रोफाइल चित्र",
    contact_support_hint: "फोन नंबर अपडेट करने के लिए सहायता से संपर्क करें।",
    aadhar_card: "आधार कार्ड",
    year: "साल",
    search_placeholder: "नौकरियों, कंपनियों, स्थानों को खोजें...",
    filter_jobs: "नौकरियों को फ़िल्टर करें",
    job_type: "नौकरी का प्रकार",
    salary_range: "वेतन सीमा",
    other_options: "अन्य विकल्प",
    show_new_jobs: "केवल नई नौकरियां दिखाएं",
    hide_applied_jobs: "जिन नौकरियों के लिए आवेदन किया है उन्हें छिपाएं",
    active_filters: "सक्रिय फ़िल्टर",
    clear_all: "सभी साफ़ करें",
    all_jobs: "सभी नौकरियां",
    saved: "सहेजा गया",
    applied: "आवेदन किया गया",
    loading_jobs: "नौकरियां लोड हो रही हैं...",
    loading_jobs_message: "कृपया प्रतीक्षा करें, हम नौकरियां ला रहे हैं।",
    error_fetching_jobs: "नौकरियां लाने में त्रुटि",
    error_fetching_jobs_message: "हम नौकरियां लोड नहीं कर सके। कृपया बाद में पुनः प्रयास करें।",
    no_jobs_found: "कोई नौकरी नहीं मिली",
    no_jobs_found_message: "आपके खोज मानदंड से मेल खाती कोई नौकरी नहीं मिली। कृपया फ़िल्टर या शब्द बदलें।",
    openings: "खाली पद",
    save_job: "नौकरी सहेजें",
    remove: "हटाएं",
    apply_now: "अभी आवेदन करें",
    applying: "आवेदन हो रहा है...",
    no_saved_jobs: "कोई सहेजी गई नौकरियां नहीं",
    no_saved_jobs_message: "आपकी सहेजी गई नौकरियां यहां दिखाई देंगी। पसंदीदा नौकरियां सहेजना शुरू करें।",
    loading_applications: "आवेदन लोड हो रहे हैं...",
    no_applications: "कोई आवेदन नहीं",
    no_applications_message: "यहां अपनी आवेदन स्थिति ट्रैक करने के लिए नौकरियों के लिए आवेदन करें।",
    applied_on: "को आवेदन किया",
    status: "स्थिति",
    load_more: "और लोड करें",
    job_location_label: "नौकरी स्थान",
    job_salary_label: "वेतन",
    job_type_label: "नौकरी प्रकार",
    job_distance_label: "दूरी",
    job_openings_label: "रिक्तियाँ",
    full_time: "पूर्णकालिक",
    part_time: "अंशकालिक",
    job_distance_placeholder: "विवरण में विवरण",
    error_details: "विवरण",
    description: "विवरण"
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
    resend: "മീണ്ടുമ്പോൾ അയയ്ക്കുക",
    verify: "പരിശോധിക്കുക",
    upload_docs_optional: "പരിശോധനയ്ക്കായി നിങ്ങളുടെ രേഖകൾ അപ്ലോഡ് ചെയ്യുക (അടിസ്ഥാന സൈൻ-അപ്പിന് ഓപ്ഷണൽ)",
    driving_license: "ഡ്രൈവിംഗ് ലൈസൻസ്",
    upload_license: "ലൈസൻസ് അപ്ലോഡ് ചെയ്യുക",
    identity_proof: "തിരിച്ചറിയൽ രേഖ",
    upload_id_proof: "ഐഡി പ്രൂഫ് അപ്ലോഡ് ചെയ്യുക",
    accepted_formats: "സ്വീകരിക്കുന്ന ഫോർമാറ്റുകൾ: ആധാർ, പാസ്പോര്ട്ട്, വോട്ടർ ഐഡി",
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
    upload_document: "രേഖ അപ്ലോഡ് ചെയ്യുക",
    gst_business_registration: "GST സർട്ടിഫിക്കറ്റ്, ബിസിനസ് രജിസ്ട്രേഷൻ, തുടങ്ങിയവ.",
    welcome_user: "സ്വാഗതം,",
    complete_profile: "പ്രൊഫൈൽ പൂർത്തിയാക്കുക",
    find_jobs: "ജോലികൾ കണ്ടെത്തുക",
    manage_your_trips: "നിങ്ങളുടെ യാത്രകൾ നിയന്ത്രിക്കുക",
    recommended_jobs: "ശുപാർശ ചെയ്ത ജോലികൾ",
    view_all_jobs: "എല്ലാ ജോലികളും കാണുക",
    nearby_facilities: "സമീപത്തുള്ള സൗകര്യങ്ങൾ",
    fuel_stations: "ഇന്ധന സ്റ്റേഷനുകൾ",
    rest_areas: "വിശ്രമകേന്ദ്രങ്ങൾ",
    service_centers: "സേവന കേന്ദ്രങ്ങൾ",
    hospitals: "ആശുപത്രികൾ",
    nearby: "സമീപത്തുള്ള",
    post_job: "ജോലി പോസ്റ്റ് ചെയ്യുക",
    find_drivers: "ഡ്രായവരെ കണ്ടെത്തുക",
    search: "തിരയുക",
    manage_jobs: "ജോലികൾ നിയന്ത്രിക്കുക",
    manage: "നിയന്ത്രിക്കുക",
    recommended_drivers: "ശുപാർശ ചെയ്ത ഡ്രായവരെയും കാണുക",
    view_all_drivers: "എല്ലാ ഡ്രായവരെയും കാണുക",
    years_experience: "വർഷത്തെ പരിചയം",
    sign_out: "സൈൻ ഔട്ട്",
    home: "ഹോം",
    jobs: "ജോലികൾ",
    alerts: "അറിയിപ്പുകൾ",
    profile: "പ്രൊഫൈൽ",
    drivers: "ഡ്രായവരെയും",
    support_chat: "സപ്പോർട്ട് ചാറ്റ്",
    how_can_i_help: "ഹായ്! SIGNO Connect-മായി ബന്ധപ്പെട്ട് എങ്ങനെ സഹായിക്കാൻ കഴിയും?",
    type_message: "നിങ്ങളുടെ സന്ദേശം ടൈപ്പ് ചെയ്യുക...",
    complete_profile_hint: "മികച്ച ജോലി ശുപാർശകൾ ലഭിക്കാൻ നിങ്ങളുടെ പ്രൊഫൈൽ പൂർത്തിയാക്കുക",
    recently: "അടുത്തിടെ",
    just_now: "ഇപ്പോൾ",
    one_day_ago: "1 ദിവസം മുമ്പ്",
    days_ago: "{count} ദിവസങ്ങൾക്ക് മുമ്പ്",
    enter_full_name: "നിങ്ങളുടെ പൂർണ്ണ നാമം നൽകുക",
    contact_information: "ബന്ധപ്പെടൽ വിവരങ്ങൾ",
    work_details: "ജോലി വിശദാംശങ്ങൾ",
    preferred_vehicle_types: "ആഗ്രഹിക്കുന്ന വാഹന തരങ്ങൾ",
    date_of_birth: "ജനന തീയതി",
    emergency_contact: "അടിയന്തിര ബന്ധപ്പെടൽ",
    phone_number: "ഫോൺ നമ്പർ",
    address: "വിലാസം",
    experience: "അനുഭവം",
    profile_completion: "പ്രൊഫൈൽ പൂർത്തീകരണം",
    profile_status: "പ്രൊഫൈൽ നില",
    complete: "പൂർത്തിയായി",
    add_your: "നിങ്ങളുടെ ചേർക്കുക",
    profile_complete: "പ്രൊഫൈൽ പൂർത്തിയായി",
    account: "അക്കൗണ്ട്",
    help_and_support: "സഹായവും പിന്തുണയും",
    notification_settings: "അറിയിപ്പ് ക്രമീകരണങ്ങൾ",
    language_settings: "ഭാഷാ ക്രമീകരണങ്ങൾ",
    logout: "ലോഗൗട്ട്",
    account_information: "അക്കൗണ്ട് വിവരങ്ങൾ",
    account_type: "അക്കൗണ്ട് തരം",
    edit_profile: "പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക",
    update_profile_info: "നിങ്ങളുടെ പ്രൊഫൈൽ വിവരങ്ങൾ അപ്ഡേറ്റ് ചെയ്യുക. എല്ലാ വിശദാംശങ്ങളും കൃത്യമാണെന്ന് ഉറ്പ്പുവരുത്തുക.",
    personal_information: "തഩിപ്പട്ട വിവരങ്ങൾ",
    professional_information: "തൊഴിൽ വിവരങ്ങൾ",
    front_side: "മുന്നിലെ വശം",
    back_side: "പിന്നിലെ വശം",
    uploaded: "അപ്ലോഡ് ചെയ്യുക",
    view_current: "നിലവിലെ കാണുക",
    new_file_selected: "പുതിയ ഫയൽ തിരഞ്ഞെടുത്തു:",
    current_value: "നിലവിലെ മാനം:",
    using_data_value: "ഡാറ്റ മാനം ഉപയോഗിക്കുന്നു:",
    save_changes: "മാറ്റങ്കളൈ സംരക്ഷിക്കുക",
    cancel: "റദ്ദാക്കുക",
    saving: "സംരക്ഷിക്കുന്നു...",
    account_settings: "അക്കൗണ്ട് ക്രമീകരണങ്ങൾ",
    manage_account_settings: "നിങ്ങളുടെ അക്കൗണ്ട് ക്രമീകരണങ്ങളും മുൻഗണനകളും നിയന്ത്രിക്കുക.",
    change_password: "പാസ്വേഡ് മാറ്റുക",
    deactivate_account: "അക്കൗണ്ട് നിർജ്ജീവമാക്കുക",
    close: "അടയ്ക്കുക",
    get_assistance: "സഹായവും പിന്തുണയും നേടുക.",
    customer_support: "ഉപഭോക്തൃ പിന്തുണ",
    need_immediate_assistance: "ഉടനടി സഹായം ആവശ്യമുണ്ടോ? നിങ്ങളെ സഹായിക്കാൻ ഞങ്ങളുടെ ടീം 24/7 ലഭ്യമാണ്.",
    helpline: "ഹെല്പ്പ്‌ലൈൻ:",
    manage_notifications: "നീങ്ങൾക്ക് എങ്ങനെ അറിയിപ്പുകൾ ലഭിക്കുന്നുവെന്ന് നിയന്ത്രിക്കുക.",
    email_notifications: "ഇമെയിലിലൂടെ അറിയിപ്പുകൾ",
    receive_updates_email: "ഇമെയിലിലൂടെ അപ്ഡേറ്റുകളും അലർട്ടുകളും സ്വീകരിക്കുക",
    sms_notifications: "എസ്‌എംഎസ് അറിയിപ്പുകൾ",
    receive_updates_sms: "എസ്‌എംഎസിലൂടെ അപ്ഡേറ്റുകളും അലർട്ടുകളും സ്വീകരിക്കുക",
    choose_language: "നിങ്ങളുടെ ആഗ്രഹിക്കുന്ന ഭാഷ തിരഞ്ഞെടുക്കുക.",
    more_languages_coming_soon: "കൂടുതൽ ഭാഷകളും ക്രമീകരണങ്ങളും ഉടൻ വരുന്നു.",
    trips: "യാത്രകൾ",
    details: "വിശദാംശങ്ങൾ",
    preferences: "മുൻഗണനകൾ",
    not_added: "ചേർത്തിട്ടില്ല",
    license_number: "ലൈസൻസ് നമ്പർ",
    aadhar_number: "ആധാർ നമ്പർ",
    email_label: "ഇമെയിൽ:",
    account_settings_placeholder: "അക്കൗണ്ട് ക്രമീകരണ ഓപ്ഷനുകൾ ഇവിടെ ദൃശ്യമാകും.",
    preferences_placeholder: "മുൻഗണനകൾ ഉള്ളടക്കം ഇവിടെ പോകുന്നു.",
    profile_status_label: "പ്രൊഫൈൽ നില",
    percent_complete: "{percentage}% പൂർത്തിയായി",
    add_your_item: "നിങ്ങളുടെ {item} ചേർക്കുക",
    years_label: "വർഷം",
    select_experience_placeholder: "പരിചയമുള്ള വർഷങ്ങൾ തിരഞ്ഞെടുക്കുക",
    select_vehicle_types_placeholder: "വാഹന തരങ്ങൾ തിരഞ്ഞെടുക്കുക",
    selected_vehicle_types: "തിരഞ്ഞെടുത്തത്: {count} വാഹന തരം(കൾ)",
    get_assistance_and_support: "സഹായവും പിന്തുണയും നേടുക.",
    contact_support: "പിന്തുണയുമായി ബന്ധപ്പെടുക",
    customer_support_heading: "ഉപഭോക്തൃ പിന്തുണ",
    immediate_assistance_text: "ഉടനടി സഹായം ആവശ്യമുണ്ടോ? നിങ്ങളെ സഹായിക്കാൻ ഞങ്ങളുടെ ടീം 24/7 ലഭ്യമാണ്.",
    helpline_label: "ഹെല്പ്പ്‌ലൈൻ:",
    close_button: "അടയ്ക്കുക",
    manage_notifications_description: "നിങ്ങൾക്ക് എങ്ങനെ അറിയിപ്പുകൾ ലഭിക്കുന്നുവെന്ന് നിയന്ത്രിക്കുക.",
    email_notifications_label: "ഇമെയിലിലൂടെ അറിയിപ്പുകൾ",
    receive_updates_email_text: "ഇമെയിലിലൂടെ അപ്ഡേറ്റുകളും അലർട്ടുകളും സ്വീകരിക്കുക",
    sms_notifications_label: "എസ്‌എംഎസ് അറിയിപ്പുകൾ",
    receive_updates_sms_text: "എസ്‌എംഎസിലൂടെ അപ്ഡേറ്റുകളും അലർട്ടുകളും സ്വീകരിക്കുക",
    save_changes_button: "മാറ്റങ്ങൾ സംരക്ഷിക്കുക",
    cancel_button: "റദ്ദാക്കുക",
    choose_language_description: "നിങ്ങളുടെ ആഗ്രഹിക്കുന്ന ഭാഷ തിരഞ്ഞെടുക്കുക.",
    english_language_option: "ഇംഗ്ലീഷ്",
    hindi_language_option: "ഹിന്ദി",
    profile_picture: "പ്രൊഫൈൽ ചിത്രം",
    contact_support_hint: "ഫോൺ നമ്പർ അപ്ഡേറ്റ് ചെയ്യാൻ ആശയവിനിമയ പിന്തുണ ബന്ധപ്പെടുക.",
    aadhar_card: "ആധാർ കാർഡ്",
    year: "വർഷം",
    search_placeholder: "ജോലികൾ, കമ്പനികൾ, സ്ഥലങ്ങൾ തിരയുക...",
    filter_jobs: "ജോലികൾ ഫിൽട്ടർ ചെയ്യുക",
    job_type: "ജോലിയുടെ തരം",
    salary_range: "ശമ്പള പരിധി",
    other_options: "മറ്റ് ഓപ്ഷനുകൾ",
    show_new_jobs: "പുതിയ ജോലികൾ മാത്രം കാണിക്കുക",
    hide_applied_jobs: "ഞാൻ അപേക്ഷിച്ച ജോലികൾ മറയ്ക്കുക",
    active_filters: "പ്രവർത്തന ഫിൽട്ടറുകൾ",
    clear_all: "എല്ലാം നീക്കം ചെയ്യുക",
    all_jobs: "എല്ലാ ജോലികളും",
    saved: "സേവ് ചെയ്തു",
    applied: "അപേക്ഷിച്ചു",
    loading_jobs: "ജോലികൾ ലോഡ് ചെയ്യുന്നു...",
    loading_jobs_message: "ദയവായി കാത്തിരിക്കുക, ജോലി വിവരങ്ങൾ കൊണ്ടുവരുന്നു.",
    error_fetching_jobs: "ജോലികൾ കൊണ്ടുവരുന്നതിൽ പിശക്",
    error_fetching_jobs_message: "ജോലികൾ ലോഡ് ചെയ്യാൻ കഴിഞ്ഞില്ല. പിന്നീട് ശ്രമിക്കുക.",
    no_jobs_found: "ജോലികൾ കണ്ടെത്തിയില്ല",
    no_jobs_found_message: "തിരഞ്ഞെടുത്ത ക്രൈറ്റീരിയയിൽ ജോലികൾ കണ്ടെത്തിയില്ല. തിരയൽ/ഫിൽട്ടറുകൾ മാറ്റി നോക്കൂ.",
    openings: "തൊഴിൽ അവസരങ്ങൾ",
    save_job: "ജോലി സേവ് ചെയ്യുക",
    remove: "നീക്കം ചെയ്യുക",
    apply_now: "ഇപ്പോൾ അപേക്ഷിക്കുക",
    applying: "അപേക്ഷിക്കുന്നു...",
    no_saved_jobs: "സേവ് ചെയ്ത ജോലികൾ ഇല്ല",
    no_saved_jobs_message: "നിങ്ങൾ സേവ് ചെയ്ത ജോലികൾ ഇവിടെ കാണാം. ജോലികൾ തിരഞ്ഞ് സേവ് ചെയ്യുക.",
    loading_applications: "അപേക്ഷകൾ ലോഡ് ചെയ്യുന്നു...",
    no_applications: "അപേക്ഷകളൊന്നുമില്ല",
    no_applications_message: "അപേക്ഷ നൽകിയ ജോലികളുടെ നില ഇവിടെ കാണാം.",
    applied_on: "അപേക്ഷിച്ച തീയതി",
    status: "സ്ഥിതി",
    load_more: "കൂടുതൽ ലോഡ് ചെയ്യുക",
    job_location_label: "ജോലി സ്ഥലം",
    job_salary_label: "ശമ്പളം",
    job_type_label: "ജോലി തരം",
    job_distance_label: "ദൂരം",
    job_openings_label: "ഒഴിവുകൾ",
    full_time: "പൂർണ്ണകാല",
    part_time: "പകുതി സമയം",
    job_distance_placeholder: "വിവരണത്തിൽ വിശദാംശങ്ങൾ",
    error_details: "വിശദാംശങ്ങൾ",
    description: "വിവരണം"
  },
  ta: {
    welcome: "SIGNO Connect-க்கு வரவேற்கிறோம்",
    welcome_subtitle: "டிரைவர்கள் மற்றும் ட்ரான்ஸ்போர்ட்டர்களை இணைக்கும் லாஜிஸ்டிக்ஸ் சந்தை",
    driver: "டிரைவர்",
    transporter: "வாகன உரிமையாளர்/ட்ரான்ஸ்போர்ட்டர்",
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
    otp_sent: "நாங்கள் 6 அக்க OTP அனுப்பியுள்ளோம்",
    enter_otp: "OTP ஐ உள்ளிடவும்",
    didnt_receive_otp: "OTP பெறவில்லையா?",
    resend: "மீண்டும் அனுப்பு",
    verify: "சரிபார்ப்பு",
    upload_docs_optional: "சரிபார்ப்புக்காக உங்கள் ஆவணங்களை பதிவேற்றவும் (அடிஸ്஥ாந ஸாஇன-அப்பிந் ஓப்ஷணல்)",
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
    manage_your_trips: "உங்கள் பயணங்களை நிர்வகிக்கவும்",
    recommended_jobs: "அநுபவம் செய்த வேலைகள்",
    view_all_jobs: "அனைத்து வேலைகளையும் காண்க",
    nearby_facilities: "அருகிலுள்ள வசதிகள்",
    fuel_stations: "எரிபொருள் நிலையங்கள்",
    rest_areas: "ஆரம்பக்குள்ள பகுதிகள்",
    service_centers: "ஸ்வசிய மையங்கள்",
    hospitals: "மருத்துவமனைகள்",
    nearby: "அருகில்",
    post_job: "வேலை பதிவிடுக",
    find_drivers: "டிரைவர்களைக் கண்டறியவும்",
    search: "தேடல்",
    manage_jobs: "வேலைகளை நிர்வகிக்கவும்",
    manage: "நிர்வகிக்க",
    recommended_drivers: "அநுபவம் செய்த டிரைவர்கள்",
    view_all_drivers: "அனைத்து டிரைவர்களையும் காண்க",
    years_experience: "ஆண்டுகள் அனுபவம்",
    sign_out: "வெளியேறு",
    home: "முகப்பு",
    jobs: "வேலைகள்",
    alerts: "எச்சரிக்கைகள்",
    profile: "சுயவிவரம்",
    drivers: "டிரைவர்கள்",
    support_chat: "ஆதரவு அரட்டை",
    how_can_i_help: "வணக்கம்! SIGNO Connect பற்றி உங்களுக்கு எவ்வாறு உதவ முடியும்?",
    type_message: "உங்கள் செய்தியை தட்டச்சு செய்யவும்...",
    complete_profile_hint: "சிறந்த வேலை பரிந்துரைகளைப் பெற உங்கள் சுயவிவரத்தை முடிக்கவும்",
    recently: "சமீபத்தில்",
    just_now: "இப்போது",
    one_day_ago: "1 நாள் முன்பு",
    days_ago: "{count} நாட்களுக்கு முன்பு",
    enter_full_name: "உங்கள் முழு பெயரை உள்ளிடவும்",
    contact_information: "தொடர்பு தகவல்",
    work_details: "வேலை விவரங்கள்",
    preferred_vehicle_types: "விருப்பமான வாகன வகைகள்",
    date_of_birth: "பிறந்த தேதி",
    emergency_contact: "அவசர தொடர்பு",
    phone_number: "தொலைபேசி எண்",
    address: "முகவரி",
    experience: "அனுபவம்",
    profile_completion: "சுயவிவர முடிவு",
    profile_status: "சுயவிவர நிலை",
    complete: "முடிந்தது",
    add_your: "உங்கள் சேர்க்குக",
    profile_complete: "சுயவிவரம் முடிந்தது",
    account: "கணக்கு",
    help_and_support: "உதவி மற்றும் ஆதரவு",
    notification_settings: "அறிவிப்பு அமைப்புகள்",
    language_settings: "மொழி அமைப்புகள்",
    logout: "வெளியேறு",
    account_information: "கணக்கு தகவல்",
    account_type: "கணக்கு வகை",
    edit_profile: "சுயவிவரத்தைத் திருத்து",
    update_profile_info: "உங்கள் சுயவிவர தகவலைப் புதுப்பிக்கவும். அனைத்து விவரங்களும் துல்லியமானவை என்பதை உறுதிசெய்யவும்.",
    personal_information: "தனிப்பட்ட தகவல்",
    professional_information: "தொழில்முறை தகவல்",
    front_side: "முன் பக்கம்",
    back_side: "பின் பக்கம்",
    uploaded: "பதிவேற்றப்பட்டது",
    view_current: "தற்போதையதைக் காண்க",
    new_file_selected: "புதிய கோப்பு தேர்ந்தெடுக்கப்பட்டது:",
    current_value: "தற்போதைய மதிப்பு:",
    using_data_value: "தரவு மதிப்பைப் பயன்படுத்துகிறது:",
    save_changes: "மாற்றங்களை சேமி",
    cancel: "ரத்து செய்",
    saving: "சேமிக்கிறது...",
    account_settings: "கணக்கு அமைப்புகள்",
    manage_account_settings: "உங்கள் கணக்கு அமைப்புகள் மற்றும் விருப்பங்களை நிர்வகிக்கவும்.",
    change_password: "கடவுச்சொல்லை மாற்று",
    deactivate_account: "கணக்கை செயலிழக்கச் செய்",
    close: "மூடு",
    get_assistance: "உதவி மற்றும் ஆதரவைப் பெறுங்கள்.",
    customer_support: "வாடிக்கையாளர் ஆதரவு",
    need_immediate_assistance: "உடனடி உதவி தேவையா? உங்களுக்கு உதவ எங்கள் குழு 24/7 கிடைக்கிறது.",
    helpline: "உதவி எண்:",
    manage_notifications: "நீங்கள் எவ்வாறு அறிவிப்புகளைப் பெறுகிறீர்கள் என்பதை நிர்வகிக்கவும்.",
    email_notifications: "மின்னஞ்சல் அறிவிப்புகள்",
    receive_updates_email: "மின்னஞ்சல் மூலம் புதுப்பிப்புகள் மற்றும் எச்சரிக்கைகளைப் பெறுங்கள்",
    sms_notifications: "எஸ்எம்எஸ் அறிவிப்புகள்",
    receive_updates_sms: "எஸ்எம்எஸ் மூலம் அப்பிப்புகள் மற்றும் எச்சரிக்கைகளைப் பெறுங்கள்",
    choose_language: "உங்கள் விருப்பமான மொழியைத் தேர்வு செய்யவும்.",
    more_languages_coming_soon: "மேலும் மொழிகள் மற்றும் அமைப்புகள் விரைவில் வருகின்றன.",
    trips: "பயணங்கள்",
    details: "விவரங்கள்",
    preferences: "விருப்பங்கள்",
    not_added: "சேர்க்கப்படவில்லை",
    license_number: "உரிமம் எண்",
    aadhar_number: "ஆதார் எண்",
    email_label: "மின்னஞ்சல்:",
    account_settings_placeholder: "கணக்கு அமைப்பு விருப்பங்கள் இங்கே தோன்றும்.",
    preferences_placeholder: "விருப்பங்கள் உள்ளடக்கம் இங்கே செல்கிறது.",
    profile_status_label: "சுயவிவர நிலை",
    percent_complete: "{percentage}% நிறைந்தது",
    add_your_item: "உங்கள் {item} சேர்க்கவும்",
    years_label: "ஆண்டுகள்",
    select_experience_placeholder: "அனுபவ ஆண்டுகளைத் தேர்ந்தெடுக்கவும்",
    select_vehicle_types_placeholder: "வாகன வகைகளைத் தேர்ந்தெடுக்கவும்",
    selected_vehicle_types: "தேர்ந்தெடுக்கப்பட்டது: {count} வாகன வகை(கள்)",
    get_assistance_and_support: "உதவி மற்றும் ஆதரவைப் பெறுங்கள்.",
    contact_support: "ஆதரவை தொடர்புகொள்ளவும்",
    customer_support_heading: "வாடிக்கையாளர் ஆதரவு",
    immediate_assistance_text: "உடனடி உதவி தேவையா? உங்களுக்கு உதவ எங்கள் குழு 24/7 கிடைக்கிறது.",
    helpline_label: "உதவி எண்:",
    close_button: "மூடு",
    manage_notifications_description: "நீங்கள் எவ்வாறு அறிவிப்புகளைப் பெறுகிறீர்கள் என்பதை நிர்வகிக்கவும்.",
    email_notifications_label: "மின்னஞ்சல் அறிவிப்புகள்",
    receive_updates_email_text: "மின்னஞ்சல் மூலம் புதுப்பிப்புகள் மற்றும் எச்சரிக்கைகளைப் பெறுங்கள்",
    sms_notifications_label: "எஸ்எம்எஸ் அறிவிப்புகள்",
    receive_updates_sms_text: "எஸ்எம்எஸ் மூலம் அப்பிப்புகள் மற்றும் எச்சரிக்கைகளைப் பெறுங்கள்",
    save_changes_button: "மாற்றங்களை சேமி",
    cancel_button: "ரத்து செய்",
    choose_language_description: "உங்கள் விருப்பமான மொழியைத் தேர்வு செய்யவும்.",
    english_language_option: "ஆங்கிலம்",
    hindi_language_option: "ஹிந்தி",
    profile_picture: "சுயவிவர படம்",
    contact_support_hint: "தொலைபேசி எண்ணை புதுப்பிக்க ஆதரவைத் தொடர்புகொள்ளவும்.",
    aadhar_card: "ஆதார் அட்டை",
    year: "ஆண்டு",
    search_placeholder: "வேலைகள், நிறுவனங்கள், இடங்களை தேடுங்கள்...",
    filter_jobs: "வேலைகளை வடிகட்டுங்கள்",
    job_type: "வேலை வகை",
    salary_range: "சம்பள வரம்பு",
    other_options: "பிற விருப்பங்கள்",
    show_new_jobs: "புதிய வேலைகளை மட்டும் காண்பி",
    hide_applied_jobs: "நான் விண்ணப்பித்த வேலைகளை மறை",
    active_filters: "செயலில் உள்ள வடிகட்டிகள்",
    clear_all: "அனைத்தையும் அழிக்கவும்",
    all_jobs: "அனைத்து வேலைகளும்",
    saved: "சேமிக்கப்பட்டவை",
    applied: "விண்ணப்பிக்கப்பட்டவை",
    loading_jobs: "வேலைகள் ஏற்றப்படுகிறது...",
    loading_jobs_message: "தயவுசெய்து காத்திருங்கள், வேலைகள் பெறப்படுகிறது.",
    error_fetching_jobs: "வேலைகளை பெறுவதில் பிழை",
    error_fetching_jobs_message: "வேலைகளை ஏற்ற முடியவில்லை. தயவுசெய்து பின்னர் முயற்சிக்கவும்.",
    no_jobs_found: "வேலை எதுவும் கிடைக்கவில்லை",
    no_jobs_found_message: "உங்கள் தேடல் விதிமுறைகளை பொருந்தும் வேலை எதுவும் இல்லை. மாற்றி முயற்சிக்கவும்.",
    openings: "வேலை வாய்ப்புகள்",
    save_job: "வேலையை சேமி",
    remove: "அகற்று",
    apply_now: "இப்போது விண்ணப்பிக்கவும்",
    applying: "விண்ணப்பிக்கிறது...",
    no_saved_jobs: "சேமிக்கப்பட்ட வேலைகள் இல்லை",
    no_saved_jobs_message: "நீங்கள் சேமிக்கும் வேலைகள் எளிதாக அணுக இங்கே தோன்றும். விருப்பமான வேலைகளை சேமிக்கத் தொடங்குங்கள்.",
    loading_applications: "விண்ணப்பங்கள் ஏற்றப்படுகிறது...",
    no_applications: "விண்ணப்பங்கள் இல்லை",
    no_applications_message: "உங்கள் விண்ணப்ப நிலையை இங்கே கண்காணிக்க வேலைகளுக்கு விண்ணப்பிக்கத் தொடங்குங்கள்.",
    applied_on: "விண்ணப்பித்த தேதி",
    status: "நிலை",
    load_more: "மேலும் ஏற்று",
    job_location_label: "வேலை இடம்",
    job_salary_label: "சம்பளம்",
    job_type_label: "வேலை வகை",
    job_distance_label: "தூரம்",
    job_openings_label: "வாய்ப்புகள்",
    full_time: "முழுநேரம்",
    part_time: "பகுதிநேரம்",
    job_distance_placeholder: "விளக்கத்தில் விவரங்கள்",
    error_details: "விவரங்கள்",
    description: "விளக்கம்"
  }
};

// Update the LanguageState interface to support interpolation
interface LanguageState {
  currentLanguage: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

// Update the store implementation
export const useLanguageStore = create<LanguageState>((set, get) => ({
  currentLanguage: "en",
  setLanguage: (language) => set({ currentLanguage: language }),
  t: (key, params) => {
    const { currentLanguage } = get();
    let translation = translations[currentLanguage][key] || translations.en[key] || key;
    
    // Handle interpolation
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, String(value));
      });
    }
    
    return translation;
  }
}));