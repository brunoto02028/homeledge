"use client"

import Image from "next/image"
import { Calendar, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, getFrequencyLabel } from "@/lib/utils"
import type { Bill } from "@/lib/types"

// UK service provider logos mapping
const PROVIDER_LOGOS: Record<string, string> = {
  // Energy
  "british gas": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/British_Gas_Logo.webp/2560px-British_Gas_Logo.webp.png",
  "octopus energy": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Octopus_Energy_-_gas_and_electricity_supplier.png/960px-Octopus_Energy_-_gas_and_electricity_supplier.png",
  "eon": "https://upload.wikimedia.org/wikipedia/commons/d/d8/Logo_of_the_company_E.On_Energy_Trading.jpg",
  "edf": "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/EDF_Energy_logo.svg/1280px-EDF_Energy_logo.svg.png",
  "scottish power": "https://upload.wikimedia.org/wikipedia/en/thumb/3/3c/Scottish_Power_1990_Logo.gif/250px-Scottish_Power_1990_Logo.gif",
  "sse": "https://upload.wikimedia.org/wikipedia/en/thumb/d/d5/SSEenergy.svg/1280px-SSEenergy.svg.png",
  "bulb": "https://upload.wikimedia.org/wikipedia/en/0/03/Bulb_Energy_company_logo.png",
  "ovo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Ovo_Energy_logo.svg/1280px-Ovo_Energy_logo.svg.png",
  // Insurance
  "aviva": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Aviva_Logo.svg/1200px-Aviva_Logo.svg.png",
  "direct line": "https://upload.wikimedia.org/wikipedia/en/thumb/3/3c/Direct_Line_Group_logo.svg/250px-Direct_Line_Group_logo.svg.png",
  "admiral": "https://upload.wikimedia.org/wikipedia/en/thumb/1/10/Admiral_Group_Logo.svg/250px-Admiral_Group_Logo.svg.png",
  "axa": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/AXA_Logo.svg/200px-AXA_Logo.svg.png",
  "legal & general": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/L%26G_Logo.png/1280px-L%26G_Logo.png",
  // Mobile/Telecom
  "tesco mobile": "https://upload.wikimedia.org/wikipedia/en/3/32/Tesco_Mobile.svg",
  "ee": "https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/EE_Logo_2022.svg/120px-EE_Logo_2022.svg.png",
  "vodafone": "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Vodafone_2017_logo.svg/1280px-Vodafone_2017_logo.svg.png",
  "o2": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/O2_Logo_2024.svg/1200px-O2_Logo_2024.svg.png",
  "three": "https://upload.wikimedia.org/wikipedia/en/6/68/3-brand.svg",
  "giffgaff": "https://upload.wikimedia.org/wikipedia/commons/4/4f/Giffgaff_logo.svg",
  "sky mobile": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/Sky_Group_logo_2020.svg/200px-Sky_Group_logo_2020.svg.png",
  "bt": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/BT_logo_2019.png/1280px-BT_logo_2019.png",
  "virgin media": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Virgin_Media.svg/1280px-Virgin_Media.svg.png",
  // Streaming
  "netflix": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/200px-Netflix_2015_logo.svg.png",
  "spotify": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Spotify_icon.svg/200px-Spotify_icon.svg.png",
  "amazon prime": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Amazon_Prime_Logo.svg/200px-Amazon_Prime_Logo.svg.png",
  "disney": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Disney%2B_logo.svg/200px-Disney%2B_logo.svg.png",
  "apple": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png",
  "youtube": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full-color_icon_%282017%29.svg/200px-YouTube_full-color_icon_%282017%29.svg.png",
  // Internet/TV
  "sky": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a6/Sky_Group_logo_2020.svg/200px-Sky_Group_logo_2020.svg.png",
  "virgin": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Virgin_Media.svg/250px-Virgin_Media.svg.png",
  "talktalk": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/TalkTalk_Group_logo.svg/1280px-TalkTalk_Group_logo.svg.png",
  "plusnet": "https://play-lh.googleusercontent.com/F_d45lJYgRwClj048OYzNWh_-nNY7D8YScWSu4P-V48zgqrsnczHPPJ9hX8KM5VX-IxrGsE-2tX3-8AIsi093A=w240-h480-rw",
  // Water
  "thames water": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Thames_Water_HQ.jpg",
  "severn trent": "https://www.stwater.co.uk/content/dam/stw/common_assets/st-logo.png",
  "united utilities": "https://upload.wikimedia.org/wikipedia/commons/4/48/UU-logo.png",
  "anglian water": "https://upload.wikimedia.org/wikipedia/en/6/67/Anglian_water.png",
  // Council Tax
  "council tax": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/St_George%27s_Cross.svg/1200px-St_George%27s_Cross.svg.png",
  // Other
  "tv licence": "https://upload.wikimedia.org/wikipedia/commons/d/d8/TV_Licensing_logo.svg",
  "bbc": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/TV_Licensing_logo.svg/2560px-TV_Licensing_logo.svg.png",
  "gym": "https://www.shutterstock.com/image-vector/gym-equipment-workout-icon-set-260nw-2691114299.jpg",
}

function getProviderLogo(billName: string): string | null {
  const lowerName = billName.toLowerCase()
  for (const [key, url] of Object.entries(PROVIDER_LOGOS)) {
    if (lowerName.includes(key)) {
      return url
    }
  }
  return null
}

interface UpcomingBillsProps {
  bills: (Bill & { nextDueDate?: string })[]
}

function getDaysUntil(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getDueBadge(daysUntil: number) {
  if (daysUntil < 0) return { label: "Overdue", variant: "destructive" as const }
  if (daysUntil === 0) return { label: "Due Today", variant: "warning" as const }
  if (daysUntil <= 3) return { label: `${daysUntil}d left`, variant: "warning" as const }
  if (daysUntil <= 7) return { label: `${daysUntil}d left`, variant: "default" as const }
  return { label: `${daysUntil}d left`, variant: "secondary" as const }
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  const safeBills = bills ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          Upcoming Bills
        </CardTitle>
      </CardHeader>
      <CardContent>
        {safeBills.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No upcoming bills</p>
        ) : (
          <div className="space-y-3">
            {safeBills.slice(0, 5).map((bill) => {
              const daysUntil = bill.nextDueDate ? getDaysUntil(bill.nextDueDate) : bill.dueDay
              const dueBadge = getDueBadge(daysUntil)
              const providerLogo = bill.account?.provider?.logoUrl
              const providerName = bill.account?.provider?.name ?? "Unknown"

              // Try to match logo by bill name first, then fall back to provider
              const serviceLogo = getProviderLogo(bill.billName)
              const displayLogo = serviceLogo || providerLogo

              return (
                <div key={bill.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                  <div className="relative h-10 w-10 rounded-lg bg-card shadow-sm border border-border overflow-hidden flex-shrink-0">
                    {displayLogo ? (
                      <Image
                        src={displayLogo}
                        alt={bill.billName}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                        {bill.billName?.charAt?.(0) ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{bill.billName}</p>
                    <p className="text-sm text-muted-foreground">{getFrequencyLabel(bill.frequency)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                    <Badge variant={dueBadge.variant} className="mt-1">
                      {dueBadge.label}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
