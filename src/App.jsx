import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Check your .env.local or Vercel settings.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


const EMPTY_FORM = {
  title: '',
  first_name: '',
  surname: '',
  couple_name: '',
  care_of: '',
  address_1: '',
  address_2: '',
  address_3: '',
  town_city: '',
  postcode: '',
  telephone: '',
  email: '',
  mem_code: '',
  mem_type: '',
  householder: false,
  joined_date: '',
  death_date: '',
  left_congregation_date: '',
  office_bearer: '',
  ordained_date: '',
  admitted_date: '',
  active: true,
  fwo: false,
  fwo_no: '',
  consent_given: false,
  emergency_contact_label_1: '',
  emergency_contact_detail_1: '',
  emergency_contact_label_2: '',
  emergency_contact_detail_2: '',
  notes: '',
};

const MEM_CODE_OPTIONS = ['', 'F', 'D', 'A', 'T', 'O', 'M'];

function App() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [messageModal, setMessageModal] = useState({
    open: false,
    title: '',
    message: '',
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null,
    confirmText: 'Confirm',
    danger: false,
  });

  const trimmedSearch = search.trim();

  useEffect(() => {
    const runSearch = async () => {
      if (!trimmedSearch) {
        setRows([]);
        setSearchError('');
        setLoading(false);
        return;
      }

      setLoading(true);
      setSearchError('');

      try {
        const like = `%${trimmedSearch}%`;

        const { data, error } = await supabase
          .from('people_list_view')
          .select(
            `
            id,
            title,
            first_name,
            surname,
            full_name,
            couple_name,
            address_1,
            address_2,
            address_3,
            town_city,
            postcode,
            telephone,
            email,
            mem_code,
            active,
            fwo,
            fwo_no,
            fellowship_teams,
            elder_names,
            magazine_groups,
            deliverer_names
          `
          )
          .or(
            [
              `first_name.ilike.${like}`,
              `surname.ilike.${like}`,
              `full_name.ilike.${like}`,
            ].join(',')
          )
          .order('surname', { ascending: true })
          .order('first_name', { ascending: true })
          .limit(200);

        if (error) {
          throw error;
        }

        setRows(data ?? []);
      } catch (err) {
        setRows([]);
        setSearchError(err.message || 'Search failed.');
      } finally {
        setLoading(false);
      }
    };

    runSearch();
  }, [trimmedSearch]);

  const titleText = useMemo(() => {
    if (editingId) return 'Edit person';
    return 'Add person';
  }, [editingId]);

  function openMessage(title, message) {
    setMessageModal({ open: true, title, message });
  }

  function closeMessage() {
    setMessageModal({ open: false, title: '', message: '' });
  }

  function openConfirm({ title, message, onConfirm, confirmText = 'Confirm', danger = false }) {
    setConfirmModal({
      open: true,
      title,
      message,
      onConfirm,
      confirmText,
      danger,
    });
  }

  function closeConfirm() {
    setConfirmModal({
      open: false,
      title: '',
      message: '',
      onConfirm: null,
      confirmText: 'Confirm',
      danger: false,
    });
  }

  function resetSearchAndResults() {
    setSearch('');
    setRows([]);
    setSearchError('');
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  async function openEditForm(row) {
    setSaving(false);

    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', row.id)
        .single();

      if (error) throw error;

      setEditingId(data.id);
      setForm({
        title: data.title ?? '',
        first_name: data.first_name ?? '',
        surname: data.surname ?? '',
        couple_name: data.couple_name ?? '',
        care_of: data.care_of ?? '',
        address_1: data.address_1 ?? '',
        address_2: data.address_2 ?? '',
        address_3: data.address_3 ?? '',
        town_city: data.town_city ?? '',
        postcode: data.postcode ?? '',
        telephone: data.telephone ?? '',
        email: data.email ?? '',
        mem_code: data.mem_code ?? '',
        mem_type: data.mem_type ?? '',
        householder: Boolean(data.householder),
        joined_date: data.joined_date ?? '',
        death_date: data.death_date ?? '',
        left_congregation_date: data.left_congregation_date ?? '',
        office_bearer: data.office_bearer ?? '',
        ordained_date: data.ordained_date ?? '',
        admitted_date: data.admitted_date ?? '',
        active: Boolean(data.active),
        fwo: Boolean(data.fwo),
        fwo_no: data.fwo_no ?? '',
        consent_given: Boolean(data.consent_given),
        emergency_contact_label_1: data.emergency_contact_label_1 ?? '',
        emergency_contact_detail_1: data.emergency_contact_detail_1 ?? '',
        emergency_contact_label_2: data.emergency_contact_label_2 ?? '',
        emergency_contact_detail_2: data.emergency_contact_detail_2 ?? '',
        notes: data.notes ?? '',
      });
      setFormOpen(true);
    } catch (err) {
      openMessage('Error', err.message || 'Could not load record.');
    }
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function handleTextChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCheckboxChange(event) {
    const { name, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: checked,
    }));
  }

  function normalisePayload(values) {
    const textOrNull = (value) => {
      const v = String(value ?? '').trim();
      return v === '' ? null : v;
    };

    const dateOrNull = (value) => {
      const v = String(value ?? '').trim();
      return v === '' ? null : v;
    };

    const intOrNull = (value) => {
      const v = String(value ?? '').trim();
      if (v === '') return null;
      const parsed = Number.parseInt(v, 10);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const memCode = textOrNull(values.mem_code);
    const upperMemCode = memCode ? memCode.toUpperCase() : null;

    return {
      title: textOrNull(values.title),
      first_name: textOrNull(values.first_name),
      surname: textOrNull(values.surname),
      couple_name: textOrNull(values.couple_name),
      care_of: textOrNull(values.care_of),
      address_1: textOrNull(values.address_1),
      address_2: textOrNull(values.address_2),
      address_3: textOrNull(values.address_3),
      town_city: textOrNull(values.town_city),
      postcode: textOrNull(values.postcode),
      telephone: textOrNull(values.telephone),
      email: textOrNull(values.email),
      mem_code: upperMemCode,
      mem_type: textOrNull(values.mem_type),
      householder: Boolean(values.householder),
      joined_date: dateOrNull(values.joined_date),
      death_date: dateOrNull(values.death_date),
      left_congregation_date: dateOrNull(values.left_congregation_date),
      office_bearer: textOrNull(values.office_bearer),
      ordained_date: dateOrNull(values.ordained_date),
      admitted_date: dateOrNull(values.admitted_date),
      active: Boolean(values.active),
      fwo: Boolean(values.fwo),
      fwo_no: intOrNull(values.fwo_no),
      consent_given: Boolean(values.consent_given),
      emergency_contact_label_1: textOrNull(values.emergency_contact_label_1),
      emergency_contact_detail_1: textOrNull(values.emergency_contact_detail_1),
      emergency_contact_label_2: textOrNull(values.emergency_contact_label_2),
      emergency_contact_detail_2: textOrNull(values.emergency_contact_detail_2),
      notes: textOrNull(values.notes),
    };
  }

  async function handleSave(event) {
    event.preventDefault();

    const payload = normalisePayload(form);

    if (!payload.first_name && !payload.surname) {
      openMessage('Validation', 'Please enter at least a first name or surname.');
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from('people')
          .update(payload)
          .eq('id', editingId);

        if (error) throw error;

        closeForm();
        resetSearchAndResults();
        openMessage('Saved', 'The record has been updated.');
      } else {
        const { error } = await supabase.from('people').insert(payload);

        if (error) throw error;

        closeForm();
        resetSearchAndResults();
        openMessage('Added', 'The new record has been added.');
      }
    } catch (err) {
      openMessage('Error', err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(row) {
    openConfirm({
      title: 'Delete record',
      message: `Delete ${row.full_name || `${row.first_name || ''} ${row.surname || ''}`.trim() || 'this record'}? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
      onConfirm: async () => {
        closeConfirm();

        try {
          const { error } = await supabase.from('people').delete().eq('id', row.id);
          if (error) throw error;

          resetSearchAndResults();
          openMessage('Deleted', 'The record has been deleted.');
        } catch (err) {
          openMessage('Error', err.message || 'Delete failed.');
        }
      },
    });
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Congregational Roll</h1>
            <p style={styles.subtitle}>Search people, edit records, and manage the main roll.</p>
          </div>

          <button style={styles.primaryButton} onClick={openCreateForm}>
            Add person
          </button>
        </div>

        <div style={styles.searchCard}>
          <label htmlFor="search" style={styles.label}>
            Search by first name or surname
          </label>
          <input
            id="search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Start typing to search..."
            style={styles.input}
          />
          <div style={styles.searchHint}>
            {trimmedSearch
              ? loading
                ? 'Searching...'
                : `${rows.length} result${rows.length === 1 ? '' : 's'}`
              : 'List is empty until you type.'}
          </div>
          {searchError ? <div style={styles.errorText}>{searchError}</div> : null}
        </div>

        <div style={styles.resultsCard}>
          {!trimmedSearch ? (
            <div style={styles.emptyState}>Type into the search box to show matching records.</div>
          ) : loading ? (
            <div style={styles.emptyState}>Loading results...</div>
          ) : rows.length === 0 ? (
            <div style={styles.emptyState}>No matching records found.</div>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Phone</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Address</th>
                    <th style={styles.th}>Fellowship</th>
                    <th style={styles.th}>Magazine</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.nameMain}>
                            {row.full_name || [row.first_name, row.surname].filter(Boolean).join(' ') || '—'}
                          </div>
                          <div style={styles.nameMeta}>
                            {row.active ? 'Active' : 'Inactive'}
                            {row.fwo ? ` • FWO${row.fwo_no ? ` ${row.fwo_no}` : ''}` : ''}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{row.mem_code || '—'}</td>
                      <td style={styles.td}>{row.telephone || '—'}</td>
                      <td style={styles.td}>{row.email || '—'}</td>
                      <td style={styles.td}>
                        {[
                          row.address_1,
                          row.address_2,
                          row.address_3,
                          row.town_city,
                          row.postcode,
                        ]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                      <td style={styles.td}>
                        <div>{row.fellowship_teams || '—'}</div>
                        {row.elder_names ? (
                          <div style={styles.secondaryText}>Elder: {row.elder_names}</div>
                        ) : null}
                      </td>
                      <td style={styles.td}>
                        <div>{row.magazine_groups || '—'}</div>
                        {row.deliverer_names ? (
                          <div style={styles.secondaryText}>Deliverer: {row.deliverer_names}</div>
                        ) : null}
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionRow}>
                          <button style={styles.secondaryButton} onClick={() => openEditForm(row)}>
                            Edit
                          </button>
                          <button
                            style={styles.dangerButton}
                            onClick={() => requestDelete(row)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {formOpen ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{titleText}</h2>
              <button style={styles.iconButton} onClick={closeForm}>
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={styles.formGrid}>
                <Field label="Title">
                  <input name="title" value={form.title} onChange={handleTextChange} style={styles.input} />
                </Field>

                <Field label="First name">
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Surname">
                  <input
                    name="surname"
                    value={form.surname}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Couple name">
                  <input
                    name="couple_name"
                    value={form.couple_name}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Care of">
                  <input
                    name="care_of"
                    value={form.care_of}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Address 1">
                  <input
                    name="address_1"
                    value={form.address_1}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Address 2">
                  <input
                    name="address_2"
                    value={form.address_2}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Address 3">
                  <input
                    name="address_3"
                    value={form.address_3}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Town / City">
                  <input
                    name="town_city"
                    value={form.town_city}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Postcode">
                  <input
                    name="postcode"
                    value={form.postcode}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Telephone">
                  <input
                    name="telephone"
                    value={form.telephone}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Email">
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Membership code">
                  <select
                    name="mem_code"
                    value={form.mem_code}
                    onChange={handleTextChange}
                    style={styles.input}
                  >
                    {MEM_CODE_OPTIONS.map((code) => (
                      <option key={code || 'blank'} value={code}>
                        {code || '—'}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Membership type">
                  <input
                    name="mem_type"
                    value={form.mem_type}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Joined date">
                  <input
                    type="date"
                    name="joined_date"
                    value={form.joined_date}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Death date">
                  <input
                    type="date"
                    name="death_date"
                    value={form.death_date}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Left congregation date">
                  <input
                    type="date"
                    name="left_congregation_date"
                    value={form.left_congregation_date}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Office bearer">
                  <input
                    name="office_bearer"
                    value={form.office_bearer}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Ordained date">
                  <input
                    type="date"
                    name="ordained_date"
                    value={form.ordained_date}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Admitted date">
                  <input
                    type="date"
                    name="admitted_date"
                    value={form.admitted_date}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="FWO number">
                  <input
                    name="fwo_no"
                    value={form.fwo_no}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Emergency contact label 1">
                  <input
                    name="emergency_contact_label_1"
                    value={form.emergency_contact_label_1}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Emergency contact detail 1">
                  <input
                    name="emergency_contact_detail_1"
                    value={form.emergency_contact_detail_1}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Emergency contact label 2">
                  <input
                    name="emergency_contact_label_2"
                    value={form.emergency_contact_label_2}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>

                <Field label="Emergency contact detail 2">
                  <input
                    name="emergency_contact_detail_2"
                    value={form.emergency_contact_detail_2}
                    onChange={handleTextChange}
                    style={styles.input}
                  />
                </Field>
              </div>

              <div style={styles.checkboxGrid}>
                <CheckboxField
                  label="Active"
                  name="active"
                  checked={form.active}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label="Householder"
                  name="householder"
                  checked={form.householder}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label="FWO"
                  name="fwo"
                  checked={form.fwo}
                  onChange={handleCheckboxChange}
                />
                <CheckboxField
                  label="Consent given"
                  name="consent_given"
                  checked={form.consent_given}
                  onChange={handleCheckboxChange}
                />
              </div>

              <Field label="Notes" fullWidth>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleTextChange}
                  style={styles.textarea}
                  rows={5}
                />
              </Field>

              <div style={styles.modalActions}>
                <button type="button" style={styles.secondaryButton} onClick={closeForm}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryButton} disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add person'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {messageModal.open ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalSmall}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{messageModal.title}</h2>
            </div>
            <div style={styles.modalBody}>{messageModal.message}</div>
            <div style={styles.modalActions}>
              <button style={styles.primaryButton} onClick={closeMessage}>
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {confirmModal.open ? (
        <div style={styles.modalOverlay}>
          <div style={styles.modalSmall}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{confirmModal.title}</h2>
            </div>
            <div style={styles.modalBody}>{confirmModal.message}</div>
            <div style={styles.modalActions}>
              <button style={styles.secondaryButton} onClick={closeConfirm}>
                Cancel
              </button>
              <button
                style={confirmModal.danger ? styles.dangerButton : styles.primaryButton}
                onClick={async () => {
                  if (confirmModal.onConfirm) {
                    await confirmModal.onConfirm();
                  }
                }}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children, fullWidth = false }) {
  return (
    <div style={{ ...styles.field, ...(fullWidth ? styles.fullWidth : null) }}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function CheckboxField({ label, name, checked, onChange }) {
  return (
    <label style={styles.checkboxLabel}>
      <input type="checkbox" name={name} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#f4f6f8',
    padding: '24px',
    boxSizing: 'border-box',
    fontFamily: 'Segoe UI, Arial, sans-serif',
    color: '#1f2937',
  },
  container: {
    maxWidth: '1440px',
    margin: '0 auto',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '24px',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 700,
  },
  subtitle: {
    margin: '8px 0 0 0',
    color: '#6b7280',
  },
  searchCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
    marginBottom: '20px',
  },
  resultsCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },
  tableWrap: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '12px',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '13px',
    color: '#6b7280',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eef2f7',
    verticalAlign: 'top',
    fontSize: '14px',
  },
  nameCell: {
    minWidth: '180px',
  },
  nameMain: {
    fontWeight: 600,
  },
  nameMeta: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#6b7280',
  },
  secondaryText: {
    marginTop: '4px',
    fontSize: '12px',
    color: '#6b7280',
  },
  actionRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  primaryButton: {
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryButton: {
    background: '#ffffff',
    color: '#1f2937',
    border: '1px solid #d1d5db',
    borderRadius: '10px',
    padding: '10px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dangerButton: {
    background: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  iconButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '28px',
    lineHeight: 1,
    cursor: 'pointer',
    color: '#6b7280',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    boxSizing: 'border-box',
    fontSize: '14px',
    background: '#fff',
    outline: 'none',
    color: '#000',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    boxSizing: 'border-box',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit',
    color: '#000',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '6px',
    color: '#374151',
  },
  searchHint: {
    marginTop: '8px',
    fontSize: '13px',
    color: '#6b7280',
  },
  errorText: {
    marginTop: '10px',
    color: '#b91c1c',
    fontSize: '13px',
  },
  emptyState: {
    padding: '32px 12px',
    textAlign: 'center',
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.42)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modalLarge: {
    width: 'min(1100px, 100%)',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#ffffff',
    borderRadius: '18px',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
    padding: '24px',
  },
  modalSmall: {
    width: 'min(520px, 100%)',
    background: '#ffffff',
    borderRadius: '18px',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
    padding: '24px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 700,
  },
  modalBody: {
    color: '#374151',
    lineHeight: 1.5,
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '20px',
    flexWrap: 'wrap',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
  },
  field: {
    minWidth: 0,
  },
  fullWidth: {
    gridColumn: '1 / -1',
    marginTop: '14px',
  },
  checkboxGrid: {
    display: 'flex',
    gap: '18px',
    flexWrap: 'wrap',
    marginTop: '18px',
  },
  checkboxLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
  },
};

export default App;