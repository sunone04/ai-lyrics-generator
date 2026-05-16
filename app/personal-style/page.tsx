'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/contexts/auth-context';
import { useData } from '@/lib/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Loading from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon, SparklesIcon, ShieldCheckIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
import { useTrial } from '@/lib/hooks/use-trial';

interface StyleGroup {
  id: number;
  name: string;
  created_at: string;
  personal_style_lyrics: { count: number }[];
}
interface Lyric {
  id: number;
  title: string;
  lyrics: string;
  word_count: number;
  created_at: string;
}

export default function PersonalStylePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { isActiveUser } = useTrial();
  const { personalStyles, loadingPersonalStyles, fetchPersonalStyles } = useData();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<StyleGroup | null>(null);
  const [currentGroup, setCurrentGroup] = useState<StyleGroup | null>(null);

  useEffect(() => {
    if (user) fetchPersonalStyles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is the Personal Style Library?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Personal Style Library lets you save short lyric samples in groups so our AI can learn your unique writing style and use it in future generations.'
          }
        },
        {
          '@type': 'Question',
          name: 'Do I need a paid plan to try it?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'New users get a 3-day free trial (no credit card required). During trial, you can experience premium features including Personal Style Library.'
          }
        },
        {
          '@type': 'Question',
          name: 'How many samples can I add?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Each style group supports up to 5 short samples (<= 500 characters per sample). The AI will use the entire group when generating lyrics.'
          }
        }
      ]
    } as const;

    return (
      <div className="min-h-screen noise-bg">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

        <div className="container mx-auto px-4 py-12">
          <Breadcrumbs customBreadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Personal Style Library', href: '/personal-style' }]} />

          <div className="text-center max-w-3xl mx-auto mt-6">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              Personal Style Library
              <span className="block bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent mt-2">Teach the AI Your Unique Writing Style</span>
            </h1>
            <p className="mt-5 text-lg text-zinc-400 leading-relaxed">
              Create your own style library by adding short samples of lyrics you wrote. These samples act as private reference cues so the AI can write in your voice, structure, and wording - as if you wrote it yourself.
            </p>
            <div className="mt-3 text-sm text-zinc-400 bg-white/[0.03] inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/5">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              We respect your privacy: your samples are only used at generation time as temporary references - not for model training or any other purpose.
            </div>
            <div className="mt-6 inline-flex gap-3">
              <Link href="/auth/signin" className="px-6 py-3 rounded-lg text-white bg-violet-600 hover:bg-violet-500 font-medium shadow-lg shadow-violet-600/20">Sign In to Access</Link>
              <Link href="/generate" className="px-6 py-3 rounded-lg text-violet-400 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 font-medium">Try The Generator</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-6xl mx-auto">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl shadow-black/40">
              <SparklesIcon className="w-6 h-6 text-violet-400" />
              <h3 className="mt-3 font-semibold text-white">Write In Your Voice</h3>
              <p className="mt-2 text-zinc-500 text-sm">The AI learns your language, structure, and favorite phrases to keep the vibe consistent across songs.</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl shadow-black/40">
              <MusicalNoteIcon className="w-6 h-6 text-pink-400" />
              <h3 className="mt-3 font-semibold text-white">Use It Anywhere</h3>
              <p className="mt-2 text-zinc-500 text-sm">Pick your style group in the generator and the model will use all samples from that group while composing.</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 shadow-2xl shadow-black/40">
              <ShieldCheckIcon className="w-6 h-6 text-emerald-400" />
              <h3 className="mt-3 font-semibold text-white">Private & Secure</h3>
              <p className="mt-2 text-zinc-500 text-sm">Your samples are visible only to you. You can edit or remove them anytime with one click.</p>
            </div>
          </div>

          <div className="mt-16 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <div className="text-xs font-semibold text-violet-400">Step 1</div>
                <h3 className="mt-1 font-semibold text-white">Create a Style Group</h3>
                <p className="mt-2 text-sm text-zinc-500">Start a new group for a singer persona, mood, or genre.</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <div className="text-xs font-semibold text-violet-400">Step 2</div>
                <h3 className="mt-1 font-semibold text-white">Add 3-5 Short Samples</h3>
                <p className="mt-2 text-sm text-zinc-500">Each sample {'<='} 500 characters. The AI uses the entire group.</p>
              </div>
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6">
                <div className="text-xs font-semibold text-violet-400">Step 3</div>
                <h3 className="mt-1 font-semibold text-white">Generate Lyrics</h3>
                <p className="mt-2 text-sm text-zinc-500">Pick your style group on the Generate page and create songs in your voice.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/auth/signin" className="px-6 py-3 rounded-lg text-white bg-violet-600 hover:bg-violet-500 font-medium shadow-lg shadow-violet-600/20">Create Your First Style Group</Link>
            <p className="text-sm text-zinc-600 mt-3">
              Prefer to explore first? <Link href="/generate" className="text-violet-400 hover:text-violet-300">Try the AI Lyrics Generator</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (loadingPersonalStyles) {
    return <Loading />;
  }
  return (
    <div className="min-h-screen noise-bg">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs customBreadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Personal Style Library', href: '/personal-style' }]} />
        {!isActiveUser && (
          <div className="mb-6 p-4 bg-violet-500/10 border border-violet-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="mt-0.5"><SparklesIcon className="w-5 h-5 text-violet-400" /></div>
              <div>
                <h3 className="font-semibold text-violet-300">Premium Feature</h3>
              </div>
            </div>
            <div className="mt-3 flex gap-3">
              <Button variant="outline" onClick={() => router.push('/pricing')}>See Plans</Button>
            </div>
          </div>
        )}
        <Header isActiveUser={isActiveUser} onAddNew={() => {
          if (!isActiveUser) {
            toast.error('This feature is for Premium members. If eligible, your free trial will activate automatically after sign-in; otherwise, please upgrade.');
            router.push('/pricing');
            return;
          }
          setEditingGroup(null);
          setIsGroupModalOpen(true);
        }} />
        <StyleGroupGrid
          styleGroups={personalStyles as any}
          onEdit={(group) => {
            setCurrentGroup(group);
            setIsLyricsModalOpen(true);
          }}
          onDelete={() => fetchPersonalStyles(true)}
        />
      </div>
      {isGroupModalOpen && (
        <GroupFormModal
          group={editingGroup}
          onClose={() => setIsGroupModalOpen(false)}
          onSuccess={() => {
            setIsGroupModalOpen(false);
            fetchPersonalStyles(true);
          }}
        />
      )}
      {isLyricsModalOpen && currentGroup && (
        <LyricsViewerModal
          group={currentGroup}
          onClose={() => setIsLyricsModalOpen(false)}
        />
      )}
    </div>
  );
}

const Header = ({ isActiveUser, onAddNew }: { isActiveUser: boolean, onAddNew: () => void }) => (
  <div className="mb-8">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-4xl font-bold text-white">Personal Style Library</h1>
        <p className="text-xl text-zinc-400 mt-2">Add your own lyric samples as private references so the AI can write in your voice. Samples are never used to train models.</p>
      </div>
      <Button onClick={onAddNew} className={`bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20 ${!isActiveUser ? 'opacity-70' : ''}`}>
        <PlusIcon className="w-5 h-5 mr-2" />
        Create New Style
      </Button>
    </div>
    <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-zinc-400">
        <div className="flex items-start gap-2"><MusicalNoteIcon className="w-4 h-4 text-violet-400 mt-0.5" /><span>1) Create a style group for a singer persona, mood, or genre.</span></div>
        <div className="flex items-start gap-2"><BookOpenIcon className="w-4 h-4 text-pink-400 mt-0.5" /><span>2) Add 3-5 short lyric samples ({'<='} 500 chars each).</span></div>
        <div className="flex items-start gap-2"><ShieldCheckIcon className="w-4 h-4 text-emerald-400 mt-0.5" /><span>3) On the Generate page, pick this group to write in your voice.</span></div>
      </div>
    </div>
  </div>
);

const StyleGroupGrid = ({ styleGroups, onEdit, onDelete }: {
  styleGroups: StyleGroup[],
  onEdit: (group: StyleGroup) => void,
  onDelete: () => void
}) => {
  if (styleGroups.length === 0) {
    return (
      <Card className="text-center p-12 border-white/5 bg-white/[0.02]">
        <BookOpenIcon className="w-16 h-16 mx-auto text-zinc-700 mb-4" />
        <h3 className="text-xl font-semibold text-zinc-400">No Style Groups Yet</h3>
        <p className="text-zinc-600 mt-2">Click 'Create New Style' to get started.</p>
      </Card>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {styleGroups.map(group => (
        <Card key={group.id} className="hover:border-violet-500/20 transition-colors flex flex-col border-white/5 bg-white/[0.02]">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white">{group.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-xs text-zinc-600">Created: {new Date(group.created_at).toLocaleDateString()}</p>
          </CardContent>
          <div className="p-4 border-t border-white/5 flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(group)}>Edit</Button>
            <DeleteButton id={group.id} onSuccess={onDelete} apiPath="/api/personal-styles" />
          </div>
        </Card>
      ))}
    </div>
  );
};

const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-zinc-900 text-white rounded-xl shadow-2xl ring-1 ring-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

const GroupFormModal = ({ group, onClose, onSuccess }: { group: StyleGroup | null, onClose: () => void, onSuccess: () => void }) => {
  const [name, setName] = useState(group?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [samples, setSamples] = useState<{ title: string; lyrics: string }[]>([{ title: '', lyrics: '' }]);
  const addSample = () => {
    setSamples(prev => (prev.length >= 5 ? prev : [...prev, { title: '', lyrics: '' }]));
  };
  const removeSample = (idx: number) => {
    setSamples(prev => prev.filter((_, i) => i !== idx));
  };
  const updateSample = (idx: number, field: 'title' | 'lyrics', value: string) => {
    setSamples(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const url = group ? `/api/personal-styles/${group.id}` : '/api/personal-styles';
    const method = group ? 'PUT' : 'POST';
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (data.success) {
        if (!group) {
          const styleGroupId = data.styleGroup?.id as number | undefined;
          if (styleGroupId) {
            const valid = samples.filter(s => s.title.trim() && s.lyrics.trim()).slice(0, 5);
            for (const s of valid) {
              try {
                await fetch('/api/personal-styles/lyrics', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    style_group_id: styleGroupId,
                    title: s.title.trim(),
                    lyrics: s.lyrics.trim(),
                  })
                });
              } catch (e) {
                console.warn('Create lyric failed:', e);
              }
            }
          }
        }
        onSuccess();
        toast.success('Saved successfully');
      } else {
        toast.error(data.error || 'An error occurred');
      }
    } catch (error) {
      console.error('Failed to save style group:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Modal onClose={onClose}>
      <h3 className="text-xl font-semibold mb-4">{group ? 'Edit Style Group' : 'Create New Style Group'}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Enter style name (e.g., Dark Folk)"
          className="w-full p-2 border border-white/10 rounded mb-4 bg-white/[0.03] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
          required
          maxLength={100}
        />
        {!group && (
          <div className="space-y-3 mb-4">
            <p className="text-sm text-zinc-400">Optional: Add lyric samples now (up to 5)</p>
            {samples.map((s, idx) => (
              <div key={idx} className="border border-white/5 rounded-lg p-3 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-600">Sample {idx + 1}</span>
                  {samples.length > 1 && (
                    <button type="button" className="text-xs text-red-400 hover:text-red-300" onClick={() => removeSample(idx)}>Remove</button>
                  )}
                </div>
                <input
                  type="text"
                  value={s.title}
                  onChange={e => updateSample(idx, 'title', e.target.value)}
                  placeholder="Title (e.g., Verse 1 Sample)"
                  className="w-full p-2 border border-white/10 rounded bg-white/[0.03] text-white mb-2 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
                  maxLength={100}
                />
                <textarea
                  value={s.lyrics}
                  onChange={e => updateSample(idx, 'lyrics', e.target.value)}
                  placeholder="Paste lyrics here (<= 500 chars)"
                  className="w-full p-2 border border-white/10 rounded bg-white/[0.03] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
                  rows={6}
                  maxLength={500}
                />
              </div>
            ))}
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-600">Tips: Short, representative lines work best.</span>
              <Button type="button" variant="outline" onClick={addSample} disabled={samples.length >= 5}><PlusIcon className="w-4 h-4 mr-1" />Add Sample</Button>
            </div>
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

import useSWR from 'swr';
const LyricsViewerModal = ({ group, onClose }: {
  group: StyleGroup,
  onClose: () => void,
}) => {
  const { fetchPersonalStyles } = useData();
  const { data, isLoading, mutate } = useSWR(
    `/api/personal-styles/${group.id}`,
    null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
    }
  );
  const lyrics: Lyric[] = data?.styleGroup?.personal_style_lyrics || [];
  const [name, setName] = useState<string>(group?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [editingAll, setEditingAll] = useState(true);
  const [saveBusy, setSaveBusy] = useState(false);
  const [drafts, setDrafts] = useState<Array<{ id?: number; title: string; lyrics: string; _deleted?: boolean; _new?: boolean }>>([]);

  useEffect(() => {
    if (editingAll && drafts.length === 0) {
      setDrafts((lyrics || []).map(l => ({ id: l.id, title: l.title || '', lyrics: l.lyrics || '' })));
    }
  }, [editingAll, lyrics, drafts.length]);

  const addDraft = () => {
    const nonDeleted = drafts.filter(d => !d._deleted);
    if (nonDeleted.length >= 5) {
      toast.error('Maximum 5 samples per group');
      return;
    }
    setDrafts(prev => [...prev, { title: '', lyrics: '', _new: true }]);
  };

  const removeDraft = (idx: number) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, _deleted: true } : d));
  };

  const updateDraft = (idx: number, field: 'title' | 'lyrics', value: string) => {
    setDrafts(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };

  const saveAll = async () => {
    setSaveBusy(true);
    try {
      if (name.trim() !== (group?.name || '')) {
        await fetch(`/api/personal-styles/${group.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim() }),
        });
      }

      for (const draft of drafts) {
        if (draft._deleted && draft.id) {
          await fetch(`/api/personal-styles/lyrics/${draft.id}`, { method: 'DELETE' });
        } else if (draft._new && !draft._deleted && draft.title.trim() && draft.lyrics.trim()) {
          await fetch('/api/personal-styles/lyrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ style_group_id: group.id, title: draft.title.trim(), lyrics: draft.lyrics.trim() }),
          });
        } else if (!draft._new && !draft._deleted && draft.id) {
          await fetch(`/api/personal-styles/lyrics/${draft.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: draft.title.trim(), lyrics: draft.lyrics.trim() }),
          });
        }
      }

      await mutate();
      await fetchPersonalStyles(true);
      toast.success('All changes saved');
    } catch (e) {
      toast.error('Failed to save changes');
    } finally {
      setSaveBusy(false);
    }
  };

  const visibleDrafts = drafts.filter(d => !d._deleted);

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Edit Style Group</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addDraft} disabled={visibleDrafts.length >= 5}>
            <PlusIcon className="w-4 h-4 mr-1" /> Add Sample
          </Button>
          <Button size="sm" onClick={saveAll} disabled={saveBusy}>
            {saveBusy ? 'Saving...' : 'Save All'}
          </Button>
        </div>
      </div>

      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        className="w-full p-2 border border-white/10 rounded mb-4 bg-white/[0.03] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
        placeholder="Style group name"
      />

      {isLoading ? (
        <div className="text-center py-8 text-zinc-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft, idx) => {
            if (draft._deleted) return null;
            return (
              <div key={idx} className="border border-white/5 rounded-lg p-3 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-600">Sample {idx + 1}</span>
                  <button type="button" className="text-xs text-red-400 hover:text-red-300" onClick={() => removeDraft(idx)}>Remove</button>
                </div>
                <input
                  type="text"
                  value={draft.title}
                  onChange={e => updateDraft(idx, 'title', e.target.value)}
                  placeholder="Title"
                  className="w-full p-2 border border-white/10 rounded bg-white/[0.03] text-white mb-2 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
                  maxLength={100}
                />
                <textarea
                  value={draft.lyrics}
                  onChange={e => updateDraft(idx, 'lyrics', e.target.value)}
                  placeholder="Lyrics (<= 500 chars)"
                  className="w-full p-2 border border-white/10 rounded bg-white/[0.03] text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/40"
                  rows={4}
                  maxLength={500}
                />
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

function DeleteButton({ id, onSuccess, apiPath }: { id: number; onSuccess: () => void; apiPath: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`${apiPath}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Deleted successfully');
      onSuccess();
    } catch (e) {
      toast.error('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleDelete} disabled={isDeleting} className="text-red-400 hover:text-red-300 hover:border-red-500/20">
      <TrashIcon className="w-4 h-4 mr-1" />
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
