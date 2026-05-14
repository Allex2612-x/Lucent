import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, X, RefreshCw, Loader2, ArrowUp, MessageSquare } from 'lucide-react';
import { insightsService, Recommendation } from '../../services/insights.service';

interface AiAssistantDrawerProps {
  open: boolean;
  onClose: () => void;
}

type Period = 'weekly' | 'monthly' | 'yearly';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AiAssistantDrawer({ open, onClose }: AiAssistantDrawerProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('weekly');
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // ESC closes the drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const insightQuery = useQuery({
    queryKey: ['insights', 'weekly'],
    queryFn: () => insightsService.getWeekly(),
    select: (res) => res.data?.data,
    enabled: open,
    staleTime: 1000 * 60 * 60,
  });

  const recommendationsQuery = useQuery({
    queryKey: ['insights', 'recommendations'],
    queryFn: () => insightsService.getRecommendations(),
    select: (res) => res.data?.data ?? [],
    enabled: open,
    staleTime: 1000 * 60 * 60,
  });

  const refreshInsight = async () => {
    try {
      const res = await insightsService.getWeekly(true);
      queryClient.setQueryData(['insights', 'weekly'], res);
    } catch {
      // toast already happens elsewhere; silent here
    }
  };

  const askMutation = useMutation({
    mutationFn: (q: string) => insightsService.ask(q),
    onMutate: (q) => {
      setChat((prev) => [...prev, { role: 'user', content: q }]);
      setQuestion('');
    },
    onSuccess: (res) => {
      setChat((prev) => [...prev, { role: 'assistant', content: res.data?.data?.answer ?? '—' }]);
    },
    onError: (err: any) => {
      setChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err?.response?.data?.message || 'Nu am putut răspunde acum. Încearcă din nou.',
        },
      ]);
    },
  });

  // auto-scroll chat
  useEffect(() => {
    if (chat.length > 0) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (q.length < 3 || askMutation.isPending) return;
    askMutation.mutate(q);
  };

  const handleRecAction = (rec: Recommendation) => {
    if (rec.id === 'set-budget') navigate('/budgets');
    else if (rec.id === 'compare') navigate('/reports');
    else if (rec.id === 'large-tx') navigate('/transactions');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15,15,16,0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 998,
          animation: 'aiBackdropIn 0.18s ease-out',
        }}
      />

      {/* drawer */}
      <aside
        role="dialog"
        aria-label="Asistent AI"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(420px, 100vw)',
          background: '#fff',
          borderLeft: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          animation: 'aiDrawerIn 0.22s ease-out',
        }}
      >
        {/* header */}
        <div
          style={{
            padding: '16px 18px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2547f5, #6c4cf8)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Asistent AI</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>
              Generat de Gemini · {insightQuery.data?.cached ? 'cache 24h' : 'proaspăt'}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Închide"
            className="modal-close-btn"
            style={{ flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* period tabs */}
        <div style={{ padding: '12px 18px 0' }}>
          <div className="seg" style={{ width: '100%' }}>
            {(['weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
              <button
                key={p}
                className={period === p ? 'on' : ''}
                onClick={() => setPeriod(p)}
                style={{ flex: 1 }}
              >
                {p === 'weekly' ? 'Săptămânal' : p === 'monthly' ? 'Lunar' : 'Anual'}
              </button>
            ))}
          </div>
          {period !== 'weekly' && (
            <div
              style={{
                marginTop: 8,
                fontSize: 11.5,
                color: 'var(--text-3)',
                textAlign: 'center',
              }}
            >
              Doar perioada săptămânală este activă momentan.
            </div>
          )}
        </div>

        {/* scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 18px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* insight card */}
          <div
            style={{
              padding: 14,
              borderRadius: 12,
              background:
                'linear-gradient(135deg, rgba(232,155,28,0.08) 0%, rgba(245,85,110,0.06) 100%)',
              border: '1px solid rgba(232,155,28,0.25)',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--warn)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              ⚠ Tendință de atenție
            </div>
            {insightQuery.isLoading ? (
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Se generează insight-ul…</div>
            ) : insightQuery.data ? (
              <div
                className="serif"
                style={{
                  fontSize: 14,
                  lineHeight: 1.55,
                  color: 'var(--text-1)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {insightQuery.data.content}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-3)' }}>
                Nu am putut genera insight-ul.
              </div>
            )}
            <button
              onClick={refreshInsight}
              disabled={insightQuery.isFetching}
              title="Regenerează"
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-3)',
                cursor: 'pointer',
                padding: 4,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {insightQuery.isFetching ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <RefreshCw size={12} />
              )}
            </button>
          </div>

          {/* recommendations */}
          {(recommendationsQuery.data?.length ?? 0) > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                Recomandări
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recommendationsQuery.data!.map((rec) => (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handleRecAction(rec)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '28px 1fr',
                      gap: 10,
                      padding: 12,
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      transition: 'border-color .12s, background .12s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.background = 'var(--bg-subtle)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = '#fff';
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'var(--bg-inset)',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: 14,
                      }}
                    >
                      {rec.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-1)',
                          marginBottom: 2,
                        }}
                      >
                        {rec.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-2)', lineHeight: 1.45 }}>
                        {rec.body}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* chat history */}
          {chat.length > 0 && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-3)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <MessageSquare size={11} /> Conversație
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {chat.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: msg.role === 'user' ? 'var(--accent-soft)' : 'var(--bg-subtle)',
                      color: msg.role === 'user' ? 'var(--accent-ink)' : 'var(--text-1)',
                      fontSize: 13,
                      lineHeight: 1.5,
                      maxWidth: '90%',
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {msg.content}
                  </div>
                ))}
                {askMutation.isPending && (
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: 'var(--bg-subtle)',
                      color: 'var(--text-3)',
                      fontSize: 13,
                      alignSelf: 'flex-start',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    Se gândește…
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>
            </div>
          )}
        </div>

        {/* ask input */}
        <form
          onSubmit={handleAsk}
          style={{
            padding: '14px 18px',
            borderTop: '1px solid var(--border)',
            background: 'var(--bg-subtle)',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 8,
            }}
          >
            Întreabă
          </div>
          <div style={{ position: 'relative' }}>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk(e as any);
                }
              }}
              placeholder="Ex: Câți bani am cheltuit pe abonamente luna asta?"
              rows={2}
              disabled={askMutation.isPending}
              style={{
                width: '100%',
                padding: '10px 40px 10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: 13,
                fontFamily: 'inherit',
                background: '#fff',
                color: 'var(--text-1)',
                outline: 'none',
                resize: 'none',
              }}
            />
            <button
              type="submit"
              disabled={question.trim().length < 3 || askMutation.isPending}
              aria-label="Trimite"
              style={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                width: 28,
                height: 28,
                borderRadius: 8,
                background: question.trim().length < 3 ? 'var(--bg-inset)' : 'var(--text-1)',
                color: question.trim().length < 3 ? 'var(--text-3)' : '#fff',
                border: 'none',
                cursor: question.trim().length < 3 ? 'not-allowed' : 'pointer',
                display: 'grid',
                placeItems: 'center',
                transition: 'background .12s',
              }}
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </form>
      </aside>

      <style>{`
        @keyframes aiBackdropIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes aiDrawerIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
