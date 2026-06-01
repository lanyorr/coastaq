import { useState, useEffect } from "react";
import { AccountLayout } from "./AccountLayout";
import { MapPin, Plus, Trash2, Edit2, Check, Home, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Address {
  id: string;
  label: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

const STORAGE_KEY = "coastaq_addresses";

function loadAddresses(): Address[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAddresses(addrs: Address[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addrs));
}

const EMPTY_FORM: Omit<Address, "id"> = {
  label: "Home",
  name: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "NG",
  isDefault: false,
};

export default function AccountAddresses() {
  const [addresses, setAddresses] = useState<Address[]>(loadAddresses);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Address, "id">>(EMPTY_FORM);
  const { toast } = useToast();

  useEffect(() => {
    saveAddresses(addresses);
  }, [addresses]);

  const set = (k: keyof Omit<Address, "id">) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = () => {
    if (!form.name || !form.address || !form.city || !form.state || !form.country) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    if (editId) {
      setAddresses(prev => prev.map(a => a.id === editId ? { ...form, id: editId } : a));
      toast({ title: "Address updated" });
    } else {
      const newAddr: Address = { ...form, id: crypto.randomUUID() };
      if (addresses.length === 0) newAddr.isDefault = true;
      setAddresses(prev => [...prev, newAddr]);
      toast({ title: "Address added" });
    }

    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (addr: Address) => {
    setEditId(addr.id);
    setForm({ label: addr.label, name: addr.name, address: addr.address, city: addr.city, state: addr.state, zip: addr.zip, country: addr.country, isDefault: addr.isDefault });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setAddresses(prev => {
      const next = prev.filter(a => a.id !== id);
      if (next.length > 0 && !next.some(a => a.isDefault)) {
        next[0].isDefault = true;
      }
      return next;
    });
    toast({ title: "Address removed" });
  };

  const handleSetDefault = (id: string) => {
    setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === id })));
    toast({ title: "Default address updated" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setForm(EMPTY_FORM);
  };

  const LabelIcon = form.label === "Work" ? Briefcase : Home;

  return (
    <AccountLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold">My Addresses</h1>
        {!showForm && (
          <Button size="sm" className="rounded-xl gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Address
          </Button>
        )}
      </div>

      {/* Address form */}
      {showForm && (
        <div className="bg-card border border-border/50 rounded-2xl p-6 mb-6 space-y-4">
          <h2 className="font-semibold text-foreground text-base">
            {editId ? "Edit Address" : "New Address"}
          </h2>

          {/* Label selector */}
          <div>
            <Label className="text-xs font-medium mb-2 block">Label</Label>
            <div className="flex gap-2">
              {["Home", "Work", "Other"].map(l => (
                <button
                  key={l}
                  onClick={() => setForm(f => ({ ...f, label: l }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${form.label === l ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium">Full Name *</Label>
              <Input value={form.name} onChange={set("name")} placeholder="John Doe" className="rounded-xl h-10" />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-medium">Street Address *</Label>
              <Input value={form.address} onChange={set("address")} placeholder="123 Market Street" className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">City *</Label>
              <Input value={form.city} onChange={set("city")} placeholder="Lagos" className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">State / Province *</Label>
              <Input value={form.state} onChange={set("state")} placeholder="Lagos State" className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Postal Code</Label>
              <Input value={form.zip} onChange={set("zip")} placeholder="100001" className="rounded-xl h-10" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Country *</Label>
              <Input value={form.country} onChange={set("country")} placeholder="NG" className="rounded-xl h-10" />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button className="rounded-xl" onClick={handleSave}>
              <Check className="w-4 h-4 mr-1" />
              {editId ? "Update Address" : "Save Address"}
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Address list */}
      {addresses.length === 0 && !showForm ? (
        <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-7 h-7 text-primary" />
          </div>
          <h3 className="font-semibold mb-1 text-foreground">No saved addresses</h3>
          <p className="text-sm text-muted-foreground mb-5">Save your delivery addresses for faster checkout.</p>
          <Button size="sm" className="rounded-xl gap-2" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" /> Add Your First Address
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map(addr => (
            <div
              key={addr.id}
              className={`bg-card border rounded-2xl p-5 flex gap-4 ${addr.isDefault ? "border-primary/40 ring-1 ring-primary/20" : "border-border/50"}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${addr.isDefault ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                {addr.label === "Work" ? <Briefcase className="w-5 h-5" /> : <Home className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-foreground">{addr.label}</span>
                  {addr.isDefault && (
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Default</span>
                  )}
                </div>
                <p className="text-sm text-foreground font-medium">{addr.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {addr.address}, {addr.city}, {addr.state}{addr.zip ? ` ${addr.zip}` : ""}, {addr.country}
                </p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[11px] text-primary hover:underline font-medium text-right"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => handleEdit(addr)}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 justify-end"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="text-[11px] text-muted-foreground hover:text-red-600 transition-colors flex items-center gap-1 justify-end"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AccountLayout>
  );
}
