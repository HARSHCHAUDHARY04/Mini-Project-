import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Trash2, Search, RefreshCw, UserCheck, Lock, Check, ShieldAlert } from "lucide-react";
import DashboardLayout from "../layouts/DashboardLayout";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonTable } from "../components/Skeletons";
import { useAuth } from "../context/AuthContext";
import api, { errorMessage } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Deletion dialog state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  async function loadUsers() {
    setLoading(true);
    try {
      const params = { page, limit };
      if (search) params.q = search;
      if (roleFilter) params.role = roleFilter;

      const res = await api.get("/users", { params });
      setUsers(res.data.data);
      setTotal(res.data.pagination.total);
      setPages(res.data.pagination.pages);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, roleFilter]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setPage(1);
    loadUsers();
  }

  async function handleRoleChange(user, newRole) {
    if (user._id === currentUser?.id) {
      toast.error("You cannot change your own role.");
      return;
    }
    setUpdatingId(user._id);
    try {
      await api.put(`/users/${user._id}/role`, { role: newRole });
      toast.success(`Role updated for ${user.name} to ${newRole}.`);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget._id}`);
      toast.success(`User ${deleteTarget.name} removed successfully.`);
      setDeleteTarget(null);
      await loadUsers();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  function getInitials(name) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <DashboardLayout title="User Management">
      <div className="space-y-5">
        {/* Header summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-ink-500 dark:text-slate-400">
            Manage system access, roles, and administrative permissions for ClaimAssist AI staff.
          </p>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="btn-secondary text-xs self-start sm:self-auto flex items-center gap-1.5"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Filters and search */}
        <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user by name or email..."
                className="input pl-9 text-xs"
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            </div>
            <button type="submit" className="btn-primary text-xs py-1.5 px-3">
              Search
            </button>
          </form>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <label className="text-xs font-medium text-ink-600 dark:text-slate-400 whitespace-nowrap">
              Role:
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="input py-1.5 text-xs sm:w-36"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="reviewer">Reviewer</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-muted dark:bg-slate-800/60 border-b border-surface-border dark:border-slate-800 text-xs text-ink-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Joined Date</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border dark:divide-slate-800">
                {loading && users === null && <SkeletonTable rows={4} cols={6} />}

                {!loading && users?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-ink-400 dark:text-slate-500">
                      <Users size={32} className="mx-auto mb-2 opacity-40" />
                      <p className="font-medium">No users found matching query.</p>
                    </td>
                  </tr>
                )}

                {users?.map((u) => {
                  const isSelf = u._id === currentUser?.id;
                  const isLocked = u.lockUntil && new Date(u.lockUntil) > new Date();

                  return (
                    <tr
                      key={u._id}
                      className="hover:bg-surface-muted/40 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Avatar */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold text-xs flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0">
                            {getInitials(u.name)}
                          </div>
                          <div>
                            <div className="font-medium text-ink-900 dark:text-white flex items-center gap-1.5">
                              {u.name}
                              {isSelf && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-600 dark:text-slate-300 font-mono">
                        {u.email}
                      </td>

                      {/* Role Selector */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isSelf ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-800 uppercase">
                            <Shield size={11} /> {u.role}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            disabled={updatingId === u._id}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className="rounded-lg border border-surface-border dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium text-ink-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                          >
                            <option value="reviewer">Reviewer</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                            <Lock size={12} /> Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <UserCheck size={12} /> Active
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-500 dark:text-slate-400 font-mono">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        {!isSelf && (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="p-1.5 rounded-lg text-ink-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={page}
            pages={pages}
            total={total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the account for ${deleteTarget?.name} (${deleteTarget?.email})? This action cannot be undone.`}
        confirmLabel="Delete User"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </DashboardLayout>
  );
}
