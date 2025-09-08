'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { useData } from '@/lib/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Loading from '@/components/ui/loading';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon } from '@heroicons/react/24/outline';

// Types to match the new database structure
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

// Main Page Component
export default function PersonalStylePage() {
  const { user } = useAuth();
  const { personalStyles, loadingPersonalStyles, fetchPersonalStyles } = useData();

  // Modal States
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isLyricsModalOpen, setIsLyricsModalOpen] = useState(false);
  const [isLyricFormModalOpen, setIsLyricFormModalOpen] = useState(false);

  // Data States
  const [editingGroup, setEditingGroup] = useState<StyleGroup | null>(null);
  const [currentGroup, setCurrentGroup] = useState<StyleGroup | null>(null);
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [editingLyric, setEditingLyric] = useState<Lyric | null>(null);

  // 首次登录后触发一次强制拉取，避免依赖函数引用造成死循环
  useEffect(() => {
    if (user) fetchPersonalStyles(true);
    // 仅在用户ID变化时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) {
    return <div className="text-center p-8">Please sign in to view your personal styles.</div>;
  }

  if (loadingPersonalStyles) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs customBreadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Personal Style Library', href: '/personal-style' }]} />
        <Header onAddNew={() => {
          setEditingGroup(null);
          setIsGroupModalOpen(true);
        }} />
        <StyleGroupGrid
          styleGroups={personalStyles as any}
          onEdit={(group) => {
            setEditingGroup(group);
            setIsGroupModalOpen(true);
          }}
          onDelete={fetchPersonalStyles}
          onView={(group) => {
            setCurrentGroup(group);
            setIsLyricsModalOpen(true);
          }}
        />
      </div>

      {/* Modals */}
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
          onAddLyric={() => {
            setEditingLyric(null);
            setIsLyricFormModalOpen(true);
          }}
          onEditLyric={(lyric) => {
            setEditingLyric(lyric);
            setIsLyricFormModalOpen(true);
          }}
        />
      )}
      {isLyricFormModalOpen && currentGroup && (
        <LyricFormModal
          group={currentGroup}
          lyric={editingLyric}
          onClose={() => setIsLyricFormModalOpen(false)}
          onSuccess={() => {
            setIsLyricFormModalOpen(false);
            setIsLyricsModalOpen(false); // Close the viewer to force a refresh
          }}
        />
      )}
    </div>
  );
}

// Sub-components for clarity

const Header = ({ onAddNew }: { onAddNew: () => void }) => (
  <div className="flex justify-between items-center mb-8">
    <div>
      <h1 className="text-4xl font-bold text-gray-800">Personal Style Library</h1>
      <p className="text-xl text-gray-600 mt-2">Create style groups and add lyric samples to train the AI.</p>
    </div>
    <Button onClick={onAddNew} className="bg-blue-600 hover:bg-blue-700">
      <PlusIcon className="w-5 h-5 mr-2" />
      Create New Style
    </Button>
  </div>
);

const StyleGroupGrid = ({ styleGroups, onEdit, onDelete, onView }: {
  styleGroups: StyleGroup[],
  onEdit: (group: StyleGroup) => void,
  onDelete: () => void,
  onView: (group: StyleGroup) => void
}) => {
  if (styleGroups.length === 0) {
    return (
      <Card className="text-center p-12">
        <BookOpenIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600">No Style Groups Yet</h3>
        <p className="text-gray-500 mt-2">Click 'Create New Style' to get started.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {styleGroups.map(group => (
        <Card key={group.id} className="hover:shadow-lg transition-shadow flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">{group.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-gray-600">{group.personal_style_lyrics[0]?.count || 0} lyric samples</p>
            <p className="text-xs text-gray-400 mt-2">Created: {new Date(group.created_at).toLocaleDateString()}</p>
          </CardContent>
          <div className="p-4 border-t flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={() => onView(group)}>View Lyrics</Button>
            <Button variant="ghost" size="sm" onClick={() => onEdit(group)}><PencilIcon className="w-4 h-4" /></Button>
            <DeleteButton id={group.id} onSuccess={onDelete} apiPath="/api/personal-styles" />
          </div>
        </Card>
      ))}
    </div>
  );
};

// Modal Components

const Modal = ({ children, onClose }: { children: React.ReactNode, onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    onClick={onClose}
  >
    <div
      className="bg-white text-gray-900 rounded-xl shadow-2xl ring-1 ring-black/5 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
  // 可选：在创建分组时同时添加首条歌词
  const [firstLyricTitle, setFirstLyricTitle] = useState('');
  const [firstLyricContent, setFirstLyricContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        // 若是新建分组且填写了首条歌词，则立即创建歌词样本
        if (!group && firstLyricTitle.trim() && firstLyricContent.trim()) {
          try {
            await fetch('/api/personal-styles/lyrics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                style_group_id: data.styleGroup?.id,
                title: firstLyricTitle.trim(),
                lyrics: firstLyricContent.trim(),
              })
            });
          } catch (e) {
            console.warn('Create first lyric failed:', e);
          }
        }
        onSuccess();
      } else {
        alert(data.error || 'An error occurred.');
      }
    } catch (error) {
      console.error('Failed to save style group:', error);
      alert('An error occurred.');
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
          className="w-full p-2 border rounded mb-4 bg-white text-gray-900"
          required
          maxLength={100}
        />
        {!group && (
          <div className="space-y-3 mb-2">
            <p className="text-sm text-gray-600">Optional: Add a first lyric sample</p>
            <input
              type="text"
              value={firstLyricTitle}
              onChange={e => setFirstLyricTitle(e.target.value)}
              placeholder="Title (e.g., Verse 1 Sample)"
              className="w-full p-2 border rounded bg-white text-gray-900"
              maxLength={100}
            />
            <textarea
              value={firstLyricContent}
              onChange={e => setFirstLyricContent(e.target.value)}
              placeholder="Paste lyrics here..."
              className="w-full p-2 border rounded bg-white text-gray-900"
              rows={8}
              maxLength={500}
            />
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

const LyricsViewerModal = ({ group, onClose, onAddLyric, onEditLyric }: {
  group: StyleGroup,
  onClose: () => void,
  onAddLyric: () => void,
  onEditLyric: (lyric: Lyric) => void
}) => {
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLyrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/personal-styles/${group.id}`);
      const data = await response.json();
      if (data.success) {
        setLyrics(data.styleGroup.personal_style_lyrics || []);
      }
    } catch (error) {
      console.error('Failed to fetch lyrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [group.id]);

  useEffect(() => {
    fetchLyrics();
  }, [fetchLyrics]);

  return (
    <Modal onClose={onClose}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Lyrics for "{group.name}"</h3>
        <Button onClick={onAddLyric}><PlusIcon className="w-5 h-5 mr-2" /> Add Lyric</Button>
      </div>
      {isLoading ? <Loading /> : (
        <div className="space-y-4">
          {lyrics.length === 0 ? <p>No lyric samples yet.</p> : lyrics.map(lyric => (
            <div key={lyric.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-start">
                <h4 className="font-semibold text-lg">{lyric.title}</h4>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => onEditLyric(lyric)}><PencilIcon className="w-4 h-4" /></Button>
                  <DeleteButton id={lyric.id} onSuccess={fetchLyrics} apiPath="/api/personal-styles/lyrics" />
                </div>
              </div>
              <p className="text-gray-600 mt-2 whitespace-pre-wrap">{lyric.lyrics}</p>
              <p className="text-xs text-gray-400 mt-2">{lyric.word_count} words</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

const LyricFormModal = ({ group, lyric, onClose, onSuccess }: {
  group: StyleGroup,
  lyric: Lyric | null,
  onClose: () => void,
  onSuccess: () => void
}) => {
  const [title, setTitle] = useState(lyric?.title || '');
  const [lyrics, setLyrics] = useState(lyric?.lyrics || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const url = lyric ? `/api/personal-styles/lyrics/${lyric.id}` : '/api/personal-styles/lyrics';
    const method = lyric ? 'PUT' : 'POST';
    const body = JSON.stringify({ style_group_id: group.id, title, lyrics });

    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body });
      const data = await response.json();
      if (data.success) {
        onSuccess();
      } else {
        alert(data.error || 'An error occurred.');
      }
    } catch (error) {
      console.error('Failed to save lyric:', error);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-xl font-semibold mb-4">{lyric ? 'Edit Lyric Sample' : 'Add New Lyric Sample'}</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Title (e.g., Verse 1 Sample)"
          className="w-full p-2 border rounded bg-white text-gray-900"
          required
          maxLength={100}
        />
        <textarea
          value={lyrics}
          onChange={e => setLyrics(e.target.value)}
          placeholder="Paste lyrics here..."
          className="w-full p-2 border rounded bg-white text-gray-900"
          rows={10}
          required
          maxLength={500}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const DeleteButton = ({ id, onSuccess, apiPath }: { id: number, onSuccess: () => void, apiPath: string }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure?')) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`${apiPath}/${id}`, { method: 'DELETE' });
      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete.');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? '...' : <TrashIcon className="w-4 h-4 text-red-500" />}
    </Button>
  );
};
