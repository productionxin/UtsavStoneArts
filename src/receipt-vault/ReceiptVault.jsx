import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Search, Plus, X, Upload, Loader2, ShieldCheck, ShieldAlert, ShieldX,
  ChevronRight, Trash2, Inbox, Refrigerator, WashingMachine, Tv, Laptop,
  Smartphone, Thermometer, Fan, CookingPot, AirVent, Package,
} from 'lucide-react'

// ── DATE HELPERS ─────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
const toISODate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (date, days) => {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
const parseLocalDate = (str) => {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const formatDisplayDate = (str) =>
  parseLocalDate(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

const TODAY = (() => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
})()

// ── STATUS LOGIC ─────────────────────────────────────────────────────────
function getStatus(warrantyExpiry) {
  const diffDays = Math.round((parseLocalDate(warrantyExpiry) - TODAY) / 86400000)
  if (diffDays < 0) return 'Expired'
  if (diffDays <= 30) return 'Expiring Soon'
  return 'Active'
}

function daysLabel(warrantyExpiry) {
  const diffDays = Math.round((parseLocalDate(warrantyExpiry) - TODAY) / 86400000)
  if (diffDays < 0) return `Expired ${Math.abs(diffDays)}d ago`
  if (diffDays === 0) return 'Expires today'
  return `${diffDays}d left`
}

const STATUS_STYLES = {
  Active: {
    badge: 'bg-green-100 text-green-700',
    iconWrap: 'bg-green-50',
    iconColor: 'text-green-600',
    icon: ShieldCheck,
  },
  'Expiring Soon': {
    badge: 'bg-amber-100 text-amber-700',
    iconWrap: 'bg-amber-50',
    iconColor: 'text-amber-600',
    icon: ShieldAlert,
  },
  Expired: {
    badge: 'bg-red-100 text-red-700',
    iconWrap: 'bg-red-50',
    iconColor: 'text-red-600',
    icon: ShieldX,
  },
}

const STATUS_PRIORITY = { 'Expiring Soon': 0, Active: 1, Expired: 2 }

// ── CATEGORY ICONS ───────────────────────────────────────────────────────
const CATEGORIES = ['Kitchen', 'Laundry', 'Electronics', 'HVAC', 'Home Appliances', 'Outdoor', 'Other']

function iconFor(item) {
  const name = item.itemName.toLowerCase()
  if (name.includes('fridge') || name.includes('refrigerator')) return Refrigerator
  if (name.includes('wash')) return WashingMachine
  if (name.includes(' tv') || name.startsWith('tv') || name.includes('bravia') || name.includes('oled')) return Tv
  if (name.includes('macbook') || name.includes('laptop')) return Laptop
  if (name.includes('phone')) return Smartphone
  if (name.includes('thermostat')) return Thermometer
  if (name.includes('vacuum') || name.includes('fan')) return Fan
  if (name.includes('coffee') || name.includes('nespresso') || name.includes('espresso') || name.includes('dishwasher')) return CookingPot
  if (name.includes('ac ') || name.includes('air condition') || name.includes('split ac')) return AirVent

  switch (item.category) {
    case 'Kitchen': return Refrigerator
    case 'Laundry': return WashingMachine
    case 'Electronics': return Tv
    case 'HVAC': return AirVent
    default: return Package
  }
}

// ── MOCK DATABASE ─────────────────────────────────────────────────────────
function buildInitialItems() {
  const raw = [
    { itemName: 'Samsung 28 cu.ft. Refrigerator', category: 'Kitchen', purchaseOffset: -730, expiryOffset: 12 },
    { itemName: 'LG Front-Load Washing Machine', category: 'Laundry', purchaseOffset: -365, expiryOffset: 45 },
    { itemName: 'Dyson V15 Cordless Vacuum', category: 'Home Appliances', purchaseOffset: -420, expiryOffset: -5 },
    { itemName: 'Sony Bravia 55" OLED TV', category: 'Electronics', purchaseOffset: -300, expiryOffset: 20 },
    { itemName: 'Nespresso Vertuo Next', category: 'Kitchen', purchaseOffset: -180, expiryOffset: 400 },
    { itemName: 'Honeywell Smart Thermostat', category: 'HVAC', purchaseOffset: -640, expiryOffset: 60 },
    { itemName: 'Apple MacBook Pro 14"', category: 'Electronics', purchaseOffset: -900, expiryOffset: -200 },
    { itemName: 'Carrier Split AC Unit', category: 'HVAC', purchaseOffset: -1460, expiryOffset: 1200 },
  ]
  return raw.map((r, i) => {
    const purchaseDate = toISODate(addDays(TODAY, r.purchaseOffset))
    const warrantyExpiry = toISODate(addDays(TODAY, r.expiryOffset))
    return {
      id: `seed-${i + 1}`,
      itemName: r.itemName,
      category: r.category,
      purchaseDate,
      warrantyExpiry,
      receiptImage: `placeholder-receipt-${i + 1}.jpg`,
      status: getStatus(warrantyExpiry),
    }
  })
}

const OCR_SAMPLES = [
  { itemName: 'Whirlpool Dishwasher WDT750', category: 'Kitchen', warrantyDays: 365 },
  { itemName: 'Sony Bravia 65" TV', category: 'Electronics', warrantyDays: 730 },
  { itemName: 'Dyson V11 Cordless Vacuum', category: 'Home Appliances', warrantyDays: 365 },
  { itemName: 'Carrier Split AC Unit', category: 'HVAC', warrantyDays: 1825 },
  { itemName: 'Bosch Front-Load Washer', category: 'Laundry', warrantyDays: 545 },
]

// ── APP ───────────────────────────────────────────────────────────────────
export default function ReceiptVault() {
  const [items, setItems] = useState(buildInitialItems)
  const [query, setQuery] = useState('')
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = q
      ? items.filter(
          (i) => i.itemName.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
        )
      : items
    return [...filtered].sort((a, b) => {
      const p = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
      if (p !== 0) return p
      return parseLocalDate(a.warrantyExpiry) - parseLocalDate(b.warrantyExpiry)
    })
  }, [items, query])

  const expiringSoonCount = useMemo(
    () => items.filter((i) => i.status === 'Expiring Soon').length,
    [items]
  )

  function handleAddItem(newItem) {
    setItems((prev) => [...prev, newItem])
    setModalOpen(false)
  }

  function handleDelete(id) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setSelectedItem(null)
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans text-[#1C1C1E] antialiased">
      <div className="max-w-md mx-auto min-h-screen bg-[#F2F2F7] pb-28">
        <Header
          query={query}
          setQuery={setQuery}
          total={items.length}
          expiringSoonCount={expiringSoonCount}
        />

        <main className="px-4 pt-3">
          {filteredSorted.length === 0 ? (
            <EmptyState hasQuery={!!query.trim()} />
          ) : (
            <ul className="space-y-2.5">
              {filteredSorted.map((item) => (
                <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
              ))}
            </ul>
          )}
        </main>

        <FAB onClick={() => setModalOpen(true)} />

        {isModalOpen && (
          <AddItemModal onClose={() => setModalOpen(false)} onSave={handleAddItem} />
        )}

        {selectedItem && (
          <DetailSheet
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

// ── HEADER + SEARCH ────────────────────────────────────────────────────────
function Header({ query, setQuery, total, expiringSoonCount }) {
  return (
    <header className="sticky top-0 z-20 bg-[#F2F2F7]/85 backdrop-blur-xl pt-6 pb-3 px-4 border-b border-black/5">
      <h1 className="text-[28px] font-bold tracking-tight leading-tight">Receipt Vault</h1>
      <p className="text-[13px] text-gray-500 mt-0.5">
        {total} {total === 1 ? 'item' : 'items'} protected
        {expiringSoonCount > 0 && (
          <span className="text-amber-600 font-medium"> · {expiringSoonCount} expiring soon</span>
        )}
      </p>

      <div className="relative mt-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by item or category"
          className="w-full h-10 rounded-xl bg-white pl-9 pr-9 text-[15px] placeholder:text-gray-400 outline-none ring-1 ring-black/5 focus:ring-2 focus:ring-blue-500 transition-shadow"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </header>
  )
}

// ── ITEM CARD ──────────────────────────────────────────────────────────────
function ItemCard({ item, onClick }) {
  const styles = STATUS_STYLES[item.status]
  const Icon = iconFor(item)

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/5 active:scale-[0.98] active:bg-gray-50 transition-transform text-left"
      >
        <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${styles.iconWrap}`}>
          <Icon className={styles.iconColor} size={20} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold truncate">{item.itemName}</p>
          <p className="text-[13px] text-gray-500 truncate">
            {item.category} · Purchased {formatDisplayDate(item.purchaseDate)}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1.5">
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${styles.badge}`}>
              {item.status}
            </span>
            <span className="text-[11px] text-gray-400 whitespace-nowrap">
              {daysLabel(item.warrantyExpiry)}
            </span>
          </div>
          <ChevronRight className="text-gray-300" size={18} />
        </div>
      </button>
    </li>
  )
}

// ── EMPTY STATE ────────────────────────────────────────────────────────────
function EmptyState({ hasQuery }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <div className="w-14 h-14 rounded-full bg-white ring-1 ring-black/5 flex items-center justify-center mb-3">
        <Inbox className="text-gray-400" size={22} />
      </div>
      <p className="text-[15px] font-semibold text-gray-700">
        {hasQuery ? 'No matching items' : 'No items yet'}
      </p>
      <p className="text-[13px] text-gray-400 mt-1 max-w-[220px]">
        {hasQuery
          ? 'Try a different search term.'
          : 'Tap the + button to add your first receipt.'}
      </p>
    </div>
  )
}

// ── FLOATING ACTION BUTTON ─────────────────────────────────────────────────
function FAB({ onClick }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none">
      <div className="max-w-md mx-auto relative h-0">
        <button
          onClick={onClick}
          aria-label="Add new item"
          className="pointer-events-auto absolute bottom-6 right-5 w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.25)] active:scale-95 transition-transform"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}

// ── ADD ITEM MODAL (with mock OCR) ─────────────────────────────────────────
function AddItemModal({ onClose, onSave }) {
  const [visible, setVisible] = useState(false)
  const [form, setForm] = useState({ itemName: '', category: '', purchaseDate: '', warrantyExpiry: '' })
  const [preview, setPreview] = useState(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [extracted, setExtracted] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function close() {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setExtracted(false)
    setIsExtracting(true)

    setTimeout(() => {
      const sample = OCR_SAMPLES[Math.floor(Math.random() * OCR_SAMPLES.length)]
      setForm({
        itemName: sample.itemName,
        category: sample.category,
        purchaseDate: toISODate(TODAY),
        warrantyExpiry: toISODate(addDays(TODAY, sample.warrantyDays)),
      })
      setIsExtracting(false)
      setExtracted(true)
    }, 2000)
  }

  function handleSave() {
    if (!form.itemName.trim() || !form.purchaseDate || !form.warrantyExpiry) return
    onSave({
      id: crypto.randomUUID?.() ?? String(Date.now()),
      itemName: form.itemName.trim(),
      category: form.category.trim() || 'Other',
      purchaseDate: form.purchaseDate,
      warrantyExpiry: form.warrantyExpiry,
      receiptImage: preview ?? 'placeholder-receipt.jpg',
      status: getStatus(form.warrantyExpiry),
    })
  }

  const canSave = form.itemName.trim() && form.purchaseDate && form.warrantyExpiry

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="sticky top-0 bg-white pt-2.5 pb-3 px-4 border-b border-black/5 flex items-center justify-center relative">
          <div className="w-9 h-1 rounded-full bg-gray-300 absolute top-2" />
          <h2 className="text-[16px] font-semibold mt-2">Add New Item</h2>
          <button onClick={close} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <label className="block">
            <span className="text-[12px] font-medium text-gray-500">Receipt Photo</span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-1.5 w-full rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden"
            >
              {preview ? (
                <img src={preview} alt="Receipt preview" className="w-full h-40 object-cover" />
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-1.5 text-gray-400">
                  <Upload size={22} />
                  <span className="text-[13px]">Upload receipt photo</span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {isExtracting && (
            <div className="flex items-center gap-2 text-[13px] text-blue-600 bg-blue-50 rounded-xl px-3 py-2.5">
              <Loader2 size={16} className="animate-spin" />
              Extracting text...
            </div>
          )}

          {extracted && !isExtracting && (
            <div className="text-[13px] text-green-700 bg-green-50 rounded-xl px-3 py-2.5">
              Details extracted — review and save below.
            </div>
          )}

          <Field label="Item Name">
            <input
              type="text"
              value={form.itemName}
              onChange={(e) => setForm((f) => ({ ...f, itemName: e.target.value }))}
              placeholder="e.g. Samsung Refrigerator"
              className="w-full h-11 rounded-xl bg-gray-100 px-3.5 text-[15px] outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>

          <Field label="Category">
            <input
              type="text"
              list="rv-categories"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              placeholder="e.g. Kitchen"
              className="w-full h-11 rounded-xl bg-gray-100 px-3.5 text-[15px] outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="rv-categories">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Purchase Date">
              <input
                type="date"
                value={form.purchaseDate}
                onChange={(e) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
                className="w-full h-11 rounded-xl bg-gray-100 px-3 text-[15px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Warranty Expiry">
              <input
                type="date"
                value={form.warrantyExpiry}
                onChange={(e) => setForm((f) => ({ ...f, warrantyExpiry: e.target.value }))}
                className="w-full h-11 rounded-xl bg-gray-100 px-3 text-[15px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className="w-full h-12 rounded-xl bg-black text-white text-[15px] font-semibold disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.98] transition-transform mt-2"
          >
            Save Item
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-[12px] font-medium text-gray-500">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  )
}

// ── DETAIL SHEET ────────────────────────────────────────────────────────────
function DetailSheet({ item, onClose, onDelete }) {
  const [visible, setVisible] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const styles = STATUS_STYLES[item.status]
  const StatusIcon = styles.icon
  const isRealImage = typeof item.receiptImage === 'string' && item.receiptImage.startsWith('blob:')

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  function close() {
    setVisible(false)
    setTimeout(onClose, 220)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />
      <div
        className={`relative w-full max-w-md bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto transition-transform duration-300 ease-out ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="sticky top-0 bg-white pt-2.5 pb-3 px-4 border-b border-black/5 flex items-center justify-center relative">
          <div className="w-9 h-1 rounded-full bg-gray-300 absolute top-2" />
          <h2 className="text-[16px] font-semibold mt-2">Item Details</h2>
          <button onClick={close} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {isRealImage ? (
            <img src={item.receiptImage} alt="Receipt" className="w-full h-44 object-cover rounded-2xl" />
          ) : (
            <div className="w-full h-32 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center">
              {(() => {
                const Icon = iconFor(item)
                return <Icon className="text-gray-300" size={36} />
              })()}
            </div>
          )}

          <div>
            <h3 className="text-[19px] font-bold leading-snug">{item.itemName}</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">{item.category}</p>
          </div>

          <div className={`flex items-center gap-2 rounded-xl px-3.5 py-3 ${styles.iconWrap}`}>
            <StatusIcon className={styles.iconColor} size={20} />
            <div>
              <p className={`text-[14px] font-semibold ${styles.iconColor}`}>{item.status}</p>
              <p className="text-[12px] text-gray-500">{daysLabel(item.warrantyExpiry)}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-gray-50 divide-y divide-gray-100 overflow-hidden">
            <DetailRow label="Purchase Date" value={formatDisplayDate(item.purchaseDate)} />
            <DetailRow label="Warranty Expiry" value={formatDisplayDate(item.warrantyExpiry)} />
          </div>

          {confirmingDelete ? (
            <div className="rounded-2xl bg-red-50 p-3.5 space-y-2.5">
              <p className="text-[13px] text-red-700 font-medium">Delete this item permanently?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 h-10 rounded-xl bg-white ring-1 ring-black/5 text-[14px] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="flex-1 h-10 rounded-xl bg-red-600 text-white text-[14px] font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="w-full h-11 rounded-xl bg-white ring-1 ring-red-200 text-red-600 text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
            >
              <Trash2 size={16} />
              Delete Item
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-3">
      <span className="text-[13px] text-gray-500">{label}</span>
      <span className="text-[14px] font-medium">{value}</span>
    </div>
  )
}
