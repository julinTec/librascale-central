import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays } from 'date-fns';

export type NotifCategory = 'eventos' | 'agenda' | 'intakes' | 'financeiro';

export interface NotifItem {
  id: string; // categoria:entidade:tipo
  category: NotifCategory;
  title: string;
  subtitle?: string;
  href: string;
  date?: string;
}

export interface NotifGroup {
  category: NotifCategory;
  label: string;
  items: NotifItem[];
}

const CATEGORY_LABEL: Record<NotifCategory, string> = {
  eventos: 'Eventos',
  agenda: 'Agenda',
  intakes: 'Pré-cadastros',
  financeiro: 'Financeiro',
};

const fmtDate = (d?: string | null) =>
  d ? format(new Date(d + 'T12:00:00'), 'dd/MM/yyyy') : '';

function timesOverlap(s1: string, e1: string, s2: string, e2: string) {
  return s1 < e2 && s2 < e1;
}

export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  const storageKey = user ? `notif_seen_${user.id}` : null;

  // load seen from localStorage
  useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setSeenIds(new Set(JSON.parse(raw)));
    } catch {}
  }, [storageKey]);

  const load = useCallback(async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const in7 = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    const in3 = format(addDays(new Date(), 3), 'yyyy-MM-dd');
    const in2 = format(addDays(new Date(), 2), 'yyyy-MM-dd');

    const [evtsRes, sessionsNextRes, sessionsTodayRes, sessionsPastRes, sessionsConflictRes, assignsRes, intakesRecRes, intakesExpRes, recRes, payRes] = await Promise.all([
      supabase.from('events')
        .select('id, event_name, start_date, status')
        .gte('start_date', today).lte('start_date', in7)
        .not('status', 'in', '(cancelado,realizado)'),
      supabase.from('event_sessions')
        .select('id, title, session_date, start_time, end_time, status, event_id, interpreter_id:event_id, events(event_name)')
        .gte('session_date', today).lte('session_date', in3)
        .neq('status', 'cancelada'),
      supabase.from('event_sessions')
        .select('id, title, session_date, status, events(event_name)')
        .eq('session_date', today).eq('status', 'agendada'),
      supabase.from('event_sessions')
        .select('id, title, session_date, status, events(event_name)')
        .lt('session_date', today)
        .in('status', ['agendada', 'confirmada']),
      supabase.from('event_sessions')
        .select('id, session_date, start_time, end_time, status, events(event_name)')
        .gte('session_date', today)
        .neq('status', 'cancelada'),
      supabase.from('event_assignments')
        .select('session_id, interpreter_id, interpreters(full_name)'),
      supabase.from('quote_intakes' as any)
        .select('id, requester_name, company_name, event_name, submitted_at')
        .eq('status', 'recebido'),
      supabase.from('quote_intakes' as any)
        .select('id, requester_name, company_name, expires_at')
        .eq('status', 'aguardando')
        .lte('expires_at', new Date(Date.now() + 2 * 86400000).toISOString()),
      supabase.from('event_receivables')
        .select('id, description, amount, due_date, status, events(event_name)')
        .lt('due_date', today)
        .in('status', ['pendente', 'vencido']),
      supabase.from('event_payables')
        .select('id, description, amount, due_date, status, events(event_name), interpreters(full_name)')
        .lt('due_date', today)
        .in('status', ['pendente', 'vencido']),
    ]);

    const evts = evtsRes.data || [];
    const sessionsNext = sessionsNextRes.data || [];
    const sessionsToday = sessionsTodayRes.data || [];
    const sessionsPast = sessionsPastRes.data || [];
    const sessionsConflict = sessionsConflictRes.data || [];
    const assigns = assignsRes.data || [];
    const intakesRec = (intakesRecRes.data as any[]) || [];
    const intakesExp = (intakesExpRes.data as any[]) || [];
    const recs = recRes.data || [];
    const pays = payRes.data || [];

    // Eventos sem agenda: buscar event_sessions que pertencem aos events listados
    const evtIds = evts.map(e => e.id);
    let sessionsForEvents: { event_id: string }[] = [];
    if (evtIds.length) {
      const { data } = await supabase.from('event_sessions').select('event_id').in('event_id', evtIds);
      sessionsForEvents = data || [];
    }
    const eventsWithSessions = new Set(sessionsForEvents.map(s => s.event_id));

    const out: NotifItem[] = [];

    // Eventos
    evts.forEach(ev => {
      if (ev.start_date === today) {
        out.push({
          id: `eventos:${ev.id}:hoje`, category: 'eventos',
          title: `"${ev.event_name}" inicia hoje`,
          href: '/eventos', date: ev.start_date,
        });
      } else {
        out.push({
          id: `eventos:${ev.id}:proximo`, category: 'eventos',
          title: `"${ev.event_name}" inicia em ${fmtDate(ev.start_date)}`,
          href: '/eventos', date: ev.start_date,
        });
      }
      if (!eventsWithSessions.has(ev.id)) {
        out.push({
          id: `eventos:${ev.id}:sem-agenda`, category: 'eventos',
          title: `"${ev.event_name}" sem nenhuma agenda criada`,
          subtitle: `Início: ${fmtDate(ev.start_date)}`,
          href: '/eventos', date: ev.start_date,
        });
      }
    });

    // Agenda — sessões próximas sem profissional alocado
    const sessionIdsWithAssign = new Set(assigns.map(a => a.session_id));
    sessionsNext.forEach((s: any) => {
      if (!sessionIdsWithAssign.has(s.id)) {
        out.push({
          id: `agenda:${s.id}:sem-prof`, category: 'agenda',
          title: `Sessão sem profissional alocado`,
          subtitle: `${(s.events as any)?.event_name || s.title || '—'} • ${fmtDate(s.session_date)}`,
          href: '/agenda', date: s.session_date,
        });
      }
    });

    // Agenda — hoje agendada (pendente confirmação)
    sessionsToday.forEach((s: any) => {
      out.push({
        id: `agenda:${s.id}:pendente-confirm`, category: 'agenda',
        title: `Sessão hoje pendente de confirmação`,
        subtitle: `${(s.events as any)?.event_name || s.title || '—'}`,
        href: '/agenda', date: s.session_date,
      });
    });

    // Agenda — passadas sem execução
    sessionsPast.forEach((s: any) => {
      out.push({
        id: `agenda:${s.id}:sem-execucao`, category: 'agenda',
        title: `Sessão passada sem registro de execução`,
        subtitle: `${(s.events as any)?.event_name || s.title || '—'} • ${fmtDate(s.session_date)}`,
        href: '/agenda', date: s.session_date,
      });
    });

    // Agenda — conflitos por profissional
    // mapear assignment -> session details
    const sessionMap = new Map<string, any>();
    sessionsConflict.forEach((s: any) => sessionMap.set(s.id, s));
    const byInterp = new Map<string, { date: string; start: string; end: string; sessionId: string; interpName: string }[]>();
    assigns.forEach((a: any) => {
      const s = sessionMap.get(a.session_id);
      if (!s) return;
      const arr = byInterp.get(a.interpreter_id) || [];
      arr.push({
        date: s.session_date,
        start: s.start_time,
        end: s.end_time,
        sessionId: s.id,
        interpName: (a.interpreters as any)?.full_name || 'Profissional',
      });
      byInterp.set(a.interpreter_id, arr);
    });
    const reportedConflicts = new Set<string>();
    byInterp.forEach((list, interpId) => {
      const byDate = new Map<string, typeof list>();
      list.forEach(l => {
        const arr = byDate.get(l.date) || [];
        arr.push(l);
        byDate.set(l.date, arr);
      });
      byDate.forEach((dayList) => {
        for (let i = 0; i < dayList.length; i++) {
          for (let j = i + 1; j < dayList.length; j++) {
            if (timesOverlap(dayList[i].start, dayList[i].end, dayList[j].start, dayList[j].end)) {
              const key = `agenda:${interpId}:${dayList[i].date}:conflito`;
              if (!reportedConflicts.has(key)) {
                reportedConflicts.add(key);
                out.push({
                  id: key, category: 'agenda',
                  title: `Conflito de horário: ${dayList[i].interpName}`,
                  subtitle: `${fmtDate(dayList[i].date)} • sessões sobrepostas`,
                  href: '/agenda', date: dayList[i].date,
                });
              }
            }
          }
        }
      });
    });

    // Intakes
    intakesRec.forEach(it => {
      out.push({
        id: `intakes:${it.id}:recebido`, category: 'intakes',
        title: `Pré-cadastro devolvido`,
        subtitle: `${it.requester_name || it.company_name || 'Cliente'}${it.event_name ? ' • ' + it.event_name : ''}`,
        href: '/orcamentos',
      });
    });
    intakesExp.forEach(it => {
      out.push({
        id: `intakes:${it.id}:expirando`, category: 'intakes',
        title: `Link de pré-cadastro expirando em breve`,
        subtitle: `${it.requester_name || it.company_name || 'Cliente'}`,
        href: '/orcamentos',
      });
    });

    // Financeiro
    recs.forEach((r: any) => {
      out.push({
        id: `financeiro:rec:${r.id}`, category: 'financeiro',
        title: `Recebível vencido — R$ ${Number(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        subtitle: `${(r.events as any)?.event_name || r.description || '—'} • venceu ${fmtDate(r.due_date)}`,
        href: '/financeiro', date: r.due_date,
      });
    });
    pays.forEach((p: any) => {
      out.push({
        id: `financeiro:pay:${p.id}`, category: 'financeiro',
        title: `Pagamento vencido — R$ ${Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        subtitle: `${(p.events as any)?.event_name || p.description || '—'}${(p.interpreters as any)?.full_name ? ' • ' + (p.interpreters as any).full_name : ''} • venceu ${fmtDate(p.due_date)}`,
        href: '/financeiro', date: p.due_date,
      });
    });

    setItems(out);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    const ch = supabase.channel('notif_bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_sessions' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_assignments' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quote_intakes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_receivables' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_payables' }, load)
      .subscribe();
    return () => { clearInterval(interval); supabase.removeChannel(ch); };
  }, [load]);

  const groups = useMemo<NotifGroup[]>(() => {
    const cats: NotifCategory[] = ['eventos', 'agenda', 'intakes', 'financeiro'];
    return cats.map(c => ({
      category: c,
      label: CATEGORY_LABEL[c],
      items: items.filter(i => i.category === c).sort((a, b) => (a.date || '').localeCompare(b.date || '')),
    })).filter(g => g.items.length > 0);
  }, [items]);

  const unseenCount = useMemo(
    () => items.filter(i => !seenIds.has(i.id)).length,
    [items, seenIds],
  );

  const markAllSeen = useCallback(() => {
    const all = new Set(items.map(i => i.id));
    setSeenIds(all);
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify([...all])); } catch {}
    }
  }, [items, storageKey]);

  return { groups, total: items.length, unseenCount, seenIds, markAllSeen, refresh: load };
}
