export interface Trip {
    name?: string; // Unique trip id from backend (e.g., "TR-00003")
    naming_series: string; // e.g., "TR-#####"
    vehicle: string; // Link to Vehicles
    vehicle_type: string; // Link to Vehicle Type
    driver: string; // Link to Drivers
    driver_name: string; // Driver's name
    driver_phone_number: string; // Driver's phone number
    origin: string; // Origin location
    destination: string; // Destination location
    trip_cost: number; // Total trip cost
    pending_amount: number; // Pending payment amount
    paid_amount: number; // Paid amount
    handover_checklist: string; // Link to Vehicle Checklist Table
    status: "upcoming" | "waiting" | "completed" | "in-progress" | "cancelled"; // Trip status
    created_on: string; // Datetime when the trip was created
    started_on: string; // Datetime when the trip started
    ended_on: string; // Datetime when the trip ended
    eta: string; // Estimated time of arrival
    eta_str: string; // ETA as a string
    transporter: string; // Link to Transporters
    transporter_name: string; // Transporter's name
    transporter_phone?: string; // Transporter's phone number
    company_name?: string; // Transporter company name
    odo_start: string; // Odometer reading at the start
    odo_start_pic: string; // Image of odometer at the start
    odo_end: string; // Odometer reading at the end
    odo_end_pic: string; // Image of odometer at the end
    trip_pic: string; // Image related to the trip
    documents: string; // Link to Documents Table
    share_text: string; // Text for sharing trip details
    started_by: "Driver" | "Transporter"; // Who started the trip
    is_active: boolean; // Whether the trip is active
  }