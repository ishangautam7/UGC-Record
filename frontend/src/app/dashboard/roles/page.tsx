"use client";

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import styles from '../shared.module.css';

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: string[];
    created_at: string;
}

export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await api.get('/roles');
            setRoles(res.data);
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/roles/${editing.id}`, formData);
            } else {
                await api.post('/roles', formData);
            }
            fetchRoles();
            resetForm();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? Users with this role will lose their permissions.')) return;
        try {
            await api.delete(`/roles/${id}`);
            fetchRoles();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    const startEdit = (role: Role) => {
        setEditing(role);
        setFormData({ name: role.name, description: role.description || '' });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditing(null);
        setFormData({ name: '', description: '' });
    };

    return (
        <ProtectedRoute requiredRoles={['ADMIN']}>
            <div className={styles.page}>
                <header className={styles.header}>
                    <div>
                        <h1>🔐 Roles</h1>
                        <p>Manage system roles and permissions</p>
                    </div>
                    <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                        + Add Role
                    </button>
                </header>

                {showForm && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>{editing ? 'Edit Role' : 'New Role'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label>Role Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                                        placeholder="MODERATOR"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Role description..."
                                        rows={3}
                                    />
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" onClick={resetForm} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}>
                                        {editing ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className={styles.loading}>Loading roles...</div>
                ) : roles.length === 0 ? (
                    <div className={styles.empty}>No roles found.</div>
                ) : (
                    <div className={styles.grid}>
                        {roles.map(role => (
                            <div key={role.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3>{role.name}</h3>
                                </div>
                                <p className={styles.cardDesc}>{role.description || 'No description'}</p>
                                <div className={styles.cardMeta}>
                                    <span>Created: {new Date(role.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className={styles.cardActions}>
                                    <button onClick={() => startEdit(role)} className={styles.editBtn}>✏️ Edit</button>
                                    <button onClick={() => handleDelete(role.id)} className={styles.deleteBtn}>🗑️ Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
