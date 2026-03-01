'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Category, CategoryType, CATEGORY_TYPE_LABELS } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';
import { Plus, Pencil, Trash2, Tag, Loader2, Zap, Phone, Building, Shield, Tv, Car, ShoppingCart, Home, Heart, Music, Monitor, MoreHorizontal, CreditCard, Briefcase, TrendingUp, PiggyBank, Building2, RotateCcw, Landmark, ArrowDownCircle, ArrowUpCircle, LayoutGrid, List, MapPin, Users, Package, Megaphone, Scale, FileText, ShoppingBag, GraduationCap, Sparkles, Baby, ArrowLeftRight, Banknote, PieChart, UtensilsCrossed, Shirt } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  Zap: <Zap className="h-5 w-5" />,
  Phone: <Phone className="h-5 w-5" />,
  Building: <Building className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
  Tv: <Tv className="h-5 w-5" />,
  Tv2: <Tv className="h-5 w-5" />,
  Car: <Car className="h-5 w-5" />,
  ShoppingCart: <ShoppingCart className="h-5 w-5" />,
  Home: <Home className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Music: <Music className="h-5 w-5" />,
  Monitor: <Monitor className="h-5 w-5" />,
  MoreHorizontal: <MoreHorizontal className="h-5 w-5" />,
  Tag: <Tag className="h-5 w-5" />,
  CreditCard: <CreditCard className="h-5 w-5" />,
  Briefcase: <Briefcase className="h-5 w-5" />,
  TrendingUp: <TrendingUp className="h-5 w-5" />,
  PiggyBank: <PiggyBank className="h-5 w-5" />,
  Building2: <Building2 className="h-5 w-5" />,
  RotateCcw: <RotateCcw className="h-5 w-5" />,
  Landmark: <Landmark className="h-5 w-5" />,
  Plus: <Plus className="h-5 w-5" />,
  MapPin: <MapPin className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  Megaphone: <Megaphone className="h-5 w-5" />,
  Scale: <Scale className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  ShoppingBag: <ShoppingBag className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  Sparkles: <Sparkles className="h-5 w-5" />,
  Baby: <Baby className="h-5 w-5" />,
  ArrowLeftRight: <ArrowLeftRight className="h-5 w-5" />,
  Banknote: <Banknote className="h-5 w-5" />,
  PieChart: <PieChart className="h-5 w-5" />,
  UtensilsCrossed: <UtensilsCrossed className="h-5 w-5" />,
  Shirt: <Shirt className="h-5 w-5" />,
};

const AVAILABLE_ICONS = Object.keys(ICON_MAP);

const EXPENSE_COLORS = [
  '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899',
  '#6366f1', '#14b8a6', '#f97316', '#ef4444', '#a855f7',
  '#0ea5e9', '#6b7280', '#64748b',
];

const INCOME_COLORS = [
  '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
  '#84cc16', '#65a30d', '#4ade80', '#86efac', '#bbf7d0',
];

export default function CategoriesClient() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', icon: 'Tag', color: '#3b82f6', type: 'expense' as CategoryType });
  const [activeTab, setActiveTab] = useState<'all' | 'expense' | 'income'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('categories-view-mode') as 'grid' | 'list') || 'grid';
    }
    return 'grid';
  });
  const handleViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('categories-view-mode', mode);
  };
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      let data = await res.json();
      
      // Seed default categories if empty
      if (data.length === 0) {
        await fetch('/api/categories', { method: 'PUT' });
        const newRes = await fetch('/api/categories');
        data = await newRes.json();
      }
      
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || 'Tag',
        color: category.color || '#3b82f6',
        type: category.type || 'expense',
      });
    } else {
      setEditCategory(null);
      setFormData({ name: '', description: '', icon: 'Tag', color: activeTab === 'income' ? '#22c55e' : '#3b82f6', type: activeTab === 'income' ? 'income' : 'expense' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }

    try {
      const url = editCategory ? `/api/categories/${editCategory.id}` : '/api/categories';
      const method = editCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: editCategory ? 'Category Updated' : 'Category Created' });
        setDialogOpen(false);
        fetchCategories();
      } else {
        const error = await res.json();
        toast({ title: error.error || 'Failed', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'Category Deleted' });
        fetchCategories();
      } else {
        const error = await res.json();
        toast({ title: error.error || 'Failed to delete', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');
  const filteredCategories = activeTab === 'all' ? categories : activeTab === 'expense' ? expenseCategories : incomeCategories;
  const currentColors = formData.type === 'income' ? INCOME_COLORS : EXPENSE_COLORS;

  const renderCategoryCard = (category: Category) => (
    <Card key={category.id}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${category.color}20`, color: category.color || '#3b82f6' }}
            >
              {ICON_MAP[category.icon || 'Tag'] || ICON_MAP.Tag}
            </div>
            <div>
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {category.type === 'income' ? (
                  <Badge variant="outline" className="text-xs text-muted-foreground/60 border-border bg-slate-50 dark:bg-slate-800/50">
                    <ArrowDownCircle className="h-3 w-3 mr-1" /> Income
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                    <ArrowUpCircle className="h-3 w-3 mr-1" /> Expense
                  </Badge>
                )}
                {category.isDefault && (
                  <Badge variant="secondary" className="text-xs">Default</Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(category)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Permanently delete "{category.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The category will be permanently removed from the system.
                    Bills, invoices, and transactions using this category will become uncategorized.
                    Any budgets and categorization rules linked to it will also be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(category.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      {category.description && (
        <CardContent>
          <CardDescription>{category.description}</CardDescription>
        </CardContent>
      )}
    </Card>
  );

  const renderCategoryListItem = (category: Category) => (
    <div key={category.id} className="flex items-center justify-between py-3 px-4 border-b last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="p-1.5 rounded-md flex-shrink-0"
          style={{ backgroundColor: `${category.color}20`, color: category.color || '#3b82f6' }}
        >
          {ICON_MAP[category.icon || 'Tag'] || ICON_MAP.Tag}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{category.name}</span>
            {category.type === 'income' ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground/60 border-border bg-slate-50 dark:bg-slate-800/50">
                Income
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
                Expense
              </Badge>
            )}
            {category.isDefault && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Default</Badge>
            )}
          </div>
          {category.description && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">{category.description}</p>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0 ml-2">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenDialog(category)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently delete "{category.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The category will be permanently removed from the system.
                Bills, invoices, and transactions using this category will become uncategorized.
                Any budgets and categorization rules linked to it will also be deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(category.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Permanently
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );

  const renderCategories = (cats: Category[]) => {
    if (viewMode === 'list') {
      return (
        <Card>
          <CardContent className="p-0">
            {cats.map(renderCategoryListItem)}
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cats.map(renderCategoryCard)}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
          <p className="text-muted-foreground">{t('categories.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => handleViewMode('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleViewMode('list')}
              className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
              title="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
              <DialogDescription>
                {editCategory ? 'Update the category details' : 'Create a new category for tracking'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CategoryType) => {
                    setFormData({ 
                      ...formData, 
                      type: value,
                      color: value === 'income' ? '#22c55e' : '#3b82f6'
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">
                      <span className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-muted-foreground" /> Expense
                      </span>
                    </SelectItem>
                    <SelectItem value="income">
                      <span className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-green-500" /> Income
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={formData.type === 'income' ? 'e.g., Salary' : 'e.g., Utilities'}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={formData.type === 'income' ? 'e.g., Monthly employment income' : 'e.g., Gas, electricity, water'}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
                  {AVAILABLE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`p-2 rounded-lg border-2 transition-colors ${formData.icon === icon ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'}`}
                    >
                      {ICON_MAP[icon]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${formData.color === color ? 'scale-125 border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>{editCategory ? 'Update' : 'Create'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all">{t('common.all')} ({categories.length})</TabsTrigger>
            <TabsTrigger value="expense" className="text-red-600">
              <ArrowUpCircle className="h-4 w-4 mr-1" /> {t('categories.expense')} ({expenseCategories.length})
            </TabsTrigger>
            <TabsTrigger value="income" className="text-muted-foreground/60">
              <ArrowDownCircle className="h-4 w-4 mr-1" /> {t('categories.income')} ({incomeCategories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-muted-foreground" /> {t('categories.expense')}
                </h3>
                {renderCategories(expenseCategories)}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5 text-green-500" /> {t('categories.income')}
                </h3>
                {renderCategories(incomeCategories)}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="expense">
            {renderCategories(expenseCategories)}
          </TabsContent>

          <TabsContent value="income">
            {renderCategories(incomeCategories)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
