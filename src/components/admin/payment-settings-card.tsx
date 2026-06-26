import { useEffect, useState } from 'react'
import { CreditCard, Check, Lock, AlertTriangle } from 'lucide-react'
import {
  useBillingSettings,
  useUpdateBillingSettings,
  type BillingProvider,
  type UpdateBillingSettings,
} from '@/lib/admin/use-admin'
import { ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PROVIDERS: { value: BillingProvider; label: string; hint: string }[] = [
  { value: 'dev', label: 'Dev (simulated)', hint: 'Upgrades instantly, no real payment. Testing only.' },
  { value: 'stripe', label: 'Stripe', hint: 'Cards & subscriptions via Stripe Checkout.' },
  { value: 'paymongo', label: 'PayMongo', hint: 'GCash, Maya, cards (PHP).' },
  { value: 'none', label: 'Disabled', hint: 'No upgrades allowed.' },
]

function ConfiguredBadge({ set }: { set: boolean }) {
  return set ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
      <Check className="h-3 w-3" /> Saved
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
      Not set
    </span>
  )
}

function SecretField({
  label,
  set,
  value,
  onChange,
  placeholder,
}: {
  label: string
  set: boolean
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center justify-between text-xs font-medium text-foreground">
        {label}
        <ConfiguredBadge set={set} />
      </span>
      <Input
        type="password"
        autoComplete="new-password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={set ? '•••••••• (leave blank to keep)' : (placeholder ?? '')}
      />
    </label>
  )
}

export function PaymentSettingsCard({ enabled }: { enabled: boolean }) {
  const settingsQuery = useBillingSettings(enabled)
  const update = useUpdateBillingSettings()
  const data = settingsQuery.data

  const [provider, setProvider] = useState<BillingProvider>('dev')
  const [stripeSecret, setStripeSecret] = useState('')
  const [stripePrice, setStripePrice] = useState('')
  const [stripeHook, setStripeHook] = useState('')
  const [pmSecret, setPmSecret] = useState('')
  const [pmAmount, setPmAmount] = useState('')
  const [pmHook, setPmHook] = useState('')
  const [saved, setSaved] = useState(false)

  // Seed editable non-secret fields once data loads.
  useEffect(() => {
    if (!data) return
    setProvider(data.activeProvider)
    setStripePrice(data.stripe.pricePro ?? '')
    setPmAmount(data.paymongo.proAmount != null ? String(data.paymongo.proAmount) : '')
  }, [data])

  if (settingsQuery.isLoading || !data) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Loading payment settings...
      </div>
    )
  }

  const handleSave = () => {
    setSaved(false)
    const payload: UpdateBillingSettings = { activeProvider: provider }
    if (stripePrice.trim()) payload.stripePricePro = stripePrice.trim()
    if (stripeSecret.trim()) payload.stripeSecretKey = stripeSecret.trim()
    if (stripeHook.trim()) payload.stripeWebhookSecret = stripeHook.trim()
    if (pmSecret.trim()) payload.paymongoSecretKey = pmSecret.trim()
    if (pmHook.trim()) payload.paymongoWebhookSecret = pmHook.trim()
    if (pmAmount.trim()) payload.paymongoProAmount = Number(pmAmount)

    update.mutate(payload, {
      onSuccess: () => {
        setSaved(true)
        setStripeSecret('')
        setStripeHook('')
        setPmSecret('')
        setPmHook('')
      },
    })
  }

  const errorMessage =
    update.error instanceof ApiError ? update.error.message : update.error ? 'Failed to save' : null

  return (
    <div className="space-y-5 rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CreditCard className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Payment settings</h2>
          <p className="text-sm text-muted-foreground">
            Choose the active provider and store API keys. Secrets are encrypted
            at rest and never shown again.
          </p>
        </div>
      </div>

      {!data.encryptionConfigured && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <code>BILLING_ENCRYPTION_KEY</code> is not set on the server. Saving
            provider secrets is disabled until it is configured.
          </span>
        </div>
      )}

      {/* Active provider */}
      <fieldset className="space-y-2">
        <legend className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Active provider
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {PROVIDERS.map((p) => (
            <label
              key={p.value}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm transition-colors ${
                provider === p.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="provider"
                value={p.value}
                checked={provider === p.value}
                onChange={() => setProvider(p.value)}
                className="mt-0.5"
              />
              <span>
                <span className="block font-medium text-foreground">{p.label}</span>
                <span className="block text-xs text-muted-foreground">{p.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Stripe */}
      <div className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Stripe
        </h3>
        <SecretField
          label="Secret key"
          set={data.stripe.secretKeySet}
          value={stripeSecret}
          onChange={setStripeSecret}
          placeholder="sk_live_..."
        />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-foreground">Price ID (Pro)</span>
          <Input
            value={stripePrice}
            onChange={(e) => setStripePrice(e.target.value)}
            placeholder="price_..."
          />
        </label>
        <SecretField
          label="Webhook signing secret"
          set={data.stripe.webhookSecretSet}
          value={stripeHook}
          onChange={setStripeHook}
          placeholder="whsec_..."
        />
      </div>

      {/* PayMongo */}
      <div className="space-y-3 rounded-lg border border-border p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lock className="h-3.5 w-3.5 text-muted-foreground" /> PayMongo
        </h3>
        <SecretField
          label="Secret key"
          set={data.paymongo.secretKeySet}
          value={pmSecret}
          onChange={setPmSecret}
          placeholder="sk_live_..."
        />
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-foreground">
            Pro amount (centavos)
          </span>
          <Input
            type="number"
            min={0}
            value={pmAmount}
            onChange={(e) => setPmAmount(e.target.value)}
            placeholder="60000"
          />
        </label>
        <SecretField
          label="Webhook signing secret"
          set={data.paymongo.webhookSecretSet}
          value={pmHook}
          onChange={setPmHook}
          placeholder="whsk_..."
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {errorMessage ? (
            <span className="text-destructive">{errorMessage}</span>
          ) : saved ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          ) : data.updatedAt ? (
            <>Last updated {new Date(data.updatedAt).toLocaleString()}</>
          ) : null}
        </div>
        <Button onClick={handleSave} disabled={update.isPending}>
          {update.isPending ? 'Saving...' : 'Save settings'}
        </Button>
      </div>
    </div>
  )
}
