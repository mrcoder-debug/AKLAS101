"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Pencil, Save, X, StickyNote } from "lucide-react";
import {
  listNotesAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from "@/server/actions/notes.actions";
import type { NoteDTO } from "@/services/notes.service";

export function NotesPanel({ lessonId }: { lessonId: string }) {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listNotesAction(lessonId).then((result) => {
      if (result.ok) setNotes(result.data);
      setLoading(false);
    });
  }, [lessonId]);

  async function handleAdd() {
    if (!newContent.trim()) return;
    setSaving(true);
    const result = await createNoteAction({ lessonId, content: newContent.trim() });
    if (result.ok) {
      setNotes((prev) => [...prev, result.data]);
      setNewContent("");
      setIsAdding(false);
      toast.success("Note saved");
    } else {
      toast.error(result.error?.message ?? "Failed to save note");
    }
    setSaving(false);
  }

  async function handleUpdate(noteId: string) {
    if (!editContent.trim()) return;
    setSaving(true);
    const result = await updateNoteAction(noteId, { content: editContent.trim() });
    if (result.ok) {
      setNotes((prev) => prev.map((n) => (n.id === noteId ? result.data : n)));
      setEditingId(null);
      toast.success("Note updated");
    } else {
      toast.error(result.error?.message ?? "Failed to update note");
    }
    setSaving(false);
  }

  async function handleDelete(noteId: string) {
    setDeletingId(noteId);
    const result = await deleteNoteAction(noteId);
    if (result.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } else {
      toast.error(result.error?.message ?? "Failed to delete note");
    }
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </p>
        {!isAdding && (
          <Button size="sm" variant="outline" onClick={() => setIsAdding(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add note
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
          <Textarea
            placeholder="Write your note…"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
            className="resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !newContent.trim()}>
              {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
              Save
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setIsAdding(false); setNewContent(""); }}
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <StickyNote className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No notes yet. Add one to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="rounded-lg border p-3 space-y-2 bg-card">
            {editingId === note.id ? (
              <>
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(note.id)} disabled={saving || !editContent.trim()}>
                    {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                    <X className="mr-1.5 h-3.5 w-3.5" /> Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(note.id)}
                      disabled={deletingId === note.id}
                    >
                      {deletingId === note.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
