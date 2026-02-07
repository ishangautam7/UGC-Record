"use client";

import { useEffect, useState } from 'react';
import api from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import ProtectedRoute from '../../../components/ProtectedRoute';
import styles from '../shared.module.css';

interface Researcher {
    id: string;
    user_id: string;
    name: string;
    email: string;
    department_name: string;
    designation: string;
    h_index: number | null;
    citations: number;
    created_at: string;
}

export default function ResearchersPage() {
    const { hasRole } = useAuth();
    const [researchers, setResearchers] = useState<Researcher[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        user_id: '',
        dept_id: '',
        designation: '',
        h_index: '',
        citations: ''
    });

    useEffect(() => {
        fetchResearchers();
        fetchDepartments();
        fetchUsers();
    }, []);

    const fetchResearchers = async () => {
        try {
            const res = await api.get('/researchers');
            setResearchers(res.data);
        } catch (err) {
            console.error('Failed to fetch researchers:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDepartments = async () => {
        try {
            const res = await api.get('/departments');
            setDepartments(res.data);
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            // Filter users who have RESEARCHER role but don't have a profile yet
            setUsers(res.data.filter((u: any) =>
                u.roles?.includes('RESEARCHER')
            ));
        } catch (err) {
            console.error('Failed to fetch users:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/researchers', {
                ...formData,
                h_index: formData.h_index ? parseInt(formData.h_index) : null,
                citations: formData.citations ? parseInt(formData.citations) : 0
            });
            fetchResearchers();
            resetForm();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create researcher profile');
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setFormData({ user_id: '', dept_id: '', designation: '', h_index: '', citations: '' });
    };

    // Dept Head can create, Admin has all permissions via middleware
    const canCreate = hasRole('DEPARTMENT_HEAD') || hasRole('ADMIN');

    return (
        <ProtectedRoute requiredRoles={['ADMIN', 'DEPARTMENT_HEAD']}>
            <div className={styles.page}>
                <header className={styles.header}>
                    <div>
                        <h1>👨‍🔬 Researchers</h1>
                        <p>Manage researcher profiles</p>
                    </div>
                    {canCreate && (
                        <button className={styles.addBtn} onClick={() => setShowForm(true)}>
                            + Add Researcher Profile
                        </button>
                    )}
                </header>

                {showForm && (
                    <div className={styles.modal}>
                        <div className={styles.modalContent}>
                            <h2>New Researcher Profile</h2>
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label>User (with RESEARCHER role)</label>
                                    <select
                                        value={formData.user_id}
                                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select User</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Department</label>
                                    <select
                                        value={formData.dept_id}
                                        onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Designation</label>
                                    <select
                                        value={formData.designation}
                                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Designation</option>
                                        <option value="Professor">Professor</option>
                                        <option value="Associate Professor">Associate Professor</option>
                                        <option value="Assistant Professor">Assistant Professor</option>
                                        <option value="Research Scholar">Research Scholar</option>
                                        <option value="Post-Doc">Post-Doc</option>
                                    </select>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>H-Index</label>
                                        <input
                                            type="number"
                                            value={formData.h_index}
                                            onChange={(e) => setFormData({ ...formData, h_index: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Citations</label>
                                        <input
                                            type="number"
                                            value={formData.citations}
                                            onChange={(e) => setFormData({ ...formData, citations: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className={styles.formActions}>
                                    <button type="button" onClick={resetForm} className={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" className={styles.submitBtn}>Create Profile</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className={styles.loading}>Loading researchers...</div>
                ) : researchers.length === 0 ? (
                    <div className={styles.empty}>No researcher profiles found.</div>
                ) : (
                    <div className={styles.grid}>
                        {researchers.map(researcher => (
                            <div key={researcher.id} className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <h3>{researcher.name}</h3>
                                    <span className={styles.badge} style={{ backgroundColor: '#667eea' }}>
                                        {researcher.designation}
                                    </span>
                                </div>
                                <p className={styles.cardDesc}>{researcher.email}</p>
                                <div className={styles.cardMeta}>
                                    <span>🏢 {researcher.department_name}</span>
                                    <span>📊 H-Index: {researcher.h_index || 'N/A'}</span>
                                    <span>📝 Citations: {researcher.citations || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
