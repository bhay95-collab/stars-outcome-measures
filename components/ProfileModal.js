import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ProfileModal({ user, onClose, onProfileUpdated }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url')
        .eq('id', user.id)
        .maybeSingle()
      if (data) {
        setFirstName(data.first_name ?? '')
        setLastName(data.last_name ?? '')
        setAvatarUrl(data.avatar_url ?? null)
      }
    }
    loadProfile()
  }, [user.id])

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setError(null)
    setSuccessMsg(null)

    if (newPassword && newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)

    let savedAvatarUrl = avatarUrl

    if (avatarFile) {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(`${user.id}/avatar`, avatarFile, { upsert: true, contentType: avatarFile.type })
      if (uploadError) {
        setError('Photo upload failed: ' + uploadError.message)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(`${user.id}/avatar`)
      savedAvatarUrl = urlData.publicUrl + '?t=' + Date.now()
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, first_name: firstName, last_name: lastName, avatar_url: savedAvatarUrl })
    if (profileError) {
      setError('Could not save profile: ' + profileError.message)
      setSaving(false)
      return
    }

    if (newEmail && newEmail !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email: newEmail })
      if (emailError) {
        setError('Email update failed: ' + emailError.message)
        setSaving(false)
        return
      }
    }

    if (newPassword) {
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword })
      if (pwError) {
        setError('Password update failed: ' + pwError.message)
        setSaving(false)
        return
      }
    }

    onProfileUpdated({ firstName, lastName, avatarUrl: savedAvatarUrl })
    setSuccessMsg(newEmail && newEmail !== user.email
      ? 'Saved. Check your inbox to confirm the new email address.'
      : 'Profile saved.')
    setSaving(false)
    setAvatarFile(null)
    setNewPassword('')
    setConfirmPassword('')
  }

  const displayAvatar = avatarPreview || avatarUrl

  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-content" style={{ padding: '28px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: '18px', fontWeight: 600, color: 'var(--color-ink)' }}>
            Profile
          </h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'var(--color-muted)', lineHeight: 1, padding: '4px' }}
            aria-label="Close"
          >×</button>
        </div>

        {/* Avatar */}
        <div data-avatar-upload="" style={{ paddingBottom: '20px', borderBottom: '1px solid var(--color-border)', marginBottom: '24px' }}>
          {displayAvatar
            ? <img data-profile-avatar="" src={displayAvatar} alt="Profile photo" />
            : <span data-profile-initials="">
                {(firstName?.[0] || user.email?.[0] || '?').toUpperCase()}
              </span>}
          <div>
            <label htmlFor="avatar-input">Change photo</label>
            <input id="avatar-input" type="file" accept="image/*" onChange={handleAvatarChange} />
            <p style={{ fontSize: '12px', color: 'var(--color-subtle)', marginTop: '4px' }}>
              JPG, PNG or GIF · Max 5 MB
            </p>
          </div>
        </div>

        {/* Personal details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="field-group">
            <label className="field-label">First name</label>
            <input
              className="field-input"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="First name"
            />
          </div>
          <div className="field-group">
            <label className="field-label">Last name</label>
            <input
              className="field-input"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Email */}
        <div className="field-group" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
          <label className="field-label">Current email</label>
          <p style={{ fontSize: '13px', color: 'var(--color-muted)', marginBottom: '8px' }}>{user.email}</p>
          <label className="field-label">New email address</label>
          <input
            className="field-input"
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            placeholder="Leave blank to keep current"
          />
          <p style={{ fontSize: '12px', color: 'var(--color-subtle)', marginTop: '4px' }}>
            You will receive a confirmation email at the new address.
          </p>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '24px' }}>
          <label className="field-label" style={{ display: 'block', marginBottom: '12px' }}>Change password</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="field-group">
              <label className="field-label">New password</label>
              <input
                className="field-input"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
              />
            </div>
            <div className="field-group">
              <label className="field-label">Confirm password</label>
              <input
                className="field-input"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: '13px', color: '#922b21', background: '#fdf2f0', border: '1px solid #f5c6c2', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '16px' }}>{error}</div>
        )}
        {successMsg && (
          <div style={{ fontSize: '13px', color: '#1a5c3a', background: '#edfaf3', border: '1px solid #b7eacf', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '16px' }}>{successMsg}</div>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
          <button
            onClick={onClose}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'var(--color-muted)', background: 'none', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', padding: '8px 18px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: 'var(--color-surface)', background: 'var(--color-primary)', border: 'none', borderRadius: 'var(--radius-sm)', padding: '8px 18px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

      </div>
    </div>
  )
}
