import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, PlusCircle, Trash2, Pencil, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define the Driver type based on the API response
interface FrappeDriver {
  id: number;
  docName: string;
  name1: string | null;
  phoneNumber: string | null;
  email: string | null;
  category: string | null;
  isActive: boolean;
  emergencyContactNumber: string | null;
  address: string | null;
  experience: string | null;
  remarks: string | null;
  isBankVerified: boolean;
  isKycVerified: boolean;
  isDlVerified: boolean;
  isAadharVerified: boolean;
  creation: string;
  modified: string;
}

// Validation schema for creating a new driver
const createDriverSchema = z.object({
  name1: z.string().min(1, "Name is required"),
  phoneNumber: z.string().min(10, "Valid phone number is required"),
  email: z.string().email().optional().or(z.literal("")),
  category: z.string().min(1, "Category is required"),
  isActive: z.boolean().default(true),
  emergencyContactNumber: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  experience: z.string().optional().or(z.literal("")),
  remarks: z.string().optional().or(z.literal(""))
});

// Validation schema for updating a driver
const updateDriverSchema = createDriverSchema.partial();

// Filters for the driver listing
interface DriverFilters {
  isActive?: boolean;
  category?: string;
}

function AdminFrappeDrivers() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<FrappeDriver | null>(null);
  const [apiKey, setApiKey] = useState<string>("signo_admin");
  const [filters, setFilters] = useState<DriverFilters>({});
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);

  const createForm = useForm<z.infer<typeof createDriverSchema>>({
    resolver: zodResolver(createDriverSchema),
    defaultValues: {
      name1: "",
      phoneNumber: "",
      email: "",
      category: "Professional Driver",
      isActive: true,
      emergencyContactNumber: "",
      address: "",
      experience: "",
      remarks: ""
    }
  });

  const editForm = useForm<z.infer<typeof updateDriverSchema>>({
    resolver: zodResolver(updateDriverSchema),
    defaultValues: {
      name1: "",
      phoneNumber: "",
      email: "",
      category: "",
      isActive: true,
      emergencyContactNumber: "",
      address: "",
      experience: "",
      remarks: ""
    }
  });

  // Query to fetch drivers with pagination and filters
  const { data: driversData, isLoading: isLoadingDrivers, error: driversError } = useQuery({
    queryKey: ['/api/frappe-drivers', filters, page, limit],
    queryFn: async () => {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      
      if (filters.isActive !== undefined) {
        queryParams.append('isActive', String(filters.isActive));
      }
      
      if (filters.category) {
        queryParams.append('category', filters.category);
      }
      
      // Add pagination
      queryParams.append('offset', String((page - 1) * limit));
      queryParams.append('limit', String(limit));
      
      const queryString = queryParams.toString();
      const url = `/api/frappe-drivers${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        headers: {
          'X-API-Key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch drivers');
      }
      
      return response.json();
    }
  });

  // Mutation to create a new driver
  const createDriverMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createDriverSchema>) => {
      return apiRequest('/api/frappe-drivers', {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frappe-drivers'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Success!",
        description: "Driver created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create driver",
        variant: "destructive",
      });
    }
  });

  // Mutation to update a driver
  const updateDriverMutation = useMutation({
    mutationFn: async ({ docName, data }: { docName: string, data: z.infer<typeof updateDriverSchema> }) => {
      return apiRequest(`/api/frappe-drivers/${docName}`, {
        method: 'PATCH',
        headers: {
          'X-API-Key': apiKey
        },
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frappe-drivers'] });
      setIsEditDialogOpen(false);
      setSelectedDriver(null);
      editForm.reset();
      toast({
        title: "Success!",
        description: "Driver updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update driver",
        variant: "destructive",
      });
    }
  });

  // Mutation to delete a driver
  const deleteDriverMutation = useMutation({
    mutationFn: async (docName: string) => {
      return apiRequest(`/api/frappe-drivers/${docName}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': apiKey
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/frappe-drivers'] });
      setIsDeleteDialogOpen(false);
      setSelectedDriver(null);
      toast({
        title: "Success!",
        description: "Driver deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete driver",
        variant: "destructive",
      });
    }
  });

  const handleCreateSubmit = (data: z.infer<typeof createDriverSchema>) => {
    createDriverMutation.mutate(data);
  };

  const handleEditSubmit = (data: z.infer<typeof updateDriverSchema>) => {
    if (selectedDriver) {
      updateDriverMutation.mutate({ docName: selectedDriver.docName, data });
    }
  };

  const handleEditClick = (driver: FrappeDriver) => {
    setSelectedDriver(driver);
    editForm.reset({
      name1: driver.name1 || "",
      phoneNumber: driver.phoneNumber || "",
      email: driver.email || "",
      category: driver.category || "",
      isActive: driver.isActive,
      emergencyContactNumber: driver.emergencyContactNumber || "",
      address: driver.address || "",
      experience: driver.experience || "",
      remarks: driver.remarks || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (driver: FrappeDriver) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDriver) {
      deleteDriverMutation.mutate(selectedDriver.docName);
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleActiveFilterChange = (value: string) => {
    if (value === "all") {
      const { isActive, ...rest } = filters;
      setFilters(rest);
    } else {
      setFilters({...filters, isActive: value === "active"});
    }
    setPage(1); // Reset to first page when filters change
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Frappe Drivers Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, view, update, and delete drivers in the Frappe backend
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">API Authentication</CardTitle>
          <CardDescription>
            Set your API key for authentication with the Frappe backend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="w-1/2">
              <FormLabel htmlFor="apiKey">API Key</FormLabel>
              <Input
                id="apiKey"
                type="text"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your API key"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default keys: signo_admin, signo_manager, signo_driver
              </p>
            </div>
            <div className="w-1/2">
              <FormLabel>Filters</FormLabel>
              <div className="flex space-x-2 mt-1">
                <Select 
                  onValueChange={handleActiveFilterChange}
                  defaultValue="all"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drivers</SelectItem>
                    <SelectItem value="active">Active Drivers</SelectItem>
                    <SelectItem value="inactive">Inactive Drivers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Driver Records</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add New Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
              <DialogDescription>
                Create a new driver in the Frappe backend
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="name1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter driver name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select driver category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Professional Driver">Professional Driver</SelectItem>
                            <SelectItem value="Fleet Employee">Fleet Employee</SelectItem>
                            <SelectItem value="Owner Driver">Owner Driver</SelectItem>
                            <SelectItem value="Temporary">Temporary</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="emergencyContactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emergency Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter emergency contact" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createForm.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 5 years" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks</FormLabel>
                        <FormControl>
                          <Input placeholder="Any additional notes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Active Driver</FormLabel>
                        <FormDescription>
                          Is this driver currently active?
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDriverMutation.isPending}
                  >
                    {createDriverMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Driver"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {isLoadingDrivers ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading driver data...</span>
            </div>
          ) : driversError ? (
            <div className="text-center py-8 text-destructive">
              <p>Error loading drivers. Please check your API key and try again.</p>
            </div>
          ) : !driversData || !driversData.data || driversData.data.length === 0 ? (
            <div className="text-center py-12 border-dashed border-2 rounded-lg">
              <Users className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No drivers found</h3>
              <p className="text-muted-foreground mt-1">
                Create your first driver by clicking the "Add New Driver" button above.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doc Name</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Modified</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driversData.data.map((driver: FrappeDriver) => (
                      <TableRow key={driver.docName}>
                        <TableCell className="font-mono text-xs">
                          {driver.docName}
                        </TableCell>
                        <TableCell className="font-medium">
                          {driver.name1 || "—"}
                        </TableCell>
                        <TableCell>{driver.phoneNumber || "—"}</TableCell>
                        <TableCell>{driver.category || "—"}</TableCell>
                        <TableCell>
                          {driver.isActive ? (
                            <Badge variant="default" className="bg-green-500">Active</Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(driver.modified).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(driver)}
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(driver)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * limit + 1} to{" "}
                  {Math.min(page * limit, driversData.count || 0)} of{" "}
                  {driversData.count || 0} drivers
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={
                      !driversData.count ||
                      page * limit >= driversData.count
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Driver</DialogTitle>
            <DialogDescription>
              Update the details for {selectedDriver?.name1 || selectedDriver?.docName}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter driver name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select driver category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Professional Driver">Professional Driver</SelectItem>
                          <SelectItem value="Fleet Employee">Fleet Employee</SelectItem>
                          <SelectItem value="Owner Driver">Owner Driver</SelectItem>
                          <SelectItem value="Temporary">Temporary</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="emergencyContactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter emergency contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 5 years" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Input placeholder="Any additional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active Driver</FormLabel>
                      <FormDescription>
                        Is this driver currently active?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateDriverMutation.isPending}
                >
                  {updateDriverMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Driver"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the driver {selectedDriver?.name1 || selectedDriver?.docName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteDriverMutation.isPending}
            >
              {deleteDriverMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Driver"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminFrappeDrivers;