import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/constants';

export default function SettingsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const { role } = useAuth();

  useEffect(() => {
    if (role === 'admin') loadUsers();
  }, [role]);

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*, user_roles(role)');
    if (data) setUsers(data);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Configurações</h1>

      <Card>
        <CardHeader><CardTitle className="text-lg">Usuários e Perfis</CardTitle></CardHeader>
        <CardContent>
          {role !== 'admin' ? (
            <p className="text-muted-foreground text-sm">Apenas administradores podem gerenciar usuários.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || '-'}</TableCell>
                    <TableCell className="text-sm">{u.email || '-'}</TableCell>
                    <TableCell>
                      {u.user_roles?.map((r: any) => (
                        <Badge key={r.role} variant="secondary" className="mr-1">{ROLE_LABELS[r.role] || r.role}</Badge>
                      ))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Sobre o Sistema</CardTitle></CardHeader>
        <CardContent>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p><strong>LibrasGestão</strong> — Sistema de Gestão de Intérpretes de Libras</p>
            <p>Versão 1.0 MVP</p>
            <p>Desenvolvido para controle operacional, auditoria e gestão de escalas.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
