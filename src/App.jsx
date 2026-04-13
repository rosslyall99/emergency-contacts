import React, { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Replace with your real Supabase project values.
const SUPABASE_URL = 'https://khjghnczygqvuywgdxzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoamdobmN6eWdxdnV5d2dkeHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODU4NDgsImV4cCI6MjA5MTY2MTg0OH0.eBHc-kAMEBKZ90lvK5KhiKpx2G4k1vFJ5La8aHWB214';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE_NAME = 'emergencyContacts';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #000000',
  borderRadius: '0',
  padding: '16px',
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #000000',
  borderRadius: '0',
  fontSize: '14px',
  color: '#000000',
  background: '#ffffff',
  outline: 'none',
};

const buttonStyle = {
  padding: '8px 14px',
  border: '1px solid #000000',
  borderRadius: '0',
  background: '#ffffff',
  color: '#000000',
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

export default function EmergencyContactsPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editable, setEditable] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (!selected) {
      setEditable(null);
      setIsEditing(false);
      return;
    }
    setEditable(makeEditableRecord(selected));
    setIsEditing(false);
  }, [selected]);

  const runSearch = async () => {
    if (trimmedQuery.length < 2) {
      setSearchAttempted(true);
      setResults([]);
      setSelected(null);
      setError('Please enter at least 2 letters.');
      return;
    }

    setLoading(true);
    setSearchAttempted(true);
    setSelected(null);
    setEditable(null);
    setIsEditing(false);
    setError('');

    const { data, error: searchError } = await supabase
      .from(TABLE_NAME)
      .select(
        `
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
        `
      )
      .or(`"ChrName".ilike.%${trimmedQuery}%,"Surname".ilike.%${trimmedQuery}%`)
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

  const cancelEdit = () => {
    setEditable(makeEditableRecord(selected));
    setIsEditing(false);
    setSaveMessage('');
  };

  const saveChanges = async () => {
    if (!editable) return;

    setSaving(true);
    setError('');
    setSaveMessage('');

    const payload = {
      'ChrName': editable.ChrName,
      'Surname': editable.Surname,
      'Address1': editable.Address1,
      'Address2': editable.Address2,
      'Address3': editable.Address3,
      'Town': editable.Town,
      'Postcode': editable.Postcode,
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

    const updatedRow = {
      ...selected,
      ...payload,
      id: Number(editable.id),
    };

    setSelected(updatedRow);
    setEditable(makeEditableRecord(updatedRow));
    setResults((current) =>
      current.map((row) => (Number(row.id) === Number(updatedRow.id) ? updatedRow : row))
    );
    setIsEditing(false);
    setSaveMessage('Record saved successfully.');
    setSaving(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', color: '#000000', padding: '24px', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 20px 0', fontWeight: 700 }}>EMERGENCY CONTACTS</h1>

        <div style={cardStyle}>
          <div style={{ fontSize: '16px', marginBottom: '10px', fontWeight: 700 }}>Search by Christian name or surname</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Christian name or surname"
              style={{ ...inputStyle, maxWidth: '420px' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runSearch();
              }}
            />
            <button type="button" onClick={runSearch} style={buttonStyle}>Search</button>
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

        {searchAttempted && !loading && results.length > 0 && (
          <div style={{ ...cardStyle, marginTop: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '110px 80px 1fr 1.6fr', borderBottom: '1px solid #000000', paddingBottom: '8px', fontWeight: 700, gap: '10px' }}>
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
                        }}
                        style={{
                          ...buttonStyle,
                          width: '90px',
                          background: isSelected ? '#000000' : '#ffffff',
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

        {searchAttempted && !loading && results.length === 0 && !error && (
          <div style={{ ...cardStyle, marginTop: '18px' }}>
            No matching records found.
          </div>
        )}

        {selected && editable && (
          <div style={{ ...cardStyle, marginTop: '18px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '28px', alignItems: 'start' }}>
              <div>
                <Field label="ID" value={editable.id} readOnly />
                <Field label="Christian Name" value={editable.ChrName} readOnly={!isEditing} onChange={(value) => handleFieldChange('ChrName', value)} />
                <Field label="Surname" value={editable.Surname} readOnly={!isEditing} onChange={(value) => handleFieldChange('Surname', value)} />
                <Field label="Address1" value={editable.Address1} readOnly={!isEditing} onChange={(value) => handleFieldChange('Address1', value)} />
                <Field label="Address2" value={editable.Address2} readOnly={!isEditing} onChange={(value) => handleFieldChange('Address2', value)} />
                <Field label="Address3" value={editable.Address3} readOnly={!isEditing} onChange={(value) => handleFieldChange('Address3', value)} />
                <Field label="City" value={editable.Town} readOnly={!isEditing} onChange={(value) => handleFieldChange('Town', value)} />
                <Field label="Postcode" value={editable.Postcode} readOnly={!isEditing} onChange={(value) => handleFieldChange('Postcode', value)} />
                <Field label="Phone" value={editable['Tel No']} readOnly={!isEditing} onChange={(value) => handleFieldChange('Tel No', value)} />
                <Field label="Email" value={editable['Email Address']} readOnly={!isEditing} onChange={(value) => handleFieldChange('Email Address', value)} />
              </div>

              <div>
                <SectionTitle>Emergency Contact 1</SectionTitle>
                <Field label="Name" value={editable['Emergency Contact Info 1']} readOnly={!isEditing} onChange={(value) => handleFieldChange('Emergency Contact Info 1', value)} />
                <Field label="Phone" value={editable['Emergency Contact Detail 1']} readOnly={!isEditing} onChange={(value) => handleFieldChange('Emergency Contact Detail 1', value)} />

                <div style={{ height: '18px' }} />

                <SectionTitle>Emergency Contact 2</SectionTitle>
                <Field label="Name" value={editable['Emergency Contact Info 2']} readOnly={!isEditing} onChange={(value) => handleFieldChange('Emergency Contact Info 2', value)} />
                <Field label="Phone" value={editable['Emergency Contact Detail 2']} readOnly={!isEditing} onChange={(value) => handleFieldChange('Emergency Contact Detail 2', value)} />
              </div>
            </div>

            {saveMessage && (
              <div style={{ marginTop: '16px', fontSize: '14px' }}>{saveMessage}</div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '22px', flexWrap: 'wrap' }}>
              <button type="button" style={disabledButtonStyle} disabled>Delete</button>
              {!isEditing ? (
                <button type="button" style={buttonStyle} onClick={() => {
                  setIsEditing(true);
                  setSaveMessage('');
                }}>Edit</button>
              ) : (
                <>
                  <button
                    type="button"
                    style={saving ? disabledButtonStyle : buttonStyle}
                    onClick={saveChanges}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" style={buttonStyle} onClick={cancelEdit} disabled={saving}>Cancel</button>
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
    <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
      <div style={{ fontWeight: 400 }}>{label}</div>
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
