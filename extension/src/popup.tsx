import { StrictMode, useCallback, useEffect, useReducer } from 'react'
import { createRoot } from 'react-dom/client'

// ---- Types ----

interface ExtractedFields {
  company: string
  role: string
  modality: 'remote' | 'hybrid' | 'on_site' | ''
  location: string
  salary: string
  source: string
}

type PopupState =
  | { phase: 'loading' }
  | { phase: 'not_authed' }
  | { phase: 'idle'; url: string }
  | { phase: 'extracting'; url: string }
  | { phase: 'preview'; url: string; fields: ExtractedFields }
  | { phase: 'saving'; url: string; fields: ExtractedFields }
  | { phase: 'saved' }
  | { phase: 'error'; message: string; url?: string; fields?: ExtractedFields }

type Action =
  | { type: 'SESSION_OK'; url: string }
  | { type: 'NO_SESSION' }
  | { type: 'EXTRACT_START' }
  | { type: 'EXTRACT_OK'; fields: ExtractedFields }
  | { type: 'EXTRACT_FAIL'; message: string }
  | { type: 'FIELD_CHANGE'; key: keyof ExtractedFields; value: string }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_OK' }
  | { type: 'SAVE_FAIL'; message: string }
  | { type: 'RETRY'; url: string }

function reducer(state: PopupState, action: Action): PopupState {
  switch (action.type) {
    case 'SESSION_OK':
      return { phase: 'idle', url: action.url }
    case 'NO_SESSION':
      return { phase: 'not_authed' }
    case 'EXTRACT_START':
      if (state.phase !== 'idle') return state
      return { phase: 'extracting', url: state.url }
    case 'EXTRACT_OK':
      if (state.phase !== 'extracting') return state
      return { phase: 'preview', url: state.url, fields: action.fields }
    case 'EXTRACT_FAIL':
      if (state.phase !== 'extracting') return state
      return { phase: 'error', message: action.message, url: state.url }
    case 'FIELD_CHANGE':
      if (state.phase !== 'preview') return state
      return { ...state, fields: { ...state.fields, [action.key]: action.value } }
    case 'SAVE_START':
      if (state.phase !== 'preview') return state
      return { phase: 'saving', url: state.url, fields: state.fields }
    case 'SAVE_OK':
      return { phase: 'saved' }
    case 'SAVE_FAIL':
      if (state.phase !== 'saving') return state
      return { phase: 'error', message: action.message, url: state.url, fields: state.fields }
    case 'RETRY':
      return { phase: 'idle', url: action.url }
    default:
      return state
  }
}

// ---- Message helpers ----

function sendMessage<T>(message: Record<string, unknown>): Promise<T> {
  return chrome.runtime.sendMessage(message)
}

// ---- Styles (inline for zero-dependency popup) ----

const css = {
  container: { padding: '16px', display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  header: { display: 'flex', alignItems: 'center', gap: '8px' },
  title: { fontWeight: 700, fontSize: '15px', color: '#111' },
  label: { fontSize: '11px', fontWeight: 600, color: '#555', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  input: { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' },
  select: { width: '100%', padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', background: '#fff' },
  button: { padding: '8px 16px', borderRadius: '6px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer' },
  primaryBtn: { background: '#005ac2', color: '#fff' },
  ghostBtn: { background: '#f3f4f6', color: '#374151' },
  urlText: { fontSize: '12px', color: '#6b7280', wordBreak: 'break-all' as const },
  errorBox: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '10px', color: '#991b1b', fontSize: '13px' },
  successBox: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '6px', padding: '16px', textAlign: 'center' as const, color: '#166534' },
}

// ---- Components ----

function Field({ label, id, value, onChange }: { label: string; id: keyof ExtractedFields; value: string; onChange: (k: keyof ExtractedFields, v: string) => void }) {
  if (id === 'modality') {
    return (
      <div>
        <div style={css.label}>{label}</div>
        <select style={css.select} value={value} onChange={(e) => onChange(id, e.target.value)}>
          <option value="">—</option>
          <option value="remote">Remote</option>
          <option value="hybrid">Hybrid</option>
          <option value="on_site">On-site</option>
        </select>
      </div>
    )
  }
  return (
    <div>
      <div style={css.label}>{label}</div>
      <input style={css.input} type="text" value={value} onChange={(e) => onChange(id, e.target.value)} />
    </div>
  )
}

// ---- App ----

function App() {
  const [state, dispatch] = useReducer(reducer, { phase: 'loading' })

  // On mount: check session + get current tab URL
  useEffect(() => {
    async function init() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const url = tab?.url ?? ''
        const result = await sendMessage<{ session: { access_token: string } | null }>({ type: 'GET_SESSION' })
        if (result.session?.access_token) {
          dispatch({ type: 'SESSION_OK', url })
        } else {
          dispatch({ type: 'NO_SESSION' })
        }
      } catch {
        dispatch({ type: 'NO_SESSION' })
      }
    }
    init()
  }, [])

  const handleExtract = useCallback(async () => {
    if (state.phase !== 'idle') return
    dispatch({ type: 'EXTRACT_START' })

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) {
      dispatch({ type: 'EXTRACT_FAIL', message: 'Could not access the active tab.' })
      return
    }

    const result = await sendMessage<{ data?: Record<string, unknown>; error?: string }>({
      type: 'EXTRACT',
      tabId: tab.id,
      url: state.url,
    })

    if (result.error || !result.data) {
      dispatch({ type: 'EXTRACT_FAIL', message: result.error ?? 'Extraction failed.' })
      return
    }

    const d = result.data as Record<string, string | null>
    dispatch({
      type: 'EXTRACT_OK',
      fields: {
        company: d.company ?? '',
        role: d.role ?? '',
        modality: (d.modality as ExtractedFields['modality']) ?? '',
        location: d.location ?? '',
        salary: d.salary ?? '',
        source: d.source ?? '',
      },
    })
  }, [state])

  const handleFieldChange = useCallback((key: keyof ExtractedFields, value: string) => {
    dispatch({ type: 'FIELD_CHANGE', key, value })
  }, [])

  const handleSave = useCallback(async () => {
    if (state.phase !== 'preview') return
    dispatch({ type: 'SAVE_START' })

    const { fields, url } = state
    const result = await sendMessage<{ ok?: boolean; error?: string }>({
      type: 'SAVE',
      fields: {
        company: fields.company || null,
        role: fields.role || null,
        modality: fields.modality || null,
        location: fields.location || null,
        salary: fields.salary || null,
        source: fields.source || null,
      },
      url,
    })

    if (result.error) {
      dispatch({ type: 'SAVE_FAIL', message: result.error })
    } else {
      dispatch({ type: 'SAVE_OK' })
    }
  }, [state])

  // ---- Render ----

  if (state.phase === 'loading') {
    return <div style={{ ...css.container, color: '#6b7280' }}>Loading...</div>
  }

  if (state.phase === 'not_authed') {
    return (
      <div style={css.container}>
        <div style={css.header}>
          <span style={css.title}>JobTrackr</span>
        </div>
        <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.5 }}>
          Please log in via the web app first, then use the <strong>Connect Extension</strong> button to link your session.
        </p>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>
          You only need to do this once (or when your session expires).
        </p>
        <div style={{ marginTop: '8px' }}>
          <div style={css.label}>Paste session JSON</div>
          <textarea
            style={{ ...css.input, height: '80px', resize: 'vertical', fontFamily: 'monospace', fontSize: '11px' }}
            placeholder='{"access_token":"...", "refresh_token":"..."}'
            onBlur={async (e) => {
              const val = e.target.value.trim()
              if (!val) return
              const result = await sendMessage<{ ok?: boolean; error?: string }>({ type: 'SET_SESSION', data: val })
              if (result.ok) {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
                dispatch({ type: 'SESSION_OK', url: tab?.url ?? '' })
              } else {
                alert('Invalid session JSON: ' + result.error)
              }
            }}
          />
        </div>
      </div>
    )
  }

  if (state.phase === 'idle') {
    return (
      <div style={css.container}>
        <div style={css.header}>
          <span style={css.title}>JobTrackr</span>
        </div>
        <div>
          <div style={css.label}>Current page</div>
          <p style={css.urlText}>{state.url || '(no URL)'}</p>
        </div>
        <button
          style={{ ...css.button, ...css.primaryBtn }}
          onClick={handleExtract}
        >
          Extract Job
        </button>
      </div>
    )
  }

  if (state.phase === 'extracting') {
    return (
      <div style={css.container}>
        <div style={css.header}><span style={css.title}>JobTrackr</span></div>
        <p style={{ fontSize: '13px', color: '#374151' }}>Extracting job details...</p>
        <div style={css.urlText}>{state.url}</div>
      </div>
    )
  }

  if (state.phase === 'preview') {
    return (
      <div style={css.container}>
        <div style={css.header}><span style={css.title}>JobTrackr</span></div>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>Review and edit before saving.</p>
        {(
          [
            ['Company', 'company'],
            ['Role', 'role'],
            ['Modality', 'modality'],
            ['Location', 'location'],
            ['Salary', 'salary'],
            ['Source', 'source'],
          ] as [string, keyof ExtractedFields][]
        ).map(([label, key]) => (
          <Field key={key} label={label} id={key} value={state.fields[key]} onChange={handleFieldChange} />
        ))}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ ...css.button, ...css.primaryBtn, flex: 1 }} onClick={handleSave}>
            Save
          </button>
          <button
            style={{ ...css.button, ...css.ghostBtn }}
            onClick={() => dispatch({ type: 'RETRY', url: state.url })}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  if (state.phase === 'saving') {
    return (
      <div style={css.container}>
        <div style={css.header}><span style={css.title}>JobTrackr</span></div>
        <p style={{ fontSize: '13px', color: '#374151' }}>Saving...</p>
      </div>
    )
  }

  if (state.phase === 'saved') {
    return (
      <div style={css.container}>
        <div style={css.header}><span style={css.title}>JobTrackr</span></div>
        <div style={css.successBox}>
          <strong>Saved!</strong>
          <p style={{ marginTop: '4px', fontSize: '13px' }}>The job has been added to your tracker.</p>
        </div>
      </div>
    )
  }

  if (state.phase === 'error') {
    return (
      <div style={css.container}>
        <div style={css.header}><span style={css.title}>JobTrackr</span></div>
        <div style={css.errorBox}>{state.message}</div>
        <button
          style={{ ...css.button, ...css.ghostBtn }}
          onClick={() => dispatch({ type: 'RETRY', url: state.url ?? '' })}
        >
          Try again
        </button>
      </div>
    )
  }

  return null
}

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
