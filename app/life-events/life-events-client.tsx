'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
import {
  Home, Heart, Baby, Briefcase, Clock, Calendar, CheckCircle2, Circle,
  AlertTriangle, ExternalLink, Plus, Trash2, RefreshCw, ChevronRight,
  MapPin, Building, Users, FileText, Loader2, Car, GraduationCap, Shield,
  Landmark, Stethoscope, Scale, Plane, Wrench, Wifi, Zap, CreditCard,
  Key, BookOpen, UserPlus, Hammer, FileCheck, Globe, ScrollText
} from 'lucide-react';
import { format } from 'date-fns';

interface LifeEventTask {
  id: string;
  title: string;
  description: string;
  providerCategory: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  dueOffsetDays: number;
  dueDate: string | null;
  completedAt: string | null;
  referenceUrl: string | null;
  notes: string | null;
}

interface LifeEvent {
  id: string;
  eventType: string;
  title: string;
  description: string | null;
  eventDate: string;
  details: Record<string, unknown> | null;
  status: string;
  createdAt: string;
  tasks: LifeEventTask[];
}

const EVENT_TYPE_CATEGORIES = [
  {
    label: 'Housing',
    types: [
      { value: 'moving_house', label: 'Moving House', icon: Home, color: 'bg-blue-500' },
      { value: 'buying_property', label: 'Buying Property', icon: Building, color: 'bg-amber-500' },
      { value: 'selling_property', label: 'Selling Property', icon: Building, color: 'bg-amber-600' },
      { value: 'renting_property', label: 'Renting a Property', icon: Key, color: 'bg-blue-400' },
      { value: 'home_renovation', label: 'Home Renovation', icon: Hammer, color: 'bg-orange-400' },
    ],
  },
  {
    label: 'Family',
    types: [
      { value: 'getting_married', label: 'Getting Married', icon: Heart, color: 'bg-pink-500' },
      { value: 'having_baby', label: 'Having a Baby', icon: Baby, color: 'bg-purple-500' },
      { value: 'divorce', label: 'Divorce / Separation', icon: Users, color: 'bg-red-500' },
      { value: 'death_in_family', label: 'Death in Family', icon: Heart, color: 'bg-gray-600' },
      { value: 'adoption', label: 'Adoption', icon: UserPlus, color: 'bg-purple-400' },
      { value: 'child_starting_school', label: 'Child Starting School', icon: GraduationCap, color: 'bg-indigo-400' },
      { value: 'sending_child_to_uni', label: 'Child Going to University', icon: GraduationCap, color: 'bg-indigo-500' },
      { value: 'becoming_carer', label: 'Becoming a Carer', icon: Heart, color: 'bg-rose-400' },
      { value: 'childcare_arrangements', label: 'Childcare Arrangements', icon: Baby, color: 'bg-pink-400' },
    ],
  },
  {
    label: 'Career & Work',
    types: [
      { value: 'starting_new_job', label: 'Starting a New Job', icon: Briefcase, color: 'bg-green-500' },
      { value: 'changing_jobs', label: 'Changing Jobs', icon: Briefcase, color: 'bg-green-400' },
      { value: 'losing_job', label: 'Losing a Job / Redundancy', icon: AlertTriangle, color: 'bg-red-400' },
      { value: 'starting_business', label: 'Starting a Business', icon: Building, color: 'bg-emerald-500' },
      { value: 'self_employed_registration', label: 'Registering as Self-Employed', icon: FileCheck, color: 'bg-emerald-400' },
      { value: 'retiring', label: 'Retiring', icon: Clock, color: 'bg-orange-500' },
      { value: 'workplace_pension', label: 'Workplace Pension', icon: Landmark, color: 'bg-slate-500' },
    ],
  },
  {
    label: 'Health',
    types: [
      { value: 'registering_with_gp', label: 'Registering with a GP', icon: Stethoscope, color: 'bg-teal-500' },
      { value: 'registering_with_dentist', label: 'Registering with a Dentist', icon: Stethoscope, color: 'bg-teal-400' },
      { value: 'maternity_paternity', label: 'Maternity / Paternity Leave', icon: Baby, color: 'bg-pink-500' },
      { value: 'long_term_illness', label: 'Long-term Illness', icon: Heart, color: 'bg-red-300' },
      { value: 'disability_claim', label: 'Disability Benefits (PIP/DLA)', icon: Shield, color: 'bg-blue-600' },
    ],
  },
  {
    label: 'DVLA & Transport',
    types: [
      { value: 'getting_driving_licence', label: 'Getting a Driving Licence', icon: Car, color: 'bg-sky-500' },
      { value: 'buying_car', label: 'Buying a Car', icon: Car, color: 'bg-sky-600' },
      { value: 'selling_car', label: 'Selling a Car', icon: Car, color: 'bg-sky-400' },
      { value: 'mot_tax_insurance', label: 'MOT / Road Tax / Insurance', icon: FileCheck, color: 'bg-sky-500' },
    ],
  },
  {
    label: 'Council & Government',
    types: [
      { value: 'council_tax_registration', label: 'Council Tax Registration', icon: Landmark, color: 'bg-violet-500' },
      { value: 'electoral_register', label: 'Electoral Register', icon: FileCheck, color: 'bg-violet-400' },
      { value: 'applying_for_benefits', label: 'Applying for Benefits', icon: Shield, color: 'bg-violet-600' },
      { value: 'universal_credit', label: 'Universal Credit', icon: CreditCard, color: 'bg-violet-500' },
      { value: 'applying_for_passport', label: 'Applying for a Passport', icon: Globe, color: 'bg-red-600' },
      { value: 'renewing_passport', label: 'Renewing a Passport', icon: Globe, color: 'bg-red-500' },
      { value: 'name_change_deed_poll', label: 'Name Change (Deed Poll)', icon: ScrollText, color: 'bg-slate-600' },
    ],
  },
  {
    label: 'Immigration',
    types: [
      { value: 'immigrating_to_uk', label: 'Immigrating to the UK', icon: Plane, color: 'bg-cyan-500' },
      { value: 'visa_renewal', label: 'Visa Renewal', icon: FileCheck, color: 'bg-cyan-600' },
      { value: 'settled_status', label: 'Settled / Pre-Settled Status', icon: Shield, color: 'bg-cyan-400' },
      { value: 'citizenship_application', label: 'Citizenship Application', icon: Globe, color: 'bg-cyan-700' },
      { value: 'biometric_residence_permit', label: 'Biometric Residence Permit (BRP)', icon: CreditCard, color: 'bg-cyan-500' },
    ],
  },
  {
    label: 'Finance',
    types: [
      { value: 'opening_bank_account', label: 'Opening a Bank Account', icon: Landmark, color: 'bg-emerald-500' },
      { value: 'applying_for_mortgage', label: 'Applying for a Mortgage', icon: Home, color: 'bg-emerald-600' },
      { value: 'remortgaging', label: 'Remortgaging', icon: Home, color: 'bg-emerald-400' },
      { value: 'dealing_with_debt', label: 'Dealing with Debt', icon: AlertTriangle, color: 'bg-red-500' },
      { value: 'bankruptcy_iva', label: 'Bankruptcy / IVA', icon: Scale, color: 'bg-red-700' },
    ],
  },
  {
    label: 'Legal',
    types: [
      { value: 'making_a_will', label: 'Making a Will', icon: ScrollText, color: 'bg-slate-500' },
      { value: 'power_of_attorney', label: 'Power of Attorney', icon: Scale, color: 'bg-slate-600' },
      { value: 'probate', label: 'Probate', icon: FileText, color: 'bg-slate-500' },
      { value: 'inheriting', label: 'Inheriting / Receiving Inheritance', icon: Landmark, color: 'bg-amber-600' },
    ],
  },
  {
    label: 'Education',
    types: [
      { value: 'student_finance', label: 'Student Finance', icon: GraduationCap, color: 'bg-indigo-500' },
      { value: 'professional_qualification', label: 'Professional Qualification', icon: BookOpen, color: 'bg-indigo-400' },
    ],
  },
  {
    label: 'Utilities',
    types: [
      { value: 'switching_energy_provider', label: 'Switching Energy Provider', icon: Zap, color: 'bg-yellow-500' },
      { value: 'broadband_setup', label: 'Broadband / Internet Setup', icon: Wifi, color: 'bg-blue-500' },
    ],
  },
  {
    label: 'Other',
    types: [
      { value: 'other', label: 'Other', icon: FileText, color: 'bg-gray-500' },
    ],
  },
];

// Flat list for lookups
const EVENT_TYPES = EVENT_TYPE_CATEGORIES.flatMap(cat => cat.types);

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700',
  high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700',
  low: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  government: <Building className="h-4 w-4" />,
  tax: <FileText className="h-4 w-4" />,
  utilities: <Home className="h-4 w-4" />,
  bank: <Briefcase className="h-4 w-4" />,
  healthcare: <Heart className="h-4 w-4" />,
  insurance: <AlertTriangle className="h-4 w-4" />,
};

export default function LifeEventsClient() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<LifeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<LifeEvent | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    eventType: '',
    title: '',
    description: '',
    eventDate: '',
    fromPostcode: '',
    fromAddress: '',
    toPostcode: '',
    toAddress: '',
  });
  
  // Postcode lookup state
  const [lookingUpFrom, setLookingUpFrom] = useState(false);
  const [lookingUpTo, setLookingUpTo] = useState(false);
  const [fromAddressList, setFromAddressList] = useState<string[]>([]);
  const [toAddressList, setToAddressList] = useState<string[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Postcode lookup using postcodes.io API
  const lookupPostcode = async (postcode: string, type: 'from' | 'to') => {
    const cleanPostcode = postcode.replace(/\s/g, '').toUpperCase();
    if (cleanPostcode.length < 5) return;

    if (type === 'from') {
      setLookingUpFrom(true);
    } else {
      setLookingUpTo(true);
    }

    try {
      // First, validate and get postcode data
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);
      const data = await response.json();

      if (data.status === 200 && data.result) {
        const result = data.result;
        // Format address from postcode data
        const addressParts = [
          result.admin_ward,
          result.parish,
          result.admin_district,
          result.region,
          cleanPostcode.slice(0, -3) + ' ' + cleanPostcode.slice(-3)
        ].filter(Boolean);
        
        const formattedAddress = addressParts.join(', ');

        // Try to get more detailed addresses from Royal Mail
        const addresses = [formattedAddress];
        
        // Add council info for Moving House tasks
        const councilInfo = result.admin_district || result.admin_county;
        
        if (type === 'from') {
          setFromAddressList(addresses);
          setFormData(prev => ({ 
            ...prev, 
            fromAddress: formattedAddress,
            fromPostcode: cleanPostcode.slice(0, -3) + ' ' + cleanPostcode.slice(-3)
          }));
        } else {
          setToAddressList(addresses);
          setFormData(prev => ({ 
            ...prev, 
            toAddress: formattedAddress,
            toPostcode: cleanPostcode.slice(0, -3) + ' ' + cleanPostcode.slice(-3)
          }));
        }
        
        toast.success(`Found: ${councilInfo} council area`);
      } else {
        toast.error('Postcode not found. Please check and try again.');
      }
    } catch {
      toast.error('Failed to lookup postcode');
    } finally {
      if (type === 'from') {
        setLookingUpFrom(false);
      } else {
        setLookingUpTo(false);
      }
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/life-events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch {
      toast.error('Failed to load life events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.eventType || !formData.title || !formData.eventDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // For moving house, require postcodes
    if (formData.eventType === 'moving_house') {
      if (!formData.fromPostcode || !formData.toPostcode) {
        toast.error('Please enter both postcodes for moving house');
        return;
      }
    }

    setCreating(true);
    try {
      const details: Record<string, string> = {};
      if (formData.eventType === 'moving_house') {
        details.fromPostcode = formData.fromPostcode;
        details.fromAddress = formData.fromAddress;
        details.toPostcode = formData.toPostcode;
        details.toAddress = formData.toAddress;
      }

      const response = await fetch('/api/life-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: formData.eventType,
          title: formData.title,
          description: formData.description,
          eventDate: formData.eventDate,
          details,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Created ${data.tasksGenerated} tasks for your life event!`);
        setDialogOpen(false);
        resetForm();
        fetchEvents();
        // Auto-select the new event
        if (data.event) {
          setSelectedEvent(data.event);
        }
      } else {
        toast.error(data.error || 'Failed to create event');
      }
    } catch {
      toast.error('Failed to create life event');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      eventType: '', 
      title: '', 
      description: '', 
      eventDate: '', 
      fromPostcode: '',
      fromAddress: '', 
      toPostcode: '',
      toAddress: '' 
    });
    setFromAddressList([]);
    setToAddressList([]);
  };

  const handleTaskStatusChange = async (eventId: string, taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/life-events/${eventId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setEvents(prev => prev.map(event => {
          if (event.id === eventId) {
            return {
              ...event,
              tasks: event.tasks.map(task => {
                if (task.id === taskId) {
                  return { 
                    ...task, 
                    status: status as LifeEventTask['status'],
                    completedAt: status === 'completed' ? new Date().toISOString() : null
                  };
                }
                return task;
              })
            };
          }
          return event;
        }));
        
        if (status === 'completed') {
          toast.success('Task completed! \u2705');
        }
      }
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this life event and all its tasks?')) return;
    
    try {
      const response = await fetch(`/api/life-events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
        setSelectedEvent(null);
        toast.success('Life event deleted');
      }
    } catch {
      toast.error('Failed to delete event');
    }
  };

  const getEventIcon = (eventType: string) => {
    const type = EVENT_TYPES.find(t => t.value === eventType);
    if (type) {
      const Icon = type.icon;
      return <Icon className="h-5 w-5" />;
    }
    return <FileText className="h-5 w-5" />;
  };

  const getEventColor = (eventType: string) => {
    const type = EVENT_TYPES.find(t => t.value === eventType);
    return type?.color || 'bg-gray-500';
  };

  const getProgressStats = (tasks: LifeEventTask[]) => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percentage };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('lifeEvents.title')}</h1>
          <p className="text-muted-foreground dark:text-muted-foreground/60 mt-1">
            {t('lifeEvents.subtitle')}
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Life Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Start a New Life Event</DialogTitle>
              <DialogDescription>
                Tell us about your life event and we'll generate a compliance checklist for the UK.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Event Type *</Label>
                <Select
                  value={formData.eventType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {EVENT_TYPE_CATEGORIES.map(cat => (
                      <div key={cat.label}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</div>
                        {cat.types.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  placeholder="e.g., Moving to Ipswich"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
                />
              </div>

              {formData.eventType === 'moving_house' && (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Details
                  </h4>
                  
                  {/* FROM Postcode */}
                  <div className="space-y-2">
                    <Label>Current Postcode *</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., IP8 3LU"
                        value={formData.fromPostcode}
                        onChange={(e) => setFormData(prev => ({ ...prev, fromPostcode: e.target.value.toUpperCase() }))}
                        className="flex-1"
                        maxLength={8}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => lookupPostcode(formData.fromPostcode, 'from')}
                        disabled={lookingUpFrom || formData.fromPostcode.length < 5}
                        className="whitespace-nowrap"
                      >
                        {lookingUpFrom ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-1" />
                            Find
                          </>
                        )}
                      </Button>
                    </div>
                    {formData.fromAddress && (
                      <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                        ✓ {formData.fromAddress}
                      </p>
                    )}
                  </div>

                  {/* TO Postcode */}
                  <div className="space-y-2">
                    <Label>New Postcode *</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., E1 6AN"
                        value={formData.toPostcode}
                        onChange={(e) => setFormData(prev => ({ ...prev, toPostcode: e.target.value.toUpperCase() }))}
                        className="flex-1"
                        maxLength={8}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => lookupPostcode(formData.toPostcode, 'to')}
                        disabled={lookingUpTo || formData.toPostcode.length < 5}
                        className="whitespace-nowrap"
                      >
                        {lookingUpTo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <MapPin className="h-4 w-4 mr-1" />
                            Find
                          </>
                        )}
                      </Button>
                    </div>
                    {formData.toAddress && (
                      <p className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-2 rounded">
                        ✓ {formData.toAddress}
                      </p>
                    )}
                  </div>
                  
                  <p className="text-xs text-blue-600">
                    Postcode lookup powered by postcodes.io. We'll identify your councils to generate relevant tasks.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Textarea
                  placeholder="Any additional details..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Button
                onClick={handleCreateEvent}
                disabled={creating}
                className="w-full"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Checklist...
                  </>
                ) : (
                  'Generate AI Checklist'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {t('lifeEvents.noEvents')}
            </h3>
            <p className="text-muted-foreground dark:text-muted-foreground/60 text-center mb-4">
              Start tracking a life event like moving house, getting married, or having a baby.
              Our AI will generate a UK-compliant checklist for you.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Your Events</h2>
            {events.map(event => {
              const stats = getProgressStats(event.tasks);
              return (
                <Card
                  key={event.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedEvent?.id === event.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedEvent(event)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getEventColor(event.eventType)} text-white`}>
                        {getEventIcon(event.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{event.title}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(event.eventDate), 'dd MMM yyyy')}
                        </p>
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{stats.completed}/{stats.total} tasks</span>
                            <span className="font-medium">{stats.percentage}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 transition-all duration-300"
                              style={{ width: `${stats.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Task Details */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${getEventColor(selectedEvent.eventType)} text-white`}>
                        {getEventIcon(selectedEvent.eventType)}
                      </div>
                      {selectedEvent.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {selectedEvent.description || `Event date: ${format(new Date(selectedEvent.eventDate), 'dd MMMM yyyy')}`}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList>
                      <TabsTrigger value="all">All Tasks</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="all" className="mt-4 space-y-3">
                      {selectedEvent.tasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={(status) => handleTaskStatusChange(selectedEvent.id, task.id, status)}
                        />
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="pending" className="mt-4 space-y-3">
                      {selectedEvent.tasks.filter(t => t.status !== 'completed').map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={(status) => handleTaskStatusChange(selectedEvent.id, task.id, status)}
                        />
                      ))}
                    </TabsContent>
                    
                    <TabsContent value="completed" className="mt-4 space-y-3">
                      {selectedEvent.tasks.filter(t => t.status === 'completed').map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onStatusChange={(status) => handleTaskStatusChange(selectedEvent.id, task.id, status)}
                        />
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/60 mb-4" />
                  <p className="text-muted-foreground">Select an event to view its tasks</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({ task, onStatusChange }: { task: LifeEventTask; onStatusChange: (status: string) => void }) {
  const isCompleted = task.status === 'completed';
  
  return (
    <div className={`p-4 rounded-lg border ${isCompleted ? 'bg-muted/50' : 'bg-card'}`}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onStatusChange(checked ? 'completed' : 'pending')}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h4>
            <Badge className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
              {task.priority}
            </Badge>
            {task.providerCategory && (
              <Badge variant="outline" className="text-xs gap-1">
                {CATEGORY_ICONS[task.providerCategory] || <FileText className="h-3 w-3" />}
                {task.providerCategory}
              </Badge>
            )}
          </div>
          <p className={`text-sm mt-1 ${isCompleted ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
            {task.description}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Due: {format(new Date(task.dueDate), 'dd MMM yyyy')}
              </span>
            )}
            {task.referenceUrl && (
              <a
                href={task.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                More info
              </a>
            )}
            {task.completedAt && (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Completed {format(new Date(task.completedAt), 'dd MMM')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
