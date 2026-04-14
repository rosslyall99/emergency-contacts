import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables. Check your .env.local or Vercel settings.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_NAME = 'emergencyContacts';

const cardStyle = {
  background: '#aa3bff2c',
  border: '1px solid #000000',
  borderRadius: '8px',
  padding: '16px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #000000',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#000000',
  background: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonStyle = {
  padding: '8px 14px',
  border: '1px solid #000000',
  borderRadius: '8px',
  background: '#aa3bff',
  color: '#fff',
  fontSize: '14px',
  cursor: 'pointer',
};

const disabledButtonStyle = {
  ...buttonStyle,
  opacity: 0.45,
  cursor: 'not-allowed',
};

function safe(value) {
  return value ?? '';
}

function displayValue(value) {
  return value === null || value === undefined || value === '' ? '' : String(value);
}

function addressLine(record) {
  return [record?.Address1, record?.Address2, record?.Address3, record?.Town, record?.Postcode]
    .filter(Boolean)
    .join(', ');
}

function makeEditableRecord(record) {
  if (!record) return null;
  return {
    id: safe(record.id),
    ChrName: safe(record.ChrName),
    Surname: safe(record.Surname),
    Address1: safe(record.Address1),
    Address2: safe(record.Address2),
    Address3: safe(record.Address3),
    Town: safe(record.Town),
    Postcode: safe(record.Postcode),
    'Tel No': safe(record['Tel No']),
    'Email Address': safe(record['Email Address']),
    'Emergency Contact Info 1': safe(record['Emergency Contact Info 1']),
    'Emergency Contact Detail 1': safe(record['Emergency Contact Detail 1']),
    'Emergency Contact Info 2': safe(record['Emergency Contact Info 2']),
    'Emergency Contact Detail 2': safe(record['Emergency Contact Detail 2']),
  };
}

function makeBlankRecord() {
  return {
    id: '',
    ChrName: '',
    Surname: '',
    Address1: '',
    Address2: '',
    Address3: '',
    Town: '',
    Postcode: '',
    'Tel No': '',
    'Email Address': '',
    'Emergency Contact Info 1': '',
    'Emergency Contact Detail 1': '',
    'Emergency Contact Info 2': '',
    'Emergency Contact Detail 2': '',
  };
}

const selectColumns = `
  id,
  "ChrName",
  "Surname",
  "Address1",
  "Address2",
  "Address3",
  "Town",
  "Postcode",
  "Tel No",
  "Email Address",
  "Emergency Contact Info 1",
  "Emergency Contact Detail 1",
  "Emergency Contact Info 2",
  "Emergency Contact Detail 2"
`;

export default function EmergencyContactsPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editable, setEditable] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (isAddingNew) {
      setEditable(makeBlankRecord());
      setIsEditing(true);
      return;
    }

    if (!selected) {
      setEditable(null);
      setIsEditing(false);
      return;
    }

    setEditable(makeEditableRecord(selected));
    setIsEditing(false);
  }, [selected, isAddingNew]);

  const resetSearchState = () => {
    setQuery('');
    setSearchAttempted(false);
    setResults([]);
    setSelected(null);
    setEditable(null);
    setIsEditing(false);
    setIsAddingNew(false);
    setError('');
    setSaveMessage('');
    setLoading(false);
  };

  const runSearch = async (searchText) => {
    if (isAddingNew) return;

    const value = (searchText ?? '').trim();

    if (value.length === 0) {
      setSearchAttempted(false);
      setResults([]);
      setSelected(null);
      setEditable(null);
      setIsEditing(false);
      setError('');
      setSaveMessage('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearchAttempted(true);
    setSelected(null);
    setEditable(null);
    setIsEditing(false);
    setSaveMessage('');
    setError('');

    const { data, error: searchError } = await supabase
      .from(TABLE_NAME)
      .select(selectColumns)
      .or(`"ChrName".ilike.%${value}%,"Surname".ilike.%${value}%`)
      .order('Surname', { ascending: true })
      .order('ChrName', { ascending: true })
      .limit(50);

    if (searchError) {
      setResults([]);
      setError(searchError.message || 'Search failed.');
      setLoading(false);
      return;
    }

    setResults(data || []);
    setLoading(false);
  };

  const handleFieldChange = (field, value) => {
    setEditable((current) => ({ ...current, [field]: value }));
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setSelected(null);
    setEditable(makeBlankRecord());
    setIsEditing(true);
    setSaveMessage('');
    setError('');
  };

  const cancelEdit = () => {
    if (isAddingNew) {
      resetSearchState();
      return;
    }

    setEditable(makeEditableRecord(selected));
    setIsEditing(false);
    setSaveMessage('');
    setError('');
  };

  const createRecord = async () => {
    if (!editable) return;

    setSaving(true);
    setError('');
    setSaveMessage('');

    const payload = {
      ChrName: editable.ChrName,
      Surname: editable.Surname,
      Address1: editable.Address1,
      Address2: editable.Address2,
      Address3: editable.Address3,
      Town: editable.Town,
      Postcode: editable.Postcode,
      'Tel No': editable['Tel No'],
      'Email Address': editable['Email Address'],
      'Emergency Contact Info 1': editable['Emergency Contact Info 1'],
      'Emergency Contact Detail 1': editable['Emergency Contact Detail 1'],
      'Emergency Contact Info 2': editable['Emergency Contact Info 2'],
      'Emergency Contact Detail 2': editable['Emergency Contact Detail 2'],
    };

    const { error: insertError } = await supabase
      .from(TABLE_NAME)
      .insert(payload);

    if (insertError) {
      setError(insertError.message || 'Create failed.');
      setSaving(false);
      return;
    }

    alert('Record created successfully.');
    setSaving(false);
    resetSearchState();
  };

  const updateRecord = async () => {
    if (!editable) return;

    setSaving(true);
    setError('');
    setSaveMessage('');

    const payload = {
      ChrName: editable.ChrName,
      Surname: editable.Surname,
      Address1: editable.Address1,
      Address2: editable.Address2,
      Address3: editable.Address3,
      Town: editable.Town,
      Postcode: editable.Postcode,
      'Tel No': editable['Tel No'],
      'Email Address': editable['Email Address'],
      'Emergency Contact Info 1': editable['Emergency Contact Info 1'],
      'Emergency Contact Detail 1': editable['Emergency Contact Detail 1'],
      'Emergency Contact Info 2': editable['Emergency Contact Info 2'],
      'Emergency Contact Detail 2': editable['Emergency Contact Detail 2'],
    };

    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', Number(editable.id));

    if (updateError) {
      setError(updateError.message || 'Save failed.');
      setSaving(false);
      return;
    }

    setSaving(false);
    resetSearchState();
  };

  const saveChanges = async () => {
    if (isAddingNew) {
      await createRecord();
      return;
    }

    await updateRecord();
  };

  const deleteRecord = async () => {
    if (!selected?.id) return;

    const confirmDelete = window.confirm(
      `Delete ${displayValue(selected.ChrName)} ${displayValue(selected.Surname)}? This cannot be undone.`
    );

    if (!confirmDelete) return;

    setDeleting(true);
    setError('');
    setSaveMessage('');

    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', Number(selected.id));

    if (deleteError) {
      setError(deleteError.message || 'Delete failed.');
      setDeleting(false);
      return;
    }

    setDeleting(false);
    resetSearchState();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#000000',
        padding: '24px',
        fontFamily: 'Arial, Helvetica, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ fontSize: '28px', margin: '0 0 20px 0', fontWeight: 700 }}>
          EMERGENCY CONTACTS
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 700 }}>
            Search by Christian name or surname
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                runSearch(value);
              }}
              placeholder="Enter Christian name or surname"
              style={{ ...inputStyle, maxWidth: '420px' }}
              disabled={isAddingNew}
            />
            <button
              type="button"
              onClick={startAddNew}
              style={saving || deleting ? disabledButtonStyle : buttonStyle}
              disabled={saving || deleting}
            >
              Add New
            </button>
          </div>

          {loading && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <Loader2 size={16} className="animate-spin" />
              Searching...
            </div>
          )}

          {error && !loading && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </div>

        {!isAddingNew && searchAttempted && !loading && results.length > 0 && (
          <div style={{ ...cardStyle, marginTop: '18px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 80px 1fr 1.6fr',
                borderBottom: '1px solid #000000',
                paddingBottom: '8px',
                fontWeight: 700,
                gap: '10px',
              }}
            >
              <div>Select</div>
              <div>ID</div>
              <div>Name</div>
              <div>Address</div>
            </div>

            <div>
              {results.map((row, index) => {
                const isSelected = selected?.id === row.id;
                return (
                  <div
                    key={row.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '110px 80px 1fr 1.6fr',
                      gap: '10px',
                      padding: '10px 0',
                      borderBottom: index === results.length - 1 ? 'none' : '1px solid #d4d4d4',
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(row);
                          setError('');
                          setSaveMessage('');
                        }}
                        style={{
                          ...buttonStyle,
                          width: '90px',
                          background: isSelected ? '#aa3bff' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#000000',
                        }}
                      >
                        Select
                      </button>
                    </div>
                    <div>{displayValue(row.id)}</div>
                    <div>{`${displayValue(row.ChrName)} ${displayValue(row.Surname)}`.trim()}</div>
                    <div>{addressLine(row)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!isAddingNew && searchAttempted && !loading && results.length === 0 && !error && (
          <div style={{ ...cardStyle, marginTop: '18px' }}>No matching records found.</div>
        )}

        {editable && (
          <div style={{ ...cardStyle, marginTop: '18px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '28px',
                alignItems: 'start',
              }}
            >
              <div style={{ minWidth: 0 }}>
                {!isAddingNew && <Field label="ID" value={editable.id} readOnly />}
                <Field
                  label="Christian Name"
                  value={editable.ChrName}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('ChrName', value)}
                />
                <Field
                  label="Surname"
                  value={editable.Surname}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Surname', value)}
                />
                <Field
                  label="Address1"
                  value={editable.Address1}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Address1', value)}
                />
                <Field
                  label="Address2"
                  value={editable.Address2}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Address2', value)}
                />
                <Field
                  label="Address3"
                  value={editable.Address3}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Address3', value)}
                />
                <Field
                  label="City"
                  value={editable.Town}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Town', value)}
                />
                <Field
                  label="Postcode"
                  value={editable.Postcode}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Postcode', value)}
                />
                <Field
                  label="Phone"
                  value={editable['Tel No']}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Tel No', value)}
                />
                <Field
                  label="Email"
                  value={editable['Email Address']}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Email Address', value)}
                />
              </div>

              <div style={{ minWidth: 0, textAlign: 'left' }}>
                <SectionTitle>Emergency Contact 1</SectionTitle>
                <Field
                  label="Name"
                  value={editable['Emergency Contact Info 1']}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Emergency Contact Info 1', value)}
                />
                <Field
                  label="Phone"
                  value={editable['Emergency Contact Detail 1']}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Emergency Contact Detail 1', value)}
                />

                <div style={{ height: '18px' }} />

                <SectionTitle>Emergency Contact 2</SectionTitle>
                <Field
                  label="Name"
                  value={editable['Emergency Contact Info 2']}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Emergency Contact Info 2', value)}
                />
                <Field
                  label="Phone"
                  value={editable['Emergency Contact Detail 2']}
                  readOnly={!isEditing}
                  onChange={(value) => handleFieldChange('Emergency Contact Detail 2', value)}
                />
              </div>
            </div>

            {saveMessage && <div style={{ marginTop: '16px', fontSize: '14px' }}>{saveMessage}</div>}

            {isAddingNew && (
              <div style={{ marginTop: '16px', fontSize: '14px' }}>
                Enter the new contact details, then click Save.
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
              {!isAddingNew && (
                <button
                  type="button"
                  style={deleting ? disabledButtonStyle : buttonStyle}
                  onClick={deleteRecord}
                  disabled={deleting || saving || !selected}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              )}

              {!isEditing ? (
                !isAddingNew && (
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={() => {
                      setIsEditing(true);
                      setSaveMessage('');
                      setError('');
                    }}
                  >
                    Edit
                  </button>
                )
              ) : (
                <>
                  <button
                    type="button"
                    style={saving ? disabledButtonStyle : buttonStyle}
                    onClick={saveChanges}
                    disabled={saving || deleting}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    style={buttonStyle}
                    onClick={cancelEdit}
                    disabled={saving || deleting}
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontWeight: 700, marginBottom: '10px', fontSize: '16px' }}>{children}</div>;
}

function Field({ label, value, readOnly, onChange }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '150px minmax(0, 1fr)',
        gap: '12px',
        alignItems: 'center',
        marginBottom: '10px',
        width: '100%',
      }}
    >
      <div style={{ fontWeight: 400, textAlign: 'left' }}>{label}</div>
      <input
        value={displayValue(value)}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        style={{
          ...inputStyle,
          background: readOnly ? '#ffffff' : '#f8f8f8',
        }}
      />
    </div>
  );
}