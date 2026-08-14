import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';

export function useSavedProperties() {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSavedIds(new Set());
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('saved_properties').select('property_id').eq('user_id', user.id);
    if (error) {
      setLoading(false);
      return;
    }
    setSavedIds(new Set((data ?? []).map((row) => row.property_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = useCallback(async (propertyId: string): Promise<'saved' | 'removed' | 'unauthorized' | 'error'> => {
    if (!user) return 'unauthorized';
    const isSaved = savedIds.has(propertyId);
    if (isSaved) {
      const { error } = await supabase.from('saved_properties').delete().eq('user_id', user.id).eq('property_id', propertyId);
      if (error) return 'error';
      setSavedIds((current) => {
        const next = new Set(current);
        next.delete(propertyId);
        return next;
      });
      return 'removed';
    }
    const { error } = await supabase.from('saved_properties').insert({ user_id: user.id, property_id: propertyId });
    if (error) return 'error';
    setSavedIds((current) => new Set(current).add(propertyId));
    return 'saved';
  }, [user, savedIds]);

  return { savedIds, loading, toggle, reload: load };
}
