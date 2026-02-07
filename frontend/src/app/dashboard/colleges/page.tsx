"use client";

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import ProtectedRoute from '../../../components/ProtectedRoute';
import styles from '../shared.module.css';

interface College {
    id: string;
    name: string;
    code: string;
    address: string;
    is_active: boolean;
    department_count: number;
    user_count: number;
    created_at: string;
}

export default function CollegesPage() {
    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<College | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        address: ''
    });

    useEffect(() => {
        fetchColleges();
    }, []);

    const fetchColleges = async () => {
        try {
            const res = await api.get('/colleges');
            setColleges(res.data);
        } catch (err) {
            console.error('Failed to fetch colleges:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editing) {
                await api.put(`/colleges/${editing.id}`, formData);
            } else {
                await api.post('/colleges', formData);
            }
            fetchColleges();
            resetForm();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure? This will delete all departments and affect users in this college.')) return;
        try {
            await api.delete(`/colleges/${id}`);
            fetchColleges();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    const startEdit = (college: College) => {
        setEditing(college);
        setFormData({
            name: college.name,
            code: college.code,
            address: college.address || ''
        });
        setShowForm(true);
    };

    const resetForm = () => {
        setShowForm(false);
        setEditing(null);
        setFormData({ name: '', code: '', address: '' });
    };

    return (
        <ProtectedRoute requiredRoles={['ADMIN']}>
            <div className={styles.page}>
                <header className={styles.header}>
                    <div>
                        <h1>🏛️ Colleges</h1>
                        <p>Manage colleges and their departments</p>
                    </div>
                    <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                        + Add College
                    </button>
                </header>

                {showForm && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>{editing ? 'Edit College' : 'New College'}</h2>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label>College Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Engineering College"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>College Code *</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        placeholder="ENG"
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows={3}
                                        placeholder="College address..."
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
                    <div className={styles.loading}>Loading colleges...</div>
                ) : colleges.length === 0 ? (
                    <div className={styles.empty}>No colleges found. Create your first college!</div>
                ) : (
                    <div className={styles.grid}>
                        {colleges.map(college => (
                            <div key={college.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3>{college.name}</h3>
                                    <span className={styles.badge} style={{ backgroundColor: '#667eea' }}>
                                        {college.code}
                                    </span>
                                </div>
                                <p className={styles.cardDesc}>{college.address || 'No address'}</p>
                                <div className={styles.cardMeta}>
                                    <span>🏢 {college.department_count} Departments</span>
                                    <span>👥 {college.user_count} Users</span>
                                </div>
                                <div className={styles.cardActions}>
                                    <button onClick={() => startEdit(college)} className={styles.editBtn}>✏️ Edit</button>
                                    <button onClick={() => handleDelete(college.id)} className={styles.deleteBtn}>🗑️ Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
