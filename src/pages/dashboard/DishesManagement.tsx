import React, { useEffect, useMemo, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit, Plus, UtensilsCrossed, DollarSign, Clock, ArrowUpDown, X, Percent } from "lucide-react";
import { getAllDishes, createDish, updateDish, deleteDish, getAllCategories, applyDishDiscount, removeDishDiscount } from "@/api/api";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Category {
  id: number;
  name: string;
}

interface Dish {
  id: number;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  price: number | string;
  category_id: number;
  image_path?: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_available: boolean;
  preparation_time?: number;
  ingredients?: string;
  ingredients_ar?: string;
  allergens?: string;
  allergens_ar?: string;
  sort_order?: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  discount_percentage?: number;
  discount_start_date?: string;
  discount_end_date?: string;
  is_on_discount?: boolean;
}

interface DishFormData {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price: string;
  category_id: string;
  image_path: string;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  is_available: boolean;
  preparation_time: string;
  ingredients: string;
  ingredients_ar: string;
  allergens: string;
  allergens_ar: string;
  sort_order: string;
}

export default function DishesManagement() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [discountingDish, setDiscountingDish] = useState<Dish | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<string>('');
  const [formData, setFormData] = useState<DishFormData>({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price: '',
    category_id: '',
    image_path: '',
    is_vegetarian: false,
    is_vegan: false,
    is_gluten_free: false,
    is_available: true,
    preparation_time: '',
    ingredients: '',
    ingredients_ar: '',
    allergens: '',
    allergens_ar: '',
    sort_order: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [dietVeg, setDietVeg] = useState(false);
  const [dietVegan, setDietVegan] = useState(false);
  const [dietGF, setDietGF] = useState(false);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [minPrep, setMinPrep] = useState<number | ''>('');
  const [maxPrep, setMaxPrep] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category' | 'availability' | 'preptime'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    fetchDishes();
    fetchCategories();
  }, []);

  const fetchDishes = async () => {
    try {
      setLoading(true);
      const response = await getAllDishes();
      setDishes(response.data.dishes?.data ?? response.data.dishes ?? response.data);
      console.log(response.data.dishes?.data);
    } catch (error) {
      console.error('Error fetching dishes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch dishes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getAllCategories();
      setCategories(response.data.categories || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const buildDishFormData = () => {
    const fd = new FormData();
    fd.append('name', formData.name.trim());
    fd.append('name_ar', formData.name_ar.trim());
    fd.append('price', formData.price);
    fd.append('category_id', formData.category_id);
    if (formData.description) fd.append('description', formData.description);
    if (formData.description_ar) fd.append('description_ar', formData.description_ar);
    if (formData.preparation_time) fd.append('preparation_time', formData.preparation_time);
    if (formData.sort_order) fd.append('sort_order', formData.sort_order);
    if (formData.ingredients) fd.append('ingredients', formData.ingredients);
    if (formData.ingredients_ar) fd.append('ingredients_ar', formData.ingredients_ar);
    if (formData.allergens) fd.append('allergens', formData.allergens);
    if (formData.allergens_ar) fd.append('allergens_ar', formData.allergens_ar);
    fd.append('is_available', String(formData.is_available ? 1 : 0));
    fd.append('is_vegetarian', String(formData.is_vegetarian ? 1 : 0));
    fd.append('is_vegan', String(formData.is_vegan ? 1 : 0));
    fd.append('is_gluten_free', String(formData.is_gluten_free ? 1 : 0));

    if (imageFile) {
      fd.append('image', imageFile);
    }

    return fd;
  };

  const handleCreateDish = async () => {
    try {
      if (!formData.name.trim() || !formData.price || !formData.category_id) {
        toast({
          title: "Validation Error",
          description: "Name, price, and category are required",
          variant: "destructive",
        });
        return;
      }

      const fd = buildDishFormData();
      await createDish(fd);
      toast({ title: "Success", description: "Dish created successfully" });
      setIsCreateDialogOpen(false);
      resetForm();
      fetchDishes();
    } catch (error) {
      console.error('Error creating dish:', error);
      toast({
        title: "Error",
        description: "Failed to create dish",
        variant: "destructive",
      });
    }
  };

  const handleEditDish = async () => {
    try {
      if (!editingDish || !formData.name.trim() || !formData.price || !formData.category_id) {
        toast({
          title: "Validation Error",
          description: "Name, price, and category are required",
          variant: "destructive",
        });
        return;
      }

      const fd = buildDishFormData();
      fd.append('_method', 'PUT');
      await updateDish(editingDish.id, fd);
      toast({ title: "Success", description: "Dish updated successfully" });
      setIsEditDialogOpen(false);
      setEditingDish(null);
      resetForm();
      fetchDishes();
    } catch (error) {
      console.error('Error updating dish:', error);
      toast({
        title: "Error",
        description: "Failed to update dish",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDish = async (dishId: number) => {
    try {
      await deleteDish(dishId);
      toast({ title: "Success", description: "Dish deleted successfully" });
      fetchDishes();
    } catch (error: any) {
      console.error('Error deleting dish:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete dish",
        variant: "destructive",
      });
    }
  };

  const handleApplyDiscount = async () => {
    try {
      if (!discountingDish || !discountPercentage || parseFloat(discountPercentage) <= 0 || parseFloat(discountPercentage) > 100) {
        toast({
          title: "Validation Error",
          description: "Please enter a valid discount percentage between 0.01 and 100",
          variant: "destructive",
        });
        return;
      }

      await applyDishDiscount(discountingDish.id, { discount_percentage: parseFloat(discountPercentage) });
      toast({ title: "Success", description: "Discount applied successfully" });
      setIsDiscountDialogOpen(false);
      setDiscountingDish(null);
      setDiscountPercentage('');
      fetchDishes();
    } catch (error: any) {
      console.error('Error applying discount:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to apply discount",
        variant: "destructive",
      });
    }
  };

  const handleRemoveDiscount = async (dishId: number) => {
    try {
      await removeDishDiscount(dishId);
      toast({ title: "Success", description: "Discount removed successfully" });
      fetchDishes();
    } catch (error: any) {
      console.error('Error removing discount:', error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to remove discount",
        variant: "destructive",
      });
    }
  };

  const openDiscountDialog = (dish: Dish) => {
    setDiscountingDish(dish);
    setDiscountPercentage(dish.discount_percentage?.toString() || '');
    setIsDiscountDialogOpen(true);
  };

  const openEditDialog = (dish: Dish) => {
    setEditingDish(dish);
    setFormData({
      name: dish.name,
      name_ar: dish.name_ar,
      description: dish.description || '',
      description_ar: dish.description_ar || '',
      price: String(typeof dish.price === 'number' ? dish.price : parseFloat(dish.price || '')),
      category_id: dish.category_id.toString(),
      image_path: dish.image_path || '',
      is_vegetarian: dish.is_vegetarian,
      is_vegan: dish.is_vegan,
      is_gluten_free: dish.is_gluten_free,
      is_available: dish.is_available,
      preparation_time: dish.preparation_time?.toString() || '',
      ingredients: dish.ingredients || '',
      ingredients_ar: dish.ingredients_ar || '',
      allergens: dish.allergens || '',
      allergens_ar: dish.allergens_ar || '',
      sort_order: dish.sort_order?.toString() || ''
    });

    setImageFile(null);
    setImagePreview(dish.image_path || null);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      price: '',
      category_id: '',
      image_path: '',
      is_vegetarian: false,
      is_vegan: false,
      is_gluten_free: false,
      is_available: true,
      preparation_time: '',
      ingredients: '',
      ingredients_ar: '',
      allergens: '',
      allergens_ar: '',
      sort_order: ''
    });
    setEditingDish(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const getDishCategoryName = (dish: Dish) => {
    return dish.category?.name || getCategoryName(dish.category_id);
  };

  const formatPrice = (value: number | string) => {
    const num = typeof value === 'number' ? value : parseFloat(value as string);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };

  const truncate = (text?: string, max: number = 60) => {
    if (!text) return '—';
    return text.length > max ? `${text.slice(0, max)}…` : text;
  };

  const displayedDishes = useMemo(() => {
    const priceOf = (p: number | string) => (typeof p === 'number' ? p : parseFloat(p || '0'));
    const withinPrice = (p: number | string) => {
      const n = priceOf(p);
      const minOk = minPrice === '' ? true : n >= Number(minPrice);
      const maxOk = maxPrice === '' ? true : n <= Number(maxPrice);
      return minOk && maxOk;
    };
    const withinPrep = (m?: number) => {
      if (m == null) return (minPrep === '' && maxPrep === '') ? true : false; // if range set, exclude N/A
      const minOk = minPrep === '' ? true : m >= Number(minPrep);
      const maxOk = maxPrep === '' ? true : m <= Number(maxPrep);
      return minOk && maxOk;
    };
    const matchesCategory = (d: Dish) =>
      categoryFilter === 'all' ? true : String(d.category_id) === String(categoryFilter);
    const matchesAvailability = (d: Dish) =>
      availabilityFilter === 'all'
        ? true
        : availabilityFilter === 'available'
          ? d.is_available
          : !d.is_available;
    const matchesDiet = (d: Dish) => {
      if (dietVeg && !d.is_vegetarian) return false;
      if (dietVegan && !d.is_vegan) return false;
      if (dietGF && !d.is_gluten_free) return false;
      return true;
    };
    const matchesSearch = (d: Dish) => {
      if (!debouncedSearch) return true;
      const blob = [
        d.name ?? '',
        d.description ?? '',
        d.ingredients ?? '',
        d.allergens ?? '',
        getDishCategoryName(d) ?? '',
      ].join(' ').toLowerCase();
      return blob.includes(debouncedSearch);
    };

    const filtered = dishes.filter(d =>
      matchesCategory(d) &&
      matchesAvailability(d) &&
      matchesDiet(d) &&
      withinPrice(d.price) &&
      withinPrep(d.preparation_time) &&
      matchesSearch(d)
    );

    const cmp = (a: Dish, b: Dish) => {
      let res = 0;
      if (sortBy === 'name') {
        res = (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'price') {
        res = (priceOf(a.price) - priceOf(b.price));
      } else if (sortBy === 'category') {
        res = getDishCategoryName(a).localeCompare(getDishCategoryName(b));
      } else if (sortBy === 'availability') {
        res = (a.is_available === b.is_available) ? 0 : a.is_available ? -1 : 1;
      } else if (sortBy === 'preptime') {
        const av = a.preparation_time ?? Number.POSITIVE_INFINITY;
        const bv = b.preparation_time ?? Number.POSITIVE_INFINITY;
        res = av - bv;
      }
      return sortDir === 'asc' ? res : -res;
    };

    return filtered.sort(cmp);
  }, [
    dishes,
    categoryFilter,
    availabilityFilter,
    dietVeg,
    dietVegan,
    dietGF,
    minPrice,
    maxPrice,
    minPrep,
    maxPrep,
    debouncedSearch,
    sortBy,
    sortDir,
  ]);
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dishes Management</h1>
          <p className="text-muted-foreground">
            Manage your restaurant's menu items and dishes
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsCreateDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Dish
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Dish</DialogTitle>
              <DialogDescription>
                Add a new dish to your restaurant menu
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Dish Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Grilled Salmon"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-name_ar">Dish Name (Arabic)</Label>
                  <Input
                    id="edit-name_ar"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="مثال: سلمون مشوي"
                    dir="rtl"
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="category_id">Category *</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the dish"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-description_ar">Description (Arabic)</Label>
                <Textarea
                  id="edit-description_ar"
                  value={formData.description_ar}
                  onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  placeholder="وصف مختصر للطبق"
                  rows={3}
                  dir="rtl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preparation_time">Preparation Time (minutes)</Label>
                  <Input
                    id="preparation_time"
                    type="number"
                    min="0"
                    value={formData.preparation_time}
                    onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                    placeholder="e.g., 15"
                  />
                </div>
                <div>
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    placeholder="e.g., 1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea
                  id="ingredients"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                  placeholder="List of ingredients (optional)"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="ingredients_ar">Ingredients (Arabic)</Label>
                <Textarea
                  id="ingredients_ar"
                  value={formData.ingredients_ar}
                  onChange={(e) => setFormData({ ...formData, ingredients_ar: e.target.value })}
                  placeholder="مثال: سلمون، ليمون، أعشاب"
                  rows={3}
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="allergens">Allergens</Label>
                <Input
                  id="allergens"
                  value={formData.allergens}
                  onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                  placeholder="e.g., Nuts, Dairy, Gluten"
                />
              </div>
              <div>
                <Label htmlFor="allergens_ar">Allergens (Arabic)</Label>
                <Textarea
                  id="allergens_ar"
                  value={formData.allergens_ar}
                  onChange={(e) => setFormData({ ...formData, allergens_ar: e.target.value })}
                  placeholder="مثال: سمك، ألبان، مكسرات"
                  rows={2}
                  dir="rtl"
                />
              </div>
              
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                />
                {imagePreview && (
                  <div className="mt-2">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-24 w-24 rounded object-cover border"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                  />
                  <Label htmlFor="is_available">Available for ordering</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_vegetarian"
                    checked={formData.is_vegetarian}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_vegetarian: checked })}
                  />
                  <Label htmlFor="is_vegetarian">Vegetarian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_vegan"
                    checked={formData.is_vegan}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_vegan: checked })}
                  />
                  <Label htmlFor="is_vegan">Vegan</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_gluten_free"
                    checked={formData.is_gluten_free}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_gluten_free: checked })}
                  />
                  <Label htmlFor="is_gluten_free">Gluten Free</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateDish}>
                Create Dish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Filters &amp; Sorting</CardTitle>
          <CardDescription>Filter by category/availability/diet, search & sort results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <Label className="mb-1 block">Category</Label>
              <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block">Availability</Label>
              <Select value={availabilityFilter} onValueChange={(v: any) => setAvailabilityFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="min-price" className="mb-1 block">Min Price</Label>
              <Input
                id="min-price"
                type="number"
                min={0}
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 5"
              />
            </div>

            <div>
              <Label htmlFor="max-price" className="mb-1 block">Max Price</Label>
              <Input
                id="max-price"
                type="number"
                min={0}
                step="0.01"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 25"
              />
            </div>

            <div>
              <Label className="mb-1 block">Sort by</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price">Price</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="availability">Availability</SelectItem>
                  <SelectItem value="preptime">Prep Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
                title="Toggle sort direction"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="flex items-center gap-2">
              <Switch id="diet-veg" checked={dietVeg} onCheckedChange={setDietVeg} />
              <Label htmlFor="diet-veg">Vegetarian</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="diet-vegan" checked={dietVegan} onCheckedChange={setDietVegan} />
              <Label htmlFor="diet-vegan">Vegan</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="diet-gf" checked={dietGF} onCheckedChange={setDietGF} />
              <Label htmlFor="diet-gf">Gluten Free</Label>
            </div>
            <div>
              <Label htmlFor="min-prep" className="mb-1 block">Min Prep (min)</Label>
              <Input
                id="min-prep"
                type="number"
                min={0}
                value={minPrep}
                onChange={(e) => setMinPrep(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <Label htmlFor="max-prep" className="mb-1 block">Max Prep (min)</Label>
              <Input
                id="max-prep"
                type="number"
                min={0}
                value={maxPrep}
                onChange={(e) => setMaxPrep(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end pt-1">
            <div className="md:col-span-3">
              <Label htmlFor="search" className="mb-1 block">Search</Label>
              <Input
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, description, ingredients, allergens, or category..."
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={() => {
                  setCategoryFilter('all');
                  setAvailabilityFilter('all');
                  setDietVeg(false);
                  setDietVegan(false);
                  setDietGF(false);
                  setMinPrice('');
                  setMaxPrice('');
                  setMinPrep('');
                  setMaxPrep('');
                  setSearchTerm('');
                  setSortBy('name');
                  setSortDir('asc');
                }}
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Dishes List
          </CardTitle>
          <CardDescription>
            {displayedDishes.length} of {dishes.length} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dishes.length === 0 ? (
            <div className="text-center py-12">
              <UtensilsCrossed className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No dishes yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first dish to start building your menu
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Dish
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Ingredients</TableHead>
                  <TableHead>Allergens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dietary</TableHead>
                  <TableHead>Prep Time</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedDishes.map((dish) => (
                  <TableRow key={dish.id}>
                    <TableCell>
                      {dish.image_path ? (
                        <img src={dish.image_path} alt={dish.name} className="h-12 w-12 rounded object-cover border" />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted border flex items-center justify-center text-[10px] text-muted-foreground">No image</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dish.name}</div>
                        {dish.description && (
                          <div className="text-sm text-muted-foreground max-w-xs truncate">
                            {dish.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-sm">
                        {getDishCategoryName(dish)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-medium">{formatPrice(dish.price)}</span>
                        {dish.is_on_discount && (
                          <Badge variant="destructive" className="text-xs ml-2">
                            -{dish.discount_percentage}%
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-muted-foreground">{truncate(dish.ingredients, 40)}</span>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <span className="text-sm text-muted-foreground">{truncate(dish.allergens, 40)}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dish.is_available ? "default" : "secondary"}>
                        {dish.is_available ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {dish.is_vegetarian && <Badge variant="outline" className="text-xs">Veg</Badge>}
                        {dish.is_vegan && <Badge variant="outline" className="text-xs">Vegan</Badge>}
                        {dish.is_gluten_free && <Badge variant="outline" className="text-xs">GF</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {dish.preparation_time != null ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">{dish.preparation_time} min</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {dish.is_on_discount ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveDiscount(dish.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Percent className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDiscountDialog(dish)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <Percent className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(dish)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the dish
                                "{dish.name}" and remove it from the menu.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteDish(dish.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Dish</DialogTitle>
            <DialogDescription>
              Update the dish information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-name">Dish Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Grilled Salmon"
                />
              </div>
              <div>
                <Label htmlFor="edit-name_ar">Dish Name (Arabic)</Label>
                <Input
                  id="edit-name_ar"
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder="مثال: سلمون مشوي"
                  dir="rtl"
                />
              </div>
              <div>
                <Label htmlFor="edit-price">Price *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-category_id">Category *</Label>
              <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the dish"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-description_ar">Description (Arabic)</Label>
              <Textarea
                id="edit-description_ar"
                value={formData.description_ar}
                onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                placeholder="وصف مختصر للطبق"
                rows={3}
                dir="rtl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-preparation_time">Preparation Time (minutes)</Label>
                <Input
                  id="edit-preparation_time"
                  type="number"
                  min="0"
                  value={formData.preparation_time}
                  onChange={(e) => setFormData({ ...formData, preparation_time: e.target.value })}
                  placeholder="e.g., 15"
                />
              </div>
              <div>
                <Label htmlFor="edit-sort_order">Sort Order</Label>
                <Input
                  id="edit-sort_order"
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                  placeholder="e.g., 1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit-ingredients">Ingredients</Label>
              <Textarea
                id="edit-ingredients"
                value={formData.ingredients}
                onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                placeholder="List of ingredients (optional)"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-ingredients_ar">Ingredients (Arabic)</Label>
              <Textarea
                id="edit-ingredients_ar"
                value={formData.ingredients_ar}
                onChange={(e) => setFormData({ ...formData, ingredients_ar: e.target.value })}
                rows={3}
                dir="rtl"
              />
            </div>
            <div>
              <Label htmlFor="edit-allergens">Allergens</Label>
              <Input
                id="edit-allergens"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                placeholder="e.g., Nuts, Dairy, Gluten"
              />
            </div>
            <div>
              <Label htmlFor="edit-allergens_ar">Allergens (Arabic)</Label>
              <Textarea
                id="edit-allergens_ar"
                value={formData.allergens_ar}
                onChange={(e) => setFormData({ ...formData, allergens_ar: e.target.value })}
                rows={2}
                dir="rtl"
              />
            </div>

            <div>
              <Label htmlFor="edit-image">Image</Label>
              <Input
                id="edit-image"
                type="file"
                accept="image/*"
                onChange={onFileChange}
              />
              {(imagePreview || formData.image_path) && (
                <div className="mt-2">
                  <img
                    src={imagePreview || formData.image_path}
                    alt="Preview"
                    className="h-24 w-24 rounded object-cover border"
                  />
                </div>
              )}
              
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_available: checked })}
                />
                <Label htmlFor="edit-is_available">Available for ordering</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_vegetarian"
                  checked={formData.is_vegetarian}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_vegetarian: checked })}
                />
                <Label htmlFor="edit-is_vegetarian">Vegetarian</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_vegan"
                  checked={formData.is_vegan}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_vegan: checked })}
                />
                <Label htmlFor="edit-is_vegan">Vegan</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-is_gluten_free"
                  checked={formData.is_gluten_free}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_gluten_free: checked })}
                />
                <Label htmlFor="edit-is_gluten_free">Gluten Free</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDish}>
              Update Dish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discount Dialog */}
      <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
            <DialogDescription>
              Set a percentage discount for "{discountingDish?.name}". The discount will be active for one day.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="discount-percentage">Discount Percentage *</Label>
              <Input
                id="discount-percentage"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="e.g., 25.00"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Enter a value between 0.01 and 100
              </p>
            </div>
            {discountingDish && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Preview:</p>
                <p className="text-sm text-muted-foreground">
                  Original Price: {formatPrice(discountingDish.price)}
                </p>
                {discountPercentage && parseFloat(discountPercentage) > 0 && (
                  <p className="text-sm text-green-600">
                    Discounted Price: {formatPrice(
                      (typeof discountingDish.price === 'number' ? discountingDish.price : parseFloat(discountingDish.price as string)) * 
                      (1 - parseFloat(discountPercentage) / 100)
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyDiscount}>
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
