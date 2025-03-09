/**
 * SKUs Management Page Component
 * 
 * This component provides a complete interface for managing SKU (Stock Keeping Unit) data including:
 * - Viewing a paginated list of SKUs
 * - Adding new SKUs via a drawer form
 * - Deleting existing SKUs
 * - Searching SKUs by name
 * - Pagination controls
 */

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button";
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {  iSKUFormData, iSKU} from '@/lib/utils';


const SKUs = () => {
    // State management for SKU data and UI controls
    const [allSKUs, setAllSKUs] = useState<iSKU[]>([]); // Stores all SKU data from API
    const [loading, setLoading] = useState(true); // Tracks loading state for API calls
    const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
    const [searchQuery, setSearchQuery] = useState(''); // Stores search input for filtering
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Controls add SKU drawer visibility
    const itemsPerPage = 10; // Number of SKUs to display per page

    // Form handling with react-hook-form
    const { register, handleSubmit, reset, formState: { errors } } = useForm<iSKUFormData>();

    // Calculate total pages based on all SKUs for pagination
    const totalPages = Math.ceil(allSKUs.length / itemsPerPage);

    // Load SKUs data on component mount
    useEffect(() => {
        fetchSKU();
    }, []);

    /**
     * Fetches all SKUs from the API
     * Sets loading state during API call and updates SKU data on success
     */
    const fetchSKU = async () => {
        try {
            setLoading(true);
            const { data } = await axios.get(`http://localhost:4000/skus`);
            setAllSKUs(data.skus || data);
        } catch {
            console.error('Error fetching SKU:', errors);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Creates a new SKU by sending data to the API
     * @param skuData - The SKU data to be created
     * @returns The response data from the API
     */
    const createSKU = async (skuData: iSKUFormData) => {
        try {
            const response = await axios.post('http://localhost:4000/skus', skuData);
            toast.success('SKU added successfully');
            return response.data;
        } catch (error) {
            console.error('Error adding SKU:', error);
            throw new Error('Failed to add SKU');
        }
    };

    /**
     * Handles form submission for creating a new SKU
     * Formats numeric values and calls createSKU with form data
     * Refreshes the SKU list on success
     * @param data - The form data from react-hook-form
     */
    const onSubmit = async (data: iSKUFormData) => {
        try {
            const formattedData = {
                ...data,
                price: parseFloat(data.price as unknown as string), // Ensures price is a float
                cost: parseFloat(data.cost as unknown as string)   // Ensures cost is a float
            };

            await createSKU(formattedData);
            setIsDrawerOpen(false);
            reset();
            fetchSKU();
        } catch (error) {
            toast.error('Failed to add SKU');
        }
    };

    /**
     * Deletes a SKU by ID
     * Refreshes the SKU list after successful deletion
     * @param id - The ID of the SKU to delete
     */
    const handleDelete = async (id: string) => {
        try {
            await axios.delete(`http://localhost:4000/skus/${id}`);
            // Refresh the SKUs list after deletion
            fetchSKU();
            toast.success('SKU deleted successfully');
        } catch (error) {
            console.error('Error deleting SKU:', error);
            toast.error('Failed to delete SKU');
        }
    };

    /**
     * Filters and paginates SKU data for the current page
     * Applies search filter to SKU names
     * @returns Array of SKUs for the current page
     */
    const getCurrentPageData = () => {
        const filteredStores = allSKUs.filter(store =>
            store.label.toLowerCase().includes(searchQuery.toLowerCase())
        );
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredStores.slice(startIndex, startIndex + itemsPerPage);
    };

    /**
     * Updates the current page for pagination
     * @param page - The page number to navigate to
     */
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Show loading indicator while fetching data
    if (loading) {
        return <div>Loading SKUs...</div>;
    }

    // Get current page data for rendering
    const currentSKUs = getCurrentPageData();

    return (
        <div className="space-y-3">
            {/* Page title */}
            <h2 className="text-2xl font-bold">SKUs</h2>
            
            {/* Search and Add SKU controls */}
            <div className="flex justify-between items-center mb-4">
                {/* Search input */}
                <input
                    type="text"
                    placeholder="Search SKUs..."
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-2"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {/* Add SKU Drawer */}
                <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <DrawerTrigger asChild>
                        <Button className='cursor-pointer'>Add New SKU</Button>
                    </DrawerTrigger>
                    <DrawerContent >
                        <form onSubmit={handleSubmit(onSubmit)} className='overflow-auto'>
                            <DrawerHeader>
                                <DrawerTitle>Add New SKU</DrawerTitle>
                                <DrawerDescription>
                                    Fill in the details to add a new SKU.
                                </DrawerDescription>
                            </DrawerHeader>
                            
                            {/* Dynamic form fields for SKU data */}
                            <div className="p-4 space-y-4">
                                {['id', 'label', 'class', 'department', 'price', 'cost'].map((field) => (
                                    <div className="space-y-2" key={field}>
                                        <Label htmlFor={field}>{field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                                        <Input
                                            id={field}
                                            type={field === 'price' || field === 'cost' ? 'number' : 'text'}
                                            {...register(field as keyof iSKUFormData, { required: `${field} is required` })}
                                            placeholder={`Enter ${field}`}
                                        />
                                        {errors[field as keyof iSKUFormData] && (
                                            <p className="text-sm text-red-500">{errors[field as keyof iSKUFormData]?.message}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <DrawerFooter>
                                <Button type="submit" className='cursor-pointer'>Add SKU</Button>
                                <DrawerClose asChild>
                                    <Button variant="outline" type="button" className='cursor-pointer'>Cancel</Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </form>
                    </DrawerContent>
                </Drawer>
            </div>
            
            {/* SKUs Table */}
            <Table>
                <TableCaption>List of Available SKUs</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>SKU ID</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentSKUs.map((sku, index) => (
                        <TableRow key={sku.id}>
                            <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                            <TableCell className="font-medium">{sku.id}</TableCell>
                            <TableCell>{sku.label}</TableCell>
                            <TableCell>{sku.class}</TableCell>
                            <TableCell>{sku.department}</TableCell>
                            <TableCell>{sku.price}</TableCell>
                            <TableCell>{sku.cost}</TableCell>
                            <TableCell>
                                <Button className='cursor-pointer' onClick={() => handleDelete(sku.id)}>
                                    <X />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-end space-x-2">
                <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className='cursor-pointer'
                >
                    Previous
                </Button>
                {[...Array(totalPages)].map((_, index) => (
                    <Button
                        key={index + 1}
                        variant={currentPage === index + 1 ? "default" : "outline"}
                        onClick={() => handlePageChange(index + 1)}
                        className='cursor-pointer'
                    >
                        {index + 1}
                    </Button>
                ))}
                <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default SKUs;