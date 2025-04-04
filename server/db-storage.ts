import { IStorage, storage as memStorage } from "./storage";

/**
 * Mock DbStorage class that simply delegates to the memory storage.
 * This is just a placeholder to make the code compile.
 */
export class DbStorage implements IStorage {
  constructor() {
    console.log("Mock DbStorage constructor called");
  }

  // Delegate all methods to memory storage
  getUser = memStorage.getUser.bind(memStorage);
  getUserByPhone = memStorage.getUserByPhone.bind(memStorage);
  createUser = memStorage.createUser.bind(memStorage);
  updateUser = memStorage.updateUser.bind(memStorage);

  getDriver = memStorage.getDriver.bind(memStorage);
  createDriver = memStorage.createDriver.bind(memStorage);
  updateDriver = memStorage.updateDriver.bind(memStorage);

  getFleetOwner = memStorage.getFleetOwner.bind(memStorage);
  createFleetOwner = memStorage.createFleetOwner.bind(memStorage);
  updateFleetOwner = memStorage.updateFleetOwner.bind(memStorage);

  getJob = memStorage.getJob.bind(memStorage);
  getJobsByFleetOwner = memStorage.getJobsByFleetOwner.bind(memStorage);
  getJobsByLocation = memStorage.getJobsByLocation.bind(memStorage);
  createJob = memStorage.createJob.bind(memStorage);
  updateJob = memStorage.updateJob.bind(memStorage);

  createOtpVerification = memStorage.createOtpVerification.bind(memStorage);
  getOtpVerification = memStorage.getOtpVerification.bind(memStorage);
  verifyOtp = memStorage.verifyOtp.bind(memStorage);

  getNearbyFuelPumps = memStorage.getNearbyFuelPumps.bind(memStorage);
  createFuelPump = memStorage.createFuelPump.bind(memStorage);

  getVehicleByRegistration = memStorage.getVehicleByRegistration.bind(memStorage);
  getVehiclesByTransporter = memStorage.getVehiclesByTransporter.bind(memStorage);
  createVehicle = memStorage.createVehicle.bind(memStorage);
  updateVehicle = memStorage.updateVehicle.bind(memStorage);

  getDriverAssessment = memStorage.getDriverAssessment.bind(memStorage);
  getDriverAssessmentsByDriver = memStorage.getDriverAssessmentsByDriver.bind(memStorage);
  createDriverAssessment = memStorage.createDriverAssessment.bind(memStorage);
  updateDriverAssessment = memStorage.updateDriverAssessment.bind(memStorage);

  getNotifications = memStorage.getNotifications.bind(memStorage);
  createNotification = memStorage.createNotification.bind(memStorage);
  markNotificationAsRead = memStorage.markNotificationAsRead.bind(memStorage);

  getReferralsByReferrer = memStorage.getReferralsByReferrer.bind(memStorage);
  createReferral = memStorage.createReferral.bind(memStorage);
  updateReferral = memStorage.updateReferral.bind(memStorage);

  getTollsAlongRoute = memStorage.getTollsAlongRoute.bind(memStorage);
  createToll = memStorage.createToll.bind(memStorage);
  
  getFrappeDriver = memStorage.getFrappeDriver.bind(memStorage);
  getFrappeDriverByPhone = memStorage.getFrappeDriverByPhone.bind(memStorage);
  getFrappeDrivers = memStorage.getFrappeDrivers.bind(memStorage);
  createFrappeDriver = memStorage.createFrappeDriver.bind(memStorage);
  updateFrappeDriver = memStorage.updateFrappeDriver.bind(memStorage);
  deleteFrappeDriver = memStorage.deleteFrappeDriver.bind(memStorage);
}