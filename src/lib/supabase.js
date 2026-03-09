import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tmaaqcxgcdavemvjkcdl.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MyBbzIdIAbKAAlaNyQknNA_A1qmp3Em';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Generic CRUD helpers ──────────────────────────────────────────
export const db = {
  async getAll(table) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error(`getAll ${table}:`, error); return []; }
    return data || [];
  },

  async insert(table, row) {
    const { data, error } = await supabase
      .from(table)
      .insert([{ ...row, created_at: new Date().toISOString() }])
      .select()
      .single();
    if (error) { console.error(`insert ${table}:`, error); return null; }
    return data;
  },

  async update(table, id, updates) {
    const { data, error } = await supabase
      .from(table)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error(`update ${table}:`, error); return null; }
    return data;
  },

  async remove(table, id) {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) { console.error(`remove ${table}:`, error); return false; }
    return true;
  },

  async updateMany(table, ids, updates) {
    const { error } = await supabase
      .from(table)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ids);
    if (error) { console.error(`updateMany ${table}:`, error); return false; }
    return true;
  }
};
