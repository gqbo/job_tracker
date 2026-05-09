import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useCreateApplication } from '@/hooks/useApplications'
import { addApplicationSchema, type AddApplicationFormValues } from '@/validation/schemas/application.schema'
import { FieldError } from './FieldError'

interface AddApplicationModalProps {
  open: boolean
  onClose: () => void
}

const inputClass =
  'w-full bg-white border border-[#b3b1b4]/20 rounded-md px-3 py-2 text-sm focus:border-[#005ac2] focus:ring-2 focus:ring-[#005ac2]/10 outline-none'
const labelClass = 'font-body text-xs uppercase tracking-wider text-[#5f5f61] block mb-2'

export function AddApplicationModal({ open, onClose }: AddApplicationModalProps) {
  const createMutation = useCreateApplication()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddApplicationFormValues>({
    resolver: zodResolver(addApplicationSchema),
    defaultValues: { status: 'bookmarked' },
  })

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const onSubmit = (values: AddApplicationFormValues) => {
    // Strip empty optional strings so DB doesn't store blanks; convert modality '' to undefined
    const payload = {
      url: values.url,
      ...(values.company?.trim() && { company: values.company.trim() }),
      ...(values.role?.trim() && { role: values.role.trim() }),
      ...(values.modality && { modality: values.modality as 'remote' | 'hybrid' | 'on_site' }),
      ...(values.location?.trim() && { location: values.location.trim() }),
      ...(values.salary?.trim() && { salary: values.salary.trim() }),
      ...(values.source?.trim() && { source: values.source.trim() }),
      status: values.status ?? 'bookmarked',
    }
    createMutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Application saved!')
        reset()
        onClose()
      },
      onError: () => toast.error('Failed to save application.'),
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-[0_20px_50px_rgba(50,50,53,0.06)] p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-semibold text-[#323235] text-lg mb-6">Add Application</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">

          {/* URL — required */}
          <div>
            <label className={labelClass}>JOB POSTING URL *</label>
            <input
              {...register('url')}
              type="url"
              placeholder="https://linkedin.com/jobs/..."
              className={inputClass}
            />
            {errors.url && <FieldError message={errors.url.message ?? ''} />}
          </div>

          {/* Company + Role — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>COMPANY</label>
              <input {...register('company')} type="text" placeholder="Acme Corp" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>ROLE</label>
              <input {...register('role')} type="text" placeholder="Software Engineer" className={inputClass} />
            </div>
          </div>

          {/* Modality + Status — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>MODALITY</label>
              <select {...register('modality')} className={inputClass}>
                <option value="">— Select —</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="on_site">On Site</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>STATUS</label>
              <select {...register('status')} className={inputClass}>
                <option value="bookmarked">Bookmarked</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="ghosted">Ghosted</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>LOCATION</label>
            <input {...register('location')} type="text" placeholder="New York, NY" className={inputClass} />
          </div>

          {/* Salary + Source — side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>SALARY</label>
              <input {...register('salary')} type="text" placeholder="$120,000/yr" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SOURCE</label>
              <input {...register('source')} type="text" placeholder="LinkedIn, Referral…" className={inputClass} />
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-gradient-to-br from-[#005ac2] to-[#004fab] text-white font-body font-semibold text-sm rounded-md py-2 px-4 hover:from-[#004fab] hover:to-[#003d96] transition-all disabled:opacity-60 mt-2"
          >
            {createMutation.isPending ? 'Saving...' : 'Save Application'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  )
}
