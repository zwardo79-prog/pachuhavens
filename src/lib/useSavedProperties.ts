import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

const GUEST_STORAGE_KEY = 'pachu_saved_properties';

function readGuestSaved(): Set<string> {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch {
    return new Set();
  }
}

function writeGuestSaved(ids: Set<string>) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // localStorage unavailable (e.g. private browsing) — guest saves just won't persist.
  }
}

/**
 * Saved properties work for everyone: guests get a device-local list (localStorage),
 * logged-in users get it synced via Supabase. The first time a guest with local saves
 * logs in, those saves are merged into their account and the local copy is cleared.
 */
export function useSavedProperties() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const mergedForUserId = useRef<string | null>(null);

  const loadFromSupabase = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('favorites').select('property_id').eq('user_id', userId);
    if (error) return new Set<string>();
    return new Set((data ?? []).map((row) => row.property_id as string));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);

    if (!user) {
      setSavedIds(readGuestSaved());
      setLoading(false);
      return;
    }

    if (mergedForUserId.current !== user.id) {
      const guestIds = readGuestSaved();
      if (guestIds.size > 0) {
        const rows = Array.from(guestIds).map((property_id) => ({ user_id: user.id, property_id }));
        await supabase.from('favorites').upsert(rows, { onConflict: 'user_id,property_id', ignoreDuplicates: true });
        writeGuestSaved(new Set());
      }
      mergedForUserId.current = user.id;
    }

    const remoteIds = await loadFromSupabase(user.id);
    setSavedIds(remoteIds);
    setLoading(false);
  }, [user, loadFromSupabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async (propertyId: string): Promise<'saved' | 'removed' | 'error'> => {
    const isSaved = savedIds.has(propertyId);

    if (!user) {
      const next = new Set(savedIds);
      if (isSaved) next.delete(propertyId); else next.add(propertyId);
      writeGuestSaved(next);
      setSavedIds(next);
      return isSaved ? 'removed' : 'saved';
    }

    if (isSaved) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('property_id', propertyId);
      if (error) return 'error';
      setSavedIds((current) => {
        const next = new Set(current);
        next.delete(propertyId);
        return next;
      });
      return 'removed';
    }
    const { error } = await supabase.from('favorites').insert({ user_id: user.id, property_id: propertyId });
    if (error) return 'error';
    setSavedIds((current) => new Set(current).add(propertyId));
    return 'saved';
  }, [user, savedIds]);

  return { savedIds, loading, toggle, reload: load, isGuest: !user };
}
