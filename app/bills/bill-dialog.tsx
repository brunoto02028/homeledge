"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, X } from "lucide-react"
import type { Bill, Account, BillFrequency, Category, ExpenseType } from "@/lib/types"
import { EXPENSE_TYPE_LABELS, EXPENSE_TYPE_DESCRIPTIONS } from "@/lib/types"

// UK Service Provider Icons - organized by category
const UK_PROVIDER_ICONS = {
  // Streaming & Entertainment
  "Netflix": "https://i.ytimg.com/vi/y1ZGQuUMUX4/maxresdefault.jpg",
  "Amazon Prime": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Prime_Video_logo_%282024%29.svg/250px-Prime_Video_logo_%282024%29.svg.png",
  "Disney+": "https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg",
  "Apple TV+": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  "Sky": "https://upload.wikimedia.org/wikipedia/en/d/db/Sky_logo_2025.svg",
  "NOW TV": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Now_logo.svg/960px-Now_logo.svg.png",
  "Spotify": "https://images.unsplash.com/photo-1613329671121-5d1cf551cc3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w2MjEyNjZ8MHwxfHNlYXJjaHwxfHxzcG90aWZ5fGVufDB8fHx8MTc0NTM5NzM1OXww&ixlib=rb-4.0.3&q=80&w=1080",
  "YouTube Premium": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/1280px-YouTube_full-color_icon_%282017%29.svg.png",
  "Apple Music": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhqpTldQEzwaITrjettN6OoK4AHIYOjt9Uri0waSxDMdEw-swGFvkrShcoxA5tNbzvzUBtTraEQCdZEyJ_0N064VMWYR3Vw4alt_AtvjvLY30olCHOb8Rz-pjdGZJ9YOZiUf1whAzkeBePg9M9abND7j8_95MgXe7-jXtXuv6APvb8fgz_X6sHU590t/s1800/music%20sticker%20badge%20for%20ptomotion%20freeject%201.jpg",
  // Energy
  "British Gas": "https://upload.wikimedia.org/wikipedia/en/1/11/British_Gas_logo.svg",
  "EDF Energy": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/EDF_Energy_logo.svg/1280px-EDF_Energy_logo.svg.png",
  "E.ON": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Logo_of_the_company_E.On_Energy_Trading.jpg",
  "Scottish Power": "https://upload.wikimedia.org/wikipedia/en/thumb/3/3c/Scottish_Power_1990_Logo.gif/250px-Scottish_Power_1990_Logo.gif",
  "SSE Energy": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d5/SSEenergy.svg/1280px-SSEenergy.svg.png",
  "Octopus Energy": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Octopus_Energy_logo_%282019%29.svg/960px-Octopus_Energy_logo_%282019%29.svg.png",
  "Bulb": "https://upload.wikimedia.org/wikipedia/en/0/03/Bulb_Energy_company_logo.png",
  "OVO Energy": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Ovo_Energy_logo.svg/1280px-Ovo_Energy_logo.svg.png",
  // Water
  "Thames Water": "https://i.ytimg.com/vi/qV_rID2rrAM/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLAp6E6lqy5epRK8K7LKycHytnjy8g",
  "United Utilities": "https://upload.wikimedia.org/wikipedia/commons/4/48/UU-logo.png",
  "Severn Trent": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Severn_Trent_logo.svg/1280px-Severn_Trent_logo.svg.png",
  "Anglian Water": "https://upload.wikimedia.org/wikipedia/en/6/67/Anglian_water.png",
  "Yorkshire Water": "https://upload.wikimedia.org/wikipedia/en/0/06/YorkshireWater.svg",
  "Southern Water": "https://upload.wikimedia.org/wikipedia/en/thumb/e/e6/Southern_Water_logo.svg/1280px-Southern_Water_logo.svg.png",
  // Telecom & Broadband
  "BT": "https://upload.wikimedia.org/wikipedia/commons/c/cd/BT_logo_2019.svg",
  "Virgin Media": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Virgin_Media.svg/1280px-Virgin_Media.svg.png",
  "Sky Broadband": "https://upload.wikimedia.org/wikipedia/en/thumb/d/db/Sky_logo_2025.svg/1280px-Sky_logo_2025.svg.png",
  "TalkTalk": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/TalkTalk_Group_logo.svg/1280px-TalkTalk_Group_logo.svg.png",
  "Plusnet": "https://upload.wikimedia.org/wikipedia/en/thumb/a/ab/Plusnet_logo.svg/1280px-Plusnet_logo.svg.png",
  "Vodafone": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Vodafone_2017_logo.svg/330px-Vodafone_2017_logo.svg.png",
  "EE": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/EE_logo.svg/120px-EE_logo.svg.png",
  "Three": "https://upload.wikimedia.org/wikipedia/en/7/73/Logo_of_Three_UK.svg",
  "O2": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/O2_Logo_2024.svg/1280px-O2_Logo_2024.svg.png",
  "Tesco Mobile": "https://upload.wikimedia.org/wikipedia/en/3/32/Tesco_Mobile.svg",
  "GiffGaff": "https://upload.wikimedia.org/wikipedia/commons/4/4f/Giffgaff_logo.svg",
  // Insurance
  "Aviva": "https://upload.wikimedia.org/wikipedia/commons/1/1e/Aviva_Logo.svg",
  "Direct Line": "https://upload.wikimedia.org/wikipedia/en/thumb/3/3c/Direct_Line_Group_logo.svg/1280px-Direct_Line_Group_logo.svg.png",
  "Admiral": "https://upload.wikimedia.org/wikipedia/en/thumb/1/10/Admiral_Group_Logo.svg/250px-Admiral_Group_Logo.svg.png",
  "Churchill": "https://play-lh.googleusercontent.com/wXij543mxAcwsD8KLnCiEyWRD-b-ziNJ1Ow_-TeoiSoE4PE0jv5pMThx-9nx3FJ6LGXu=w600-h300-pc0xffffff-pd",
  "LV=": "https://logos-world.net/wp-content/uploads/2024/10/LV-Logo-2011.png",
  "AXA": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/AXA_Logo.svg/250px-AXA_Logo.svg.png",
  "Zurich": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Zurich_Insurance_Group_logo.svg/1280px-Zurich_Insurance_Group_logo.svg.png",
  "Legal & General": "https://upload.wikimedia.org/wikipedia/commons/b/b9/L%26G_Logo.png",
  "Prudential": "https://upload.wikimedia.org/wikipedia/en/0/07/Prudential-plc-1986.svg",
  "Vitality": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Vitality-logo-pink.svg/250px-Vitality-logo-pink.svg.png",
  "Bupa": "https://i.ytimg.com/vi/wC35sRG1sAw/maxresdefault.jpg",
  // Council Tax / Government
  "Council Tax": "https://upload.wikimedia.org/wikipedia/en/8/88/UK_Government_logo.svg",
  "TV Licence": "https://upload.wikimedia.org/wikipedia/commons/d/d8/TV_Licensing_logo.svg",
  "HMRC": "https://upload.wikimedia.org/wikipedia/en/thumb/8/88/UK_Government_logo.svg/1280px-UK_Government_logo.svg.png",
  // Subscriptions
  "Gym": "https://upload.wikimedia.org/wikipedia/en/b/b8/Pure_gym_logo.png",
  "PureGym": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Pure_Gym%2C_Cloth_Hall_Street%2C_Leeds_%2812th_April_2014%29.JPG/250px-Pure_Gym%2C_Cloth_Hall_Street%2C_Leeds_%2812th_April_2014%29.JPG",
  "The Gym Group": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/The_Gym_Group_Logo_08.2022.svg/1280px-The_Gym_Group_Logo_08.2022.svg.png",
  "David Lloyd": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Dl-clubs-logo_rgb.png",
  "Microsoft 365": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/960px-Microsoft_logo.svg.png",
  "Adobe": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Adobe_Corporate_logo.svg/960px-Adobe_Corporate_logo.svg.png",
  "Dropbox": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Dropbox_Logo_01.svg/1280px-Dropbox_Logo_01.svg.png",
  "Google One": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/250px-Google_%22G%22_logo.svg.png",
  "iCloud": "https://i.ytimg.com/vi/4r-B_APokSs/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCOzEUL17IZcNhj21UvBcQmzXfdqw",
  // Retail & Shopping
  "Amazon": "https://pbs.twimg.com/profile_images/1912984448699912192/Vc99aGue_400x400.jpg",
  "Tesco Clubcard": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/Tesco_Logo.svg/1280px-Tesco_Logo.svg.png",
  "Sainsbury's": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sainsbury%27s_Logo.svg/1280px-Sainsbury%27s_Logo.svg.png",
  "ASDA": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Asda_logo.svg/250px-Asda_logo.svg.png",
  // Transport
  "RAC": "https://play-lh.googleusercontent.com/FKYA0n8jqIx0_BVq3V3I9voOTbsyqgrzVp_gtgZ12RPn60j-gEO1_Yky5lFP9dfzTw",
  "AA": "https://upload.wikimedia.org/wikipedia/commons/d/d4/American-Automobile-Association-Logo.svg",
  "Green Flag": "https://live.staticflickr.com/5445/10058894935_bb0ee1725e_b.jpg",
  "Congestion Charge": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Transport_for_London_logo_%282013%29.svg/1280px-Transport_for_London_logo_%282013%29.svg.png",
  "Oyster": "https://i.pinimg.com/474x/ca/0c/88/ca0c8880e8c7f2f3961f34ac77de6961.jpg",
}

interface BillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill: Bill | null
  accounts: Account[]
  categories: Category[]
  onSave: (data: Partial<Bill>) => void
}

export function BillDialog({ open, onOpenChange, bill, accounts, categories, onSave }: BillDialogProps) {
  const [formData, setFormData] = useState({
    billName: "",
    accountId: "",
    iconUrl: "",
    amount: "",
    frequency: "monthly" as BillFrequency,
    dueDay: "",
    categoryId: "",
    expenseType: "recurring" as ExpenseType,
    isActive: true,
  })
  const [iconSearch, setIconSearch] = useState("")
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (bill) {
      setFormData({
        billName: bill.billName ?? "",
        accountId: bill.accountId ?? "",
        iconUrl: bill.iconUrl ?? "",
        amount: String(bill.amount ?? ""),
        frequency: bill.frequency ?? "monthly",
        dueDay: String(bill.dueDay ?? ""),
        categoryId: bill.categoryId ?? "",
        expenseType: bill.expenseType ?? "recurring",
        isActive: bill.isActive ?? true,
      })
    } else {
      setFormData({
        billName: "",
        accountId: accounts?.[0]?.id ?? "",
        iconUrl: "",
        amount: "",
        frequency: "monthly",
        dueDay: "",
        categoryId: "",
        expenseType: "recurring",
        isActive: true,
      })
    }
    setErrors({})
    setShowIconPicker(false)
    setIconSearch("")
  }, [bill, accounts, open])

  // Auto-suggest icon based on bill name
  useEffect(() => {
    if (formData.billName && !formData.iconUrl) {
      const lowerName = formData.billName.toLowerCase()
      for (const [provider, url] of Object.entries(UK_PROVIDER_ICONS)) {
        if (lowerName.includes(provider.toLowerCase()) || provider.toLowerCase().includes(lowerName)) {
          setFormData(f => ({ ...f, iconUrl: url }))
          break
        }
      }
    }
  }, [formData.billName])

  const filteredIcons = Object.entries(UK_PROVIDER_ICONS).filter(([name]) =>
    name.toLowerCase().includes(iconSearch.toLowerCase())
  )

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.billName.trim()) newErrors.billName = "Bill name is required"
    // accountId is optional
    if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = "Valid amount is required"
    const dueDay = parseInt(formData.dueDay)
    if (!dueDay || dueDay < 1 || dueDay > 31) newErrors.dueDay = "Due day must be 1-31"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSave({
      ...formData,
      iconUrl: formData.iconUrl || null,
      amount: parseFloat(formData.amount),
      dueDay: parseInt(formData.dueDay),
      categoryId: formData.categoryId || null,
      accountId: formData.accountId || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{bill ? "Edit Bill" : "Add New Bill"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon and Name Row */}
          <div className="flex gap-4 items-start">
            {/* Icon Picker */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowIconPicker(!showIconPicker)}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-border hover:border-primary flex items-center justify-center overflow-hidden bg-muted transition-colors"
                >
                  {formData.iconUrl ? (
                    <Image
                      src={formData.iconUrl}
                      alt="Bill icon"
                      width={48}
                      height={48}
                      className="object-contain"
                      unoptimized
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs text-center">Click to<br/>select</span>
                  )}
                </button>
                {formData.iconUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, iconUrl: "" }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Bill Name */}
            <div className="flex-1 space-y-2">
              <Label htmlFor="billName">Bill Name *</Label>
              <Input
                id="billName"
                value={formData.billName}
                onChange={(e) => setFormData((f) => ({ ...f, billName: e.target.value }))}
                placeholder="e.g., Netflix Premium"
              />
              {errors.billName && <p className="text-sm text-red-500">{errors.billName}</p>}
            </div>
          </div>

          {/* Icon Picker Dropdown */}
          {showIconPicker && (
            <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  placeholder="Search providers..."
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-40">
                <div className="grid grid-cols-5 gap-2">
                  {filteredIcons.map(([name, url]) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        setFormData(f => ({ ...f, iconUrl: url }))
                        setShowIconPicker(false)
                      }}
                      className={`p-2 rounded-lg border hover:border-primary hover:bg-primary/10 flex flex-col items-center gap-1 transition-colors ${
                        formData.iconUrl === url ? "border-primary bg-primary/10" : "border-border"
                      }`}
                      title={name}
                    >
                      <div className="w-8 h-8 relative">
                        <Image
                          src={url}
                          alt={name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center">{name}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground">Or paste custom URL:</Label>
                <Input
                  value={formData.iconUrl}
                  onChange={(e) => setFormData(f => ({ ...f, iconUrl: e.target.value }))}
                  placeholder="https://lh3.googleusercontent.com/64GWPJbpSJKB2hejLK02GLHjflv2B8cCr7SJUQI7cHXO0Qakc28U-ZRw7IRL3WadD8Stugb1HB4GgpqEkRydsEaR9AC4SqrTeRlCDlo=w1064-v0"
                  className="mt-1 text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="accountId">Account</Label>
            <Select value={formData.accountId || "none"} onValueChange={(v) => setFormData((f) => ({ ...f, accountId: v === "none" ? "" : v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Account</SelectItem>
                {accounts?.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.accountName} - {acc.provider?.name ?? "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.accountId && <p className="text-sm text-red-500">{errors.accountId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (GBP) *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
              />
              {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDay">Due Day *</Label>
              <Input
                id="dueDay"
                type="number"
                min="1"
                max="31"
                value={formData.dueDay}
                onChange={(e) => setFormData((f) => ({ ...f, dueDay: e.target.value }))}
                placeholder="1-31"
              />
              {errors.dueDay && <p className="text-sm text-red-500">{errors.dueDay}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(v) => setFormData((f) => ({ ...f, frequency: v as BillFrequency }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.categoryId || "none"} 
                onValueChange={(v) => setFormData((f) => ({ ...f, categoryId: v === "none" ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Category</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full border border-black/10 dark:border-white/20" 
                          style={{ backgroundColor: cat.color || '#6b7280' }}
                        />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenseType">Expense Type</Label>
            <Select 
              value={formData.expenseType} 
              onValueChange={(v) => setFormData((f) => ({ ...f, expenseType: v as ExpenseType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_TYPE_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    <div>
                      <span className="font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {EXPENSE_TYPE_DESCRIPTIONS[key as ExpenseType]}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {bill ? "Save Changes" : "Add Bill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
