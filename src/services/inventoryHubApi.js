import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:3001' });

// ── 1. Fetch all companies ────────────────────────────────────────────────────
export async function getCompanies() {
  const res = await API.get('/companies');
  return res.data;
}

// ── 2. Fetch config for a specific company ────────────────────────────────────
export async function getCompanyConfig(companyId) {
  const res = await API.get('/company_configs', { params: { company_id: companyId } });
  return res.data[0] || null;
}

// ── 3. Trigger import (CSV / Sheets / ERP) ───────────────────────────────────
// JSON Server can't parse files — stats are simulated.
// The operation is still logged to /import_logs as a real POST.
export async function triggerImport(sourceType, companyId) {
  await new Promise(r => setTimeout(r, 1400));

  if (Math.random() > 0.15) {
    const stats = {
      total_received: Math.floor(Math.random() * 500) + 50,
      created:        Math.floor(Math.random() * 200) + 10,
      updated:        Math.floor(Math.random() * 100) + 5,
      skipped:        Math.floor(Math.random() * 30),
      errors:         Math.random() > 0.7
        ? ['Row 12: Invalid unit code format', 'Row 45: Duplicate entry detected']
        : [],
    };
    await API.post('/import_logs', {
      company_id:  companyId,
      source_type: sourceType,
      status:      'success',
      stats,
      timestamp:   new Date().toISOString(),
    });
    return { success: true, stats };
  } else {
    const error = `${sourceType.toUpperCase()} endpoint returned 503.`;
    await API.post('/import_logs', {
      company_id:  companyId,
      source_type: sourceType,
      status:      'failed',
      error,
      timestamp:   new Date().toISOString(),
    });
    return { success: false, error };
  }
}

// ── 4. Trigger bulk rename ────────────────────────────────────────────────────
// Same pattern: stats simulated, operation logged to /import_logs.
export async function triggerRename(companyId) {
  await new Promise(r => setTimeout(r, 1200));

  if (Math.random() > 0.1) {
    const stats = {
      renamed:             Math.floor(Math.random() * 80) + 5,
      skipped_not_found:   Math.floor(Math.random() * 10),
      skipped_duplicate:   Math.floor(Math.random() * 5),
      errors:              [],
    };
    await API.post('/import_logs', {
      company_id:  companyId,
      source_type: 'rename',
      status:      'success',
      stats,
      timestamp:   new Date().toISOString(),
    });
    return { success: true, stats };
  } else {
    const error = 'CSV parsing failed: unexpected column header.';
    await API.post('/import_logs', {
      company_id:  companyId,
      source_type: 'rename',
      status:      'failed',
      error,
      timestamp:   new Date().toISOString(),
    });
    return { success: false, error };
  }
}

// ── 5. Delete units by unit_code list ────────────────────────────────────────
// Real deletion: finds each unit in /units then DELETEs by id.
export async function executeDelete(unitCodes, companyId) {
  let deleted_count   = 0;
  let not_found_count = 0;

  for (const code of unitCodes) {
    const res = await API.get('/units', {
      params: { unit_code: code, company_id: companyId },
    });
    const match = res.data.find(
      u => u.unit_code.trim().toLowerCase() === code.trim().toLowerCase()
    );
    if (match) {
      await API.delete(`/units/${match.id}`);
      deleted_count++;
    } else {
      not_found_count++;
    }
  }

  return { success: true, deleted_count, not_found_count };
}