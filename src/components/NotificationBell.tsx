import { Bell, Calendar, CalendarClock, FileText, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { useNotifications, type NotifCategory } from '@/hooks/useNotifications';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const CATEGORY_ICON: Record<NotifCategory, any> = {
  eventos: Calendar,
  agenda: CalendarClock,
  intakes: FileText,
  financeiro: DollarSign,
};

const CATEGORY_COLOR: Record<NotifCategory, string> = {
  eventos: 'text-primary',
  agenda: 'text-info',
  intakes: 'text-accent-foreground',
  financeiro: 'text-warning',
};

export function NotificationBell() {
  const { groups, total, unseenCount, seenIds, markAllSeen } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleClick = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {unseenCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unseenCount > 99 ? '99+' : unseenCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notificações</h3>
          <span className="text-xs text-muted-foreground">{total} {total === 1 ? 'alerta' : 'alertas'}</span>
        </div>
        <ScrollArea className="max-h-[420px]">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum alerta no momento.</p>
          ) : (
            <div className="divide-y">
              {groups.map(group => {
                const Icon = CATEGORY_ICON[group.category];
                return (
                  <div key={group.category} className="py-2">
                    <div className="px-3 py-1 flex items-center gap-2">
                      <Icon className={cn('h-4 w-4', CATEGORY_COLOR[group.category])} />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.label} ({group.items.length})
                      </span>
                    </div>
                    {group.items.map(item => {
                      const isUnseen = !seenIds.has(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleClick(item.href)}
                          className={cn(
                            'w-full text-left px-3 py-2 hover:bg-accent transition-colors flex gap-2',
                            isUnseen && 'bg-accent/30',
                          )}
                        >
                          {isUnseen && <span className="mt-1.5 h-2 w-2 rounded-full bg-destructive shrink-0" />}
                          <div className={cn('flex-1 min-w-0', !isUnseen && 'pl-4')}>
                            <p className="text-sm font-medium truncate">{item.title}</p>
                            {item.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        {total > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={markAllSeen}>
              Marcar todas como vistas
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
