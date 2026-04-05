'use client';

import { useFetch } from '@/hooks/useFetch';
import type { UserDto } from '@/lib/types';
import { usersApi } from '@/lib/api';
import { useState } from 'react';
import { Trash2, UserCog, Mail, Calendar, ShieldCheck } from 'lucide-react';

export default function UsersPage() {
  const { data: initialUsers, isLoading, error, mutate } = useFetch<UserDto[]>('/api/v1/users');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    setDeletingId(id);
    try {
      await usersApi.delete(id);
      mutate(); // Refresh the list
    } catch (err) {
      alert('Failed to delete user.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          User Management
        </h1>
        <p className="text-muted-foreground mt-2">
          View, manage, and configure system users.
        </p>
      </div>

      {/* Content */}
      <div className="bg-card border border-border/60 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">
            <h3 className="font-semibold text-lg">Error loading users</h3>
            <p className="text-sm mt-1">{error.message || 'Unknown error occurred.'}</p>
          </div>
        ) : !initialUsers?.length ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Contact</th>
                  <th className="px-6 py-4 font-semibold">System Role</th>
                  <th className="px-6 py-4 font-semibold">Joined Date</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {initialUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                          {u.firstName?.[0] || u.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{u.firstName} {u.lastName}</p>
                          <p className="text-xs text-muted-foreground">ID: {u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map(role => (
                          <span key={role} className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded text-xs font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            {role.replace('ROLE_', '')}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
                          className="p-1.5 text-destructive/70 hover:text-destructive bg-destructive/10 hover:bg-destructive/20 rounded transition-colors disabled:opacity-50"
                          title="Delete User"
                        >
                          {deletingId === u.id ? (
                            <span className="w-4 h-4 border-2 border-destructive border-t-transparent rounded-full animate-spin inline-block"></span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
