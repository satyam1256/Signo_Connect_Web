export interface Trip {
    id: number;
    namingSeriesId?: number; // naming_series (Select)
    namingSeries?: string; // TR-#####
    vehicleId?: number; // vehicle (Link to Vehicles)
    vehicleTypeId?: number; // vehicle_type (Link to Vehicle Types)
    driverId: number; // driver (Link to Drivers)
    driverName?: string; // driver_name (Data)
    driverPhoneNumber?: string; // driver_phone_number (Data)
    origin: string; // origin (Data)
    destination: string; // destination (Data)
    tripCost?: number; // trip_cost (Float)
    pendingAmount?: number; // pending_amount (Float)
    paidAmount?: number; // paid_amount (Float)
    handoverChecklist?: any; // handover_checklist (Table)
    status: string; // 'upcoming' | 'waiting' | 'completed' | 'in-progress' | 'cancelled'
    createdOn?: string; // created_on (Datetime)
    startedOn?: string; // started_on (Datetime)
    endedOn?: string; // ended_on (Datetime)
    eta?: string; // eta (Datetime)
    etaStr?: string; // eta_str (Data)
    transporterId?: number; // transporter (Link to Transporters)
    transporterName?: string; // transporter_name (Data)
    odoStart?: string; // odo_start (Data)
    odoStartPic?: string; // odo_start_pic (Attach Image)
    odoEnd?: string; // odo_end (Data)
    odoEndPic?: string; // odo_end_pic (Attach Image)
    tripPic?: string; // trip_pic (Attach Image)
    documents?: any; // documents (Table)
    shareText?: string; // share_text (Small Text)
    startedBy?: string; // started_by (Select: Driver/Transporter)
    isActive?: boolean; // is_active (Check)
    
    // Additional fields to maintain backward compatibility
    startDate?: string; // alias for startedOn
    endDate?: string; // alias for endedOn
    distance?: number; // in kilometers (calculated or derived)
    duration?: number; // in hours (calculated or derived)
    vehicleType?: string; // from vehicleTypeId
    earnings?: number; // alias for tripCost
    rating?: number | null; // optional rating out of 5
    createdAt?: string; // alias for createdOn
    updatedAt?: string;
  }