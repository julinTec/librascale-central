import { useEffect, useMemo, useState } from 'react';
import { Search, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { faqSections } from '@/lib/faq-content';

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function Help() {
  const [query, setQuery] = useState('');

  useEffect(() => {
    document.title = 'Central de Ajuda — Nosso Mundo';
  }, []);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return faqSections;
    return faqSections
      .map((s) => ({
        ...s,
        items: s.items.filter(
          (it) => normalize(it.q).includes(q) || normalize(it.a).includes(q),
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [query]);

  const totalItems = useMemo(
    () => faqSections.reduce((acc, s) => acc + s.items.length, 0),
    [],
  );

  const scrollTo = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">
              {totalItems} perguntas organizadas por módulo do sistema.
            </p>
          </div>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por palavra-chave (ex: orçamento, conflito, imposto)..."
          className="pl-9 h-11"
        />
      </div>

      {!query && (
        <section aria-label="Acesso rápido">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Acesso rápido
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {faqSections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className="text-left rounded-lg border bg-card hover:bg-accent hover:shadow-md transition-all p-4 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Icon className="h-5 w-5 text-primary mb-2" />
                  <div className="font-medium text-sm leading-tight">{s.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {s.items.length} {s.items.length === 1 ? 'pergunta' : 'perguntas'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="space-y-4">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Nenhuma pergunta encontrada para <span className="font-medium">"{query}"</span>.
            </CardContent>
          </Card>
        )}

        {filtered.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    {section.title}
                  </CardTitle>
                  <Badge variant="secondary">{section.items.length}</Badge>
                </div>
                <CardDescription className="sr-only">
                  Perguntas frequentes sobre {section.title}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {section.items.map((item, idx) => (
                    <AccordionItem key={idx} value={`${section.id}-${idx}`}>
                      <AccordionTrigger className="text-left text-sm font-medium">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/30">
        <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-medium text-sm">Não encontrou o que procurava?</p>
            <p className="text-sm text-muted-foreground">
              Fale com o administrador do sistema para suporte personalizado.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
