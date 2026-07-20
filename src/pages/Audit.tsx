import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Audit() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('schedule_audit_logs')
      .select('*, schedules(title, activity_date, clients(name)), profiles:changed_by(full_name)')
      .order('changed_at', { ascending: false })
      .limit(200);
    if (data) setLogs(data);
  };

  const filtered = logs.filter(l =>
    (l.field_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.change_reason || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.schedules?.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Auditoria de Alterações</h1>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar campo, motivo ou título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Agenda</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>Valor Anterior</TableHead>
                <TableHead>Valor Novo</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Usuário</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm">{safeFormat(l.changed_at, 'dd/MM/yyyy HH:mm')}</TableCell>
                  <TableCell className="text-sm font-medium">{l.schedules?.title || '-'}</TableCell>
                  <TableCell className="text-sm">{l.field_name}</TableCell>
                  <TableCell className="text-sm text-destructive">{l.old_value || '-'}</TableCell>
                  <TableCell className="text-sm text-success">{l.new_value || '-'}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">{l.change_reason || '-'}</TableCell>
                  <TableCell className="text-sm">{(l.profiles as any)?.full_name || '-'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">Nenhum registro de auditoria</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
